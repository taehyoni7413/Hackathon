"""
유학생 식당 도우미 - 백엔드B (가게·위치·도보 길안내·도착 확인)

backend/main.py 가 이 라우터를 /api 아래에 붙인다. (원래 단독 서버 main.py 였던 것을 합침)
실행:  uvicorn backend.main:app --reload
지도 데모:  http://127.0.0.1:8000/api/map
API 확인:   http://127.0.0.1:8000/api/docs
필요한 키(.env): KAKAO_REST_KEY, KAKAO_JS_KEY, TMAP_APP_KEY
"""
import json
import math
import os
import re
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
 
import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import HTMLResponse
 
load_dotenv()  # .env 파일에서 키 읽기
KAKAO_REST_KEY = os.getenv("KAKAO_REST_KEY")
KAKAO_JS_KEY = os.getenv("KAKAO_JS_KEY")
TMAP_APP_KEY = os.getenv("TMAP_APP_KEY")
 
# CORS 설정은 backend/main.py 의 앱에서 한 번만 한다
router = APIRouter(tags=["places"])


@router.get("/places/health")
def health():
    """서버가 살아 있는지 확인"""
    return {"status": "ok", "kakao_key_loaded": bool(KAKAO_REST_KEY), "kakao_js_key_loaded": bool(KAKAO_JS_KEY), "tmap_key_loaded": bool(TMAP_APP_KEY)}
 
 
@router.get("/location")
async def location(
    lat: float = Query(..., ge=-90, le=90, description="위도"),
    lng: float = Query(..., ge=-180, le=180, description="경도"),
):
    """
    현재 위치(좌표)를 받아서
    - 카카오 지도 API로 실제 주소를 찾고
    - 카카오맵에 핀이 찍힌 링크(map_url)를 돌려줌
    """
    map_url = f"https://map.kakao.com/link/map/My%20location,{lat},{lng}"
 
    if not KAKAO_REST_KEY:
        raise HTTPException(500, "KAKAO_REST_KEY가 없습니다. .env 파일을 확인하세요.")
 
    # 카카오 로컬 API: 좌표 → 주소 (x=경도, y=위도 순서 주의)
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            res = await client.get(
                "https://dapi.kakao.com/v2/local/geo/coord2address.json",
                params={"x": lng, "y": lat},
                headers={"Authorization": f"KakaoAK {KAKAO_REST_KEY}"},
            )
    except httpx.HTTPError as e:
        raise HTTPException(502, f"카카오 서버에 연결하지 못했습니다: {e}")
 
    if res.status_code != 200:
        raise HTTPException(502, f"카카오 API 오류 ({res.status_code}): {res.text}")
 
    docs = res.json().get("documents", [])
    if not docs:
        return {"lat": lat, "lng": lng, "address": None, "road_address": None,
                "map_url": map_url, "message": "주소를 찾을 수 없는 좌표입니다 (바다·해외 등)"}
 
    doc = docs[0]
    return {
        "lat": lat,
        "lng": lng,
        "address": doc["address"]["address_name"] if doc.get("address") else None,
        "road_address": doc["road_address"]["address_name"] if doc.get("road_address") else None,
        "map_url": map_url,  # 이 링크를 열면 카카오맵에 내 위치 핀이 보임
    }
 
 
