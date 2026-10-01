// 서비스 워커: 발표장 네트워크가 불안정해도 한 번 열어본 화면은 다시 열리도록
// - 페이지 이동: 네트워크 우선, 실패하면 캐시
// - 같은 출처 정적 파일(/_next/static, 이미지, 아이콘): 캐시 우선
// - /api/* 와 다른 출처(카카오맵, OSRM 등)는 건드리지 않음
const CACHE = "buk-v3"; // 메뉴 사진처럼 같은 주소의 파일 내용이 바뀌면 숫자를 올린다
const PRECACHE = ["/", "/language", "/map", "/manifest.webmanifest", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    /\.(png|jpg|jpeg|webp|svg|gif|ico|woff2?)$/.test(url.pathname);

  if (isStatic) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // 페이지·RSC 요청: 네트워크 우선
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches
          .match(req)
          .then((hit) => hit || (req.mode === "navigate" ? caches.match("/map") : undefined))
          .then((hit) => hit || new Response("offline", { status: 503 })),
      ),
  );
});