# ---------------------------------------------------------------------
# GPS 테스트용 페이지: 브라우저에서 현재 좌표를 얻어 /location 으로 보냄
# 열기: http://127.0.0.1:8000/gps-test
# (GPS는 브라우저만 얻을 수 있어서, 확인용 최소 페이지만 둠)
# ---------------------------------------------------------------------
GPS_TEST_HTML = """
<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>GPS test</title></head>
<body style="font-family:sans-serif;padding:16px">
<button id="btn" style="font-size:18px;padding:10px 16px">내 위치 보내기</button>
<pre id="out" style="white-space:pre-wrap"></pre>
<script>
const out = document.getElementById('out');
const log = (t) => out.textContent += t + "\\n";
document.getElementById('btn').onclick = () => {
  out.textContent = '';
  if (!navigator.geolocation) return log('이 브라우저는 위치 기능을 지원하지 않아요');
  log('위치 확인 중...');
  const ok = async (p) => {
    const { latitude: lat, longitude: lng, accuracy } = p.coords;
    log(`좌표: lat=${lat}, lng=${lng} (오차 약 ${Math.round(accuracy)}m)`);
    const res = await fetch(`/api/location?lat=${lat}&lng=${lng}`);
    const data = await res.json();
    log('\\n/location 응답:\\n' + JSON.stringify(data, null, 2));
    if (data.map_url) log('\\n지도에서 보기: ' + data.map_url);
  };
  // 정밀 모드 5초 → 실패하면 일반 모드로 재시도
  navigator.geolocation.getCurrentPosition(ok, (e) => {
    log('정밀 위치 실패(' + e.message + ') → 일반 모드로 다시 시도');
    navigator.geolocation.getCurrentPosition(ok, (e2) => log('위치 실패: ' + e2.message),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
  }, { enableHighAccuracy: true, timeout: 5000 });
};
</script></body></html>
"""
 
 
@router.get("/gps-test", response_class=HTMLResponse)
def gps_test():
    return GPS_TEST_HTML
 
 
# =====================================================================
# 가게 / 메뉴 API  (데이터: backend/data/stores.json, backend/data/menus.json)
# =====================================================================
DATA_DIR = Path(__file__).parent / "data"
KST = ZoneInfo("Asia/Seoul")
DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
 
 
# data 폴더나 파일이 없으면 이 기본값으로 자동 생성
SEED = {
    "stores.json": [
        {"id": 1, "name": "Appro", "address": "충북 충주시 충열1길 28 1층",
         "lat": None, "lng": None,
         "description": {"ko": "맛있는 집", "en": "A local favorite with tasty food"},
         "open_hours": {}, "image_url": ""},
        {"id": 2, "name": "밀플랜비 충주건국대점", "address": "충북 충주시 충열4길 5-7",
         "lat": None, "lng": None,
         "description": {"ko": "샌드위치집", "en": "Sandwich shop"},
         "open_hours": {}, "image_url": ""},
        {"id": 3, "name": "면식당 충주건국대점", "address": "충북 충주시 단월동 483-3",
         "lat": None, "lng": None,
         "description": {"ko": "라멘 맛집", "en": "Popular ramen restaurant"},
         "open_hours": {}, "image_url": ""},
    ],
    "menus.json": [],
}
 
 
def load_json(name: str):
    # 매 요청마다 읽음 → JSON 파일 고치면 서버 재시작 없이 바로 반영
    path = DATA_DIR / name
    if not path.exists():
        save_json(name, SEED[name])
    return json.loads(path.read_text(encoding="utf-8"))
 
 
def save_json(name: str, data):
    DATA_DIR.mkdir(exist_ok=True)
    (DATA_DIR / name).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
 
 
def geocode(address: str, name: str = ""):
    """주소 → (lat, lng). 주소 검색 → '1층' 등 제거 후 재검색 → 가게 이름 검색 순서로 시도"""
    headers = {"Authorization": f"KakaoAK {KAKAO_REST_KEY}"}
    base = "https://dapi.kakao.com/v2/local/search"
    tries = [("address", address), ("address", re.sub(r"\s*\d+층.*$", "", address))]
    if name:
        tries.append(("keyword", f"충주 {name}"))
    for kind, q in tries:
        res = httpx.get(f"{base}/{kind}.json", params={"query": q}, headers=headers, timeout=5)
        if res.status_code != 200:
            raise RuntimeError(f"카카오 API 오류 ({res.status_code}): {res.text}")
        docs = res.json().get("documents", [])
        if docs:
            return float(docs[0]["y"]), float(docs[0]["x"])
    return None
 
 
def load_stores():
    """가게 목록을 읽고, 좌표가 비어 있으면 주소로 자동 변환해서 파일에 저장"""
    stores = load_json("stores.json")
    changed = False
    for s in stores:
        if s.get("lat") is None and s.get("address") and KAKAO_REST_KEY:
            try:
                pos = geocode(s["address"], s.get("name", ""))
            except Exception as e:
                print(f"[좌표 변환 실패] {s['name']}: {e}")
                continue
            if pos:
                s["lat"], s["lng"] = pos
                changed = True
                print(f"[좌표 변환] {s['name']} → {pos}")
            else:
                print(f"[좌표 못 찾음] {s['name']}: 주소를 확인하세요")
    if changed:
        save_json("stores.json", stores)
    return stores
 
 
def haversine_m(lat1, lng1, lat2, lng2) -> int:
    r = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return round(2 * r * math.asin(math.sqrt(a)))
 
 
def is_open_now(hours: dict):
    """True/False, 정보 없으면 None. 형식: {"mon": "11:00-21:00", "sun": null(휴무)}"""
    if not hours:
        return None
    now = datetime.now(KST)
    cur = now.hour * 60 + now.minute
    to_min = lambda t: int(t.split(":")[0]) * 60 + int(t.split(":")[1])
 
    def parse(r):
        s, e = r.split("-")
        return to_min(s.strip()), to_min(e.strip())
 
    today = hours.get(DAYS[now.weekday()])
    yest = hours.get(DAYS[(now.weekday() - 1) % 7])
    if today:
        s, e = parse(today)
        if (s <= cur < e) if e > s else (cur >= s):  # 자정 넘는 영업 처리
            return True
    if yest:
        s, e = parse(yest)
        if e <= s and cur < e:
            return True
    return False
 
 
def with_status(store: dict) -> dict:
    return {**store,
            "is_open": is_open_now(store.get("open_hours")),
            "today_hours": (store.get("open_hours") or {}).get(DAYS[datetime.now(KST).weekday()])}
 
 
@router.get("/stores")
def list_stores(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius: int = Query(1000, ge=1, le=20000, description="반경(m)"),
):
    """내 좌표 기준 반경 안 가게 목록, 가까운 순 (좌표 없는 가게는 제외)"""
    result = []
    for s in load_stores():
        if s.get("lat") is None or s.get("lng") is None:
            continue
        d = haversine_m(lat, lng, s["lat"], s["lng"])
        if d <= radius:
            result.append({**with_status(s), "distance_m": d})
    return sorted(result, key=lambda x: x["distance_m"])
 
 
@router.get("/stores/all")
def all_stores():
    """위치 상관없이 전체 가게 (지도에 핀 찍기용)"""
    return [with_status(s) for s in load_stores()]
 
 
@router.get("/stores/{store_id}")
def get_store(store_id: int):
    for s in load_stores():
        if s["id"] == store_id:
            return with_status(s)
    raise HTTPException(404, "가게를 찾을 수 없습니다")
 
 
@router.get("/stores/{store_id}/menus")
def get_menus(store_id: int, lang: str = "en"):
    """메뉴 목록. 선택 언어 번역을 name/description으로 펼쳐줌 (없으면 영어 → 한국어)"""
    get_store(store_id)  # 없는 가게면 404
    out = []
    for m in load_json("menus.json"):
        if m["store_id"] != store_id:
            continue
        tr = m.get("translations", {})
        t = tr.get(lang) or tr.get("en") or {}
        out.append({**m, "name": t.get("name") or m["name_ko"], "description": t.get("description", "")})
    return out
 
 
# =====================================================================
# 지도 데모 페이지: 가게 핀 + 클릭하면 정보 + 내 위치 + 도보 길 안내(TMAP)
# 열기: http://127.0.0.1:8000/map
# =====================================================================
MAP_HTML = """
<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Store map demo</title>
<style>
  body { margin:0; font-family:-apple-system,"Segoe UI",sans-serif; }
  #map { width:100%; height:60vh; }
  #bar { padding:10px; display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  button { padding:8px 12px; border:1px solid #ccc; border-radius:8px; background:#fff; font-size:14px; cursor:pointer; color:#222; }
  .primary { background:#ffe300; border-color:#e6cc00; font-weight:600; }
  .danger { background:#fde8e8; border-color:#f5b5b5; }
  #msg { font-size:13px; color:#666; }
  #info { padding:12px 14px; }
  #info h3 { margin:0 0 6px; }
  #info p { margin:4px 0; }
  .muted { color:#777; font-size:13px; }
  .row { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; }
  #nav { margin-top:10px; padding:10px; border-radius:8px; background:#eef6ff; display:none; }
  #nav .next { font-size:17px; font-weight:700; margin:4px 0; }
  #steps { margin:8px 0 0; padding-left:20px; font-size:13px; color:#444; }
  .me { width:14px; height:14px; background:#1e88e5; border:3px solid #fff; border-radius:50%; box-shadow:0 0 0 4px rgba(30,136,229,.3); }
</style></head><body>
<div id="bar">
  <button id="btnAll">가게 전체 보기</button>
  <button id="btnMe">📍 내 위치</button>
  <span id="msg">불러오는 중...</span>
</div>
<div id="map"></div>
<div id="info"><span class="muted">핀을 누르면 가게 정보가 나와요.</span></div>
 
<script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=__JS_KEY__&autoload=false"></script>
<script>
const ARRIVE_M = 30;        // 가게까지 이 거리 안이면 도착
const OFF_ROUTE_M = 40;     // 경로에서 이만큼 벗어나면 경로 다시 찾기
const REROUTE_GAP_MS = 15000;
const DEMO_POS = { lat: 36.9493, lng: 127.9035 };  // 위치를 못 받을 때 쓰는 학교 앞 좌표 (가게 3곳 근처)
 
const msg = document.getElementById('msg');
const info = document.getElementById('info');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDist = (m) => m < 1000 ? `${Math.round(m)}m` : `${(m/1000).toFixed(1)}km`;
const fmtMin = (s) => `${Math.max(1, Math.round(s / 60))}분`;
 
function distM(a, b) {
  const R = 6371000, r = (d) => d * Math.PI / 180;
  const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat/2)**2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
 
if (typeof kakao === 'undefined') {
  msg.textContent = '지도를 못 불러왔어요: .env의 KAKAO_JS_KEY, 카카오맵 사용 설정, JavaScript SDK 도메인 등록을 확인하세요.';
} else {
  kakao.maps.load(init);
}
 
async function init() {
  const map = new kakao.maps.Map(document.getElementById('map'), {
    center: new kakao.maps.LatLng(DEMO_POS.lat, DEMO_POS.lng), level: 4,
  });
  const iw = new kakao.maps.InfoWindow({ removable: true });
  const LL = (p) => new kakao.maps.LatLng(p.lat, p.lng);
 
  const stores = await (await fetch('/api/stores/all')).json();
  const placed = stores.filter(s => s.lat != null && s.lng != null);
  const missing = stores.filter(s => s.lat == null || s.lng == null);
 
  let me = null, meOverlay = null, selected = null, watchId = null, usingDemo = false;
  let route = null, routeLine = null, lastRouteAt = 0, rerouting = false;
 
  // ---------- 내 위치 ----------
  function setMe(lat, lng, acc) {
    me = { lat, lng, acc };
    if (meOverlay) meOverlay.setMap(null);
    meOverlay = new kakao.maps.CustomOverlay({ position: LL(me), content: '<div class="me"></div>', map, zIndex: 5 });
  }
  // 위치 얻기: ① 정밀(GPS) 5초 → ② 일반(Wi-Fi) 15초 → ③ 데모 위치. 절대 실패로 끝나지 않음
  const geo = (opts) => new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, opts));
  async function getMe() {
    usingDemo = false;
    if (navigator.geolocation) {
      let denied = false;
      try {
        const p = await geo({ enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
        setMe(p.coords.latitude, p.coords.longitude, p.coords.accuracy); return me;
      } catch (e) { denied = e.code === 1; }  // 1 = 권한 거부 → 다시 물어봐도 소용없음
      if (!denied) {
        try {
          const p = await geo({ enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
          setMe(p.coords.latitude, p.coords.longitude, p.coords.accuracy); return me;
        } catch (e) { /* 아래 데모 위치로 */ }
      }
    }
    usingDemo = true;
    setMe(DEMO_POS.lat, DEMO_POS.lng, 0);
    msg.textContent = '⚠️ 위치를 못 받아서 데모 위치(학교 앞)를 사용 중이에요';
    return me;
  }
  const fit = (points) => {
    if (!points.length) return;
    const b = new kakao.maps.LatLngBounds(); points.forEach(p => b.extend(LL(p)));
    map.setBounds(b, 60, 60, 60, 60);
  };
 
  // ---------- 도보 경로 (서버 /route → TMAP) ----------
  async function loadRoute() {
    lastRouteAt = Date.now();
    const res = await fetch(`/api/route?from_lat=${me.lat}&from_lng=${me.lng}&store_id=${selected.id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || '경로를 불러오지 못했어요');
    const path = data.path.map(([lat, lng]) => ({ lat, lng }));
    // 끝에서부터 누적 거리 (남은 거리 계산용)
    const remain = new Array(path.length).fill(0);
    for (let i = path.length - 2; i >= 0; i--) remain[i] = remain[i + 1] + distM(path[i], path[i + 1]);
    // 각 안내 지점이 경로의 몇 번째 점인지
    const nearestIdx = (p) => path.reduce((best, q, i) => (distM(p, q) < distM(p, path[best]) ? i : best), 0);
    const steps = data.steps.map(s => ({ ...s, idx: nearestIdx(s) }));
    const speed = data.total_distance_m && data.total_time_s ? data.total_distance_m / data.total_time_s : 1.1; // m/s
    route = { path, remain, steps, speed, total: data.total_distance_m, time: data.total_time_s };
    drawRoute();
  }
  function drawRoute() {
    if (routeLine) routeLine.setMap(null);
    if (!route) return;
    routeLine = new kakao.maps.Polyline({ path: route.path.map(LL), strokeWeight: 6,
      strokeColor: '#1e88e5', strokeOpacity: 0.9, strokeStyle: 'solid', map });
  }
  function clearRoute() { route = null; if (routeLine) { routeLine.setMap(null); routeLine = null; } }
 
  // 내 위치가 경로의 어디쯤인지 → 남은 거리, 다음 안내
  function progress() {
    let idx = 0, off = Infinity;
    route.path.forEach((q, i) => { const d = distM(me, q); if (d < off) { off = d; idx = i; } });
    const left = route.remain[idx] + off;
    const next = route.steps.find(s => s.idx > idx) || route.steps[route.steps.length - 1];
    return { idx, off, left, next };
  }
 
  // ---------- 가게 정보 ----------
  function showStore(s) {
    stopNav();
    clearRoute();
    selected = s;
    info.innerHTML = `
      <h3>${esc(s.name)}</h3>
      <p>${esc(s.description?.en)}</p>
      <p class="muted">${esc(s.description?.ko)}</p>
      <p class="muted">📍 ${esc(s.address)}</p>
      <div class="row">
        <button class="primary" id="btnRoute">🚶 도보 길 안내 시작</button>
        <button id="btnKakao">카카오맵으로 열기</button>
      </div>
      <div id="nav"></div>`;
    document.getElementById('btnRoute').onclick = startNav;
    document.getElementById('btnKakao').onclick = openKakaoRoute;
  }
 
  // ---------- 길 안내 ----------
  async function startNav() {
    if (!selected) return;
    const nav = document.getElementById('nav');
    nav.style.display = 'block';
    nav.textContent = '내 위치 확인 중...';
    try { await getMe(); } catch (e) { nav.textContent = '위치 실패: ' + e.message; return; }
    nav.textContent = '도보 경로 찾는 중...';
    try { await loadRoute(); }
    catch (e) { nav.textContent = '경로 실패: ' + e.message; return; }
    fit([me, selected, ...route.path]);
    renderNav();
 
    if (!usingDemo) startWatch(true);  // 데모 위치면 따라갈 위치가 없음
  }
 
  // 이동 따라가기: 정밀 모드로 시작 → 시간초과·실패하면 일반 모드로 전환
  function startWatch(high) {
    if (watchId != null) navigator.geolocation.clearWatch(watchId);
    watchId = navigator.geolocation.watchPosition(p => {
      setMe(p.coords.latitude, p.coords.longitude, p.coords.accuracy);
      renderNav();
      map.panTo(LL(me));
    }, e => {
      if (high && e.code !== 1) { startWatch(false); return; }   // 정밀 실패 → 일반 모드로
      if (e.code !== 3) msg.textContent = '위치 추적 실패: ' + e.message;
    }, high ? { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 }
            : { enableHighAccuracy: false, maximumAge: 10000, timeout: 20000 });
  }
 
  function renderNav() {
    const nav = document.getElementById('nav');
    if (!nav || !me || !selected || !route) return;
 
    if (distM(me, selected) <= ARRIVE_M) {
      nav.innerHTML = `🎉 <b>도착했어요!</b><br>${esc(selected.name)}`;
      stopNav();
      return;
    }
    const { off, left, next } = progress();
 
    // 경로에서 많이 벗어나면 다시 찾기
    if (off > OFF_ROUTE_M && !rerouting && Date.now() - lastRouteAt > REROUTE_GAP_MS) {
      rerouting = true;
      msg.textContent = '경로를 벗어나서 다시 찾는 중...';
      loadRoute().then(() => { msg.textContent = '새 경로로 안내해요'; renderNav(); })
                 .catch(e => (msg.textContent = '재탐색 실패: ' + e.message))
                 .finally(() => (rerouting = false));
    }
 
    const toNext = next ? distM(me, next) : 0;
    nav.innerHTML = `
      <div>목적지 <b>${esc(selected.name)}</b> · 전체 ${fmtDist(route.total)} / 약 ${fmtMin(route.time)}</div>
      <div class="next">${next ? `${fmtDist(toNext)} 앞: ${esc(next.text)}` : '경로를 따라 이동하세요'}</div>
      <div>남은 거리 <b>${fmtDist(left)}</b> · 약 <b>${fmtMin(left / route.speed)}</b></div>
      <div class="muted">위치 오차 약 ${Math.round(me.acc)}m</div>
      <details><summary class="muted">전체 안내 보기 (${route.steps.length}단계)</summary>
        <ol id="steps">${route.steps.map(s => `<li>${esc(s.text)}</li>`).join('')}</ol></details>
      <div class="row"><button class="primary" id="btnArrived">✅ 목적지에 도착했어요!</button>
        <button class="danger" id="btnStop">안내 종료</button></div>
      <div id="arrivalResult"></div>`;
    document.getElementById('btnStop').onclick = () => { stopNav(); clearRoute(); nav.style.display = 'none'; };
    document.getElementById('btnArrived').onclick = checkArrival;
  }
  // ---------- 도착 확인 (서버 /arrival) ----------
  async function checkArrival() {
    const out = document.getElementById('arrivalResult');
    out.textContent = '위치 확인 중...';
    try { await getMe(); } catch (e) { out.textContent = '위치 실패: ' + e.message; return; }
    const r = await fetch(`/api/arrival?store_id=${selected.id}&lat=${me.lat}&lng=${me.lng}&accuracy=${Math.round(me.acc || 0)}`);
    const d = await r.json();
    if (!r.ok) { out.textContent = d.detail || '확인 실패'; return; }
    const color = { arrived: '#1b8a3a', uncertain: '#b26a00', not_arrived: '#c62828' }[d.status];
    out.innerHTML = `<p style="color:${color};font-weight:600">${esc(d.message.ko)}</p>
      <p class="muted">${esc(d.message.en)} (거리 ${d.distance_m}m / 허용 ${d.allowed_m}m)</p>`;
    if (d.arrived) stopNav();
  }
  function stopNav() {
    if (watchId != null) { navigator.geolocation.clearWatch(watchId); watchId = null; }
  }
 
  // ---------- 카카오맵으로 열기 (보조) ----------
  async function openKakaoRoute() {
    if (!selected) return;
    try { if (!me) await getMe(); } catch (e) { msg.textContent = '위치 실패: ' + e.message; return; }
    const clean = (t) => encodeURIComponent(String(t).replace(/,/g, ' '));
    const web = `https://map.kakao.com/link/from/${clean('내 위치')},${me.lat},${me.lng}/to/${clean(selected.name)},${selected.lat},${selected.lng}`;
    const app = `kakaomap://route?sp=${me.lat},${me.lng}&ep=${selected.lat},${selected.lng}&by=FOOT`;
    if (!/Android|iPhone|iPad/i.test(navigator.userAgent)) return window.open(web, '_blank');
    const t = setTimeout(() => { if (!document.hidden) location.href = web; }, 1500);
    document.addEventListener('visibilitychange', () => document.hidden && clearTimeout(t), { once: true });
    location.href = app;
  }
 
  // ---------- 핀 ----------
  placed.forEach(s => {
    const marker = new kakao.maps.Marker({ position: LL(s), map, title: s.name });
    kakao.maps.event.addListener(marker, 'click', () => {
      iw.setContent(`<div style="padding:6px 10px;font-size:13px;white-space:nowrap"><b>${esc(s.name)}</b></div>`);
      iw.open(map, marker);
      showStore(s);
    });
  });
 
  fit(placed);
  msg.textContent = `가게 ${placed.length}곳 표시` + (missing.length ? ` · 좌표 없음: ${missing.map(s => s.name).join(', ')} (서버 터미널 로그 확인)` : '');
  document.getElementById('btnAll').onclick = () => fit(placed);
  document.getElementById('btnMe').onclick = async () => {
    msg.textContent = '내 위치 확인 중...';
    await getMe();
    if (!usingDemo) msg.textContent = `내 위치 표시 (오차 약 ${Math.round(me.acc)}m)`;
    fit(selected ? [me, selected] : [me, ...placed]);
  };
}
</script></body></html>
"""
 
 
@router.get("/map", response_class=HTMLResponse)
def map_page():
    return MAP_HTML.replace("__JS_KEY__", KAKAO_JS_KEY or "")
 
 
# =====================================================================
# 도보 길찾기 API (TMAP 보행자 경로) — 키는 서버에만 있고 프론트에는 안 나감
# GET /route?from_lat=&from_lng=&store_id=1
# =====================================================================
TMAP_SEARCH_OPTION = "10"  # 10 = 최단거리 (0 = 추천, 30 = 최단거리+계단 제외)
 
 
@router.get("/route")
async def walking_route(
    from_lat: float = Query(..., ge=-90, le=90),
    from_lng: float = Query(..., ge=-180, le=180),
    store_id: int = Query(...),
):
    """현재 위치 → 가게 도보 최단 경로. path: [[lat,lng],...], steps: 회전 안내"""
    if not TMAP_APP_KEY:
        raise HTTPException(500, "TMAP_APP_KEY가 없습니다. .env 파일을 확인하세요.")
    store = get_store(store_id)
    if store.get("lat") is None:
        raise HTTPException(400, "가게 좌표가 아직 없습니다.")
 
    body = {
        "startX": str(from_lng), "startY": str(from_lat),
        "endX": str(store["lng"]), "endY": str(store["lat"]),
        "startName": "start", "endName": "end",
        "reqCoordType": "WGS84GEO", "resCoordType": "WGS84GEO",
        "searchOption": TMAP_SEARCH_OPTION,
    }
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            res = await client.post(
                "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1",
                json=body, headers={"appKey": TMAP_APP_KEY, "Accept": "application/json"},
            )
    except httpx.HTTPError as e:
        raise HTTPException(502, f"TMAP 서버에 연결하지 못했습니다: {e}")
    if res.status_code != 200:
        raise HTTPException(502, f"TMAP API 오류 ({res.status_code}): {res.text[:300]}")
 
    features = res.json().get("features", [])
    if not features:
        raise HTTPException(404, "경로를 찾지 못했습니다.")
 
    path, steps = [], []
    for f in features:
        geom, props = f.get("geometry", {}), f.get("properties", {})
        if geom.get("type") == "LineString":
            for lng, lat in geom.get("coordinates", []):
                if not path or path[-1] != [lat, lng]:
                    path.append([lat, lng])
        elif geom.get("type") == "Point" and props.get("description"):
            lng, lat = geom["coordinates"]
            steps.append({"lat": lat, "lng": lng, "text": props["description"],
                          "turn_type": props.get("turnType")})
 
    first = features[0].get("properties", {})
    return {
        "store_id": store_id,
        "total_distance_m": first.get("totalDistance"),
        "total_time_s": first.get("totalTime"),
        "path": path,
        "steps": steps,
    }
 
 
# =====================================================================
# 도착 확인 API: 프론트의 "목적지에 도착했어요!" 버튼이 호출
# GET /arrival?store_id=1&lat=..&lng=..&accuracy=..
#   - arrived      : 가게 50m 안 → 도착 맞음
#   - uncertain    : 거리는 조금 멀지만 GPS 오차 범위 안 → "확실하지 않음"
#   - not_arrived  : 오차를 감안해도 멀다 → "현재 위치가 목적지와 달라요"
# =====================================================================
ARRIVE_RADIUS_M = 50       # 이 거리 안이면 도착
MAX_ACCURACY_BONUS_M = 100  # GPS 오차를 최대 이만큼까지 봐줌
 
 
def bearing_ko(lat1, lng1, lat2, lng2) -> str:
    """내 위치에서 목적지가 어느 방향인지 (8방위)"""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dl = math.radians(lng2 - lng1)
    x = math.sin(dl) * math.cos(p2)
    y = math.cos(p1) * math.sin(p2) - math.sin(p1) * math.cos(p2) * math.cos(dl)
    deg = (math.degrees(math.atan2(x, y)) + 360) % 360
    names = [("북쪽", "north"), ("북동쪽", "northeast"), ("동쪽", "east"), ("남동쪽", "southeast"),
             ("남쪽", "south"), ("남서쪽", "southwest"), ("서쪽", "west"), ("북서쪽", "northwest")]
    return names[round(deg / 45) % 8]
 
 
@router.get("/arrival")
def check_arrival(
    store_id: int = Query(..., description="목적지 가게 id"),
    lat: float = Query(..., ge=-90, le=90, description="현재 위도"),
    lng: float = Query(..., ge=-180, le=180, description="현재 경도"),
    accuracy: float = Query(0, ge=0, description="GPS 오차(m), 브라우저 coords.accuracy 값"),
):
    """현재 위치가 목적지 가게와 맞는지 확인"""
    store = get_store(store_id)
    if store.get("lat") is None:
        raise HTTPException(400, "가게 좌표가 아직 없습니다.")
 
    d = haversine_m(lat, lng, store["lat"], store["lng"])
    allowed = ARRIVE_RADIUS_M + min(accuracy, MAX_ACCURACY_BONUS_M)
    dir_ko, dir_en = bearing_ko(lat, lng, store["lat"], store["lng"])
 
    # 혹시 다른 가게 앞에 있는 건지 확인
    nearby = None
    for s in load_stores():
        if s["id"] != store_id and s.get("lat") is not None:
            ds = haversine_m(lat, lng, s["lat"], s["lng"])
            if ds <= ARRIVE_RADIUS_M and (nearby is None or ds < nearby["distance_m"]):
                nearby = {"id": s["id"], "name": s["name"], "distance_m": ds}
 
    if d <= ARRIVE_RADIUS_M:
        status = "arrived"
        msg_ko = f"{store['name']}에 도착했어요!"
        msg_en = f"You have arrived at {store['name']}!"
    elif d <= allowed:
        status = "uncertain"
        msg_ko = f"위치 오차(약 {round(accuracy)}m) 때문에 확실하지 않아요. {store['name']} 앞이 맞나요?"
        msg_en = f"GPS is not precise (about {round(accuracy)}m). Are you in front of {store['name']}?"
    else:
        status = "not_arrived"
        msg_ko = f"현재 위치가 목적지와 달라요. {store['name']}까지 {dir_ko}으로 약 {d}m 남았어요."
        msg_en = f"You are not at the destination yet. {store['name']} is about {d}m to the {dir_en}."
        if nearby:
            msg_ko += f" 혹시 {nearby['name']}에 계신가요?"
            msg_en += f" Are you at {nearby['name']}?"
 
    return {
        "store_id": store_id,
        "store_name": store["name"],
        "status": status,                 # arrived / uncertain / not_arrived
        "arrived": status == "arrived",
        "distance_m": d,
        "allowed_m": round(allowed),
        "direction": {"ko": dir_ko, "en": dir_en},
        "nearby_store": nearby,           # 다른 가게 앞일 때만 값 있음
        "message": {"ko": msg_ko, "en": msg_en},
    }