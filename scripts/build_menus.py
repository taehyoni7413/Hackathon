"""팀원이 올린 메뉴 사진(파일명 = 메뉴명_가격) → backend/data/menus.json + web/public/stores/{id}/

실행: .venv\\Scripts\\python scripts\\build_menus.py   (MOCK_LLM=0, OPENAI_API_KEY 필요)

- 사진 폴더(SOURCES)의 `메뉴명_가격(원).jpg|png` 를 메뉴로, `메뉴판.*` 을 원본 메뉴판으로 쓴다
- 사진은 web/public/stores/{가게 id}/ 에 영문 파일명으로 복사 (URL에 한글·공백·괄호가 없도록)
- 번역·발음·재료·알레르기·식단·맵기·메뉴 분류는 gpt-6-luna 로 추정 (앱에 "AI 추정" 안내가 붙음)
  결과는 backend/data/menu_ai.json 에 메뉴명 기준으로 저장 → 다시 실행해도 새 메뉴만 AI 호출
- 밀플랜비의 (단품)/(세트 A)/(세트 B) 사진은 메뉴 1개 + 세트 옵션으로 합친다
"""
import json
import os
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
os.environ.setdefault("MOCK_LLM", "0")

from backend import llm  # noqa: E402

DATA = ROOT / "backend" / "data"
PUBLIC = ROOT / "web" / "public" / "stores"
AI_CACHE = DATA / "menu_ai.json"

# 가게 id → 사진 폴더 (팀원이 올린 위치 그대로)
SOURCES = {
    1: ROOT / "Appro_메뉴사진",
    2: ROOT / "밀플랜비_메뉴사진",
    3: ROOT / "assets" / "menu_photos" / "myeonsikdang_chungju_geongukdae",
}
# 면식당은 네이버 메뉴 순서를 menu_images.json 에 남겨 둠
ORDER_FILE = {3: SOURCES[3] / "menu_images.json"}
BOARD_NAMES = {"메뉴판", "menu_board_01"}
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp"}

# 파일명 꼬리표 → 메뉴 이름 표기
SUFFIX = {"half": "(하프)", "2p": "(2개)", "4p": "(4개)", "5p": "(5개)", "면대신밥": "(면 대신 밥)"}

SET_RE = re.compile(r"^(.*?)\s*\((단품|세트 A.*|세트 B.*)\)$")
SET_OPTIONS = {
    "A": {"id": "set_a", "type": "add", "group": "set", "name_ko": "세트 A로 주세요 (+콜라)",
          "translations": {"zh": "A套餐（+可乐）", "en": "Set A (+ cola)"}},
    "B": {"id": "set_b", "type": "add", "group": "set", "name_ko": "세트 B로 주세요 (+감자튀김+콜라)",
          "translations": {"zh": "B套餐（+薯条+可乐）", "en": "Set B (+ fries + cola)"}},
}
LESS_SPICY = {"id": "less_spicy", "type": "spicy", "name_ko": "덜 맵게 해주세요", "translations": {"zh": "少辣", "en": "Less spicy"}}
NOT_SPICY = {"id": "not_spicy", "type": "spicy", "name_ko": "안 맵게 해주세요", "translations": {"zh": "不要辣", "en": "Not spicy"}}
NO_ONION = {"id": "no_onion", "type": "remove", "name_ko": "양파는 빼주세요", "translations": {"zh": "不要洋葱", "en": "No onion"}}
NO_GREEN_ONION = {"id": "no_green_onion", "type": "remove", "name_ko": "파는 빼주세요", "translations": {"zh": "不要葱", "en": "No green onion"}}
NO_CILANTRO = {"id": "no_cilantro", "type": "remove", "name_ko": "고수는 빼주세요", "translations": {"zh": "不要香菜", "en": "No cilantro"}}


def parse_name(stem: str) -> tuple[str, int] | None:
    name, _, price = stem.rpartition("_")
    price = price.replace("원", "").replace(",", "")
    if not name or not price.isdigit():
        return None
    name = name.removeprefix("Appro ").strip()
    if "_" in name:
        base, _, tail = name.rpartition("_")
        name = f"{base} {SUFFIX[tail]}" if tail in SUFFIX else f"{base} {tail}" if base in ("마라", "초계") else f"{base}_{tail}"
        name = name.replace("_", " ")
    return name, int(price)


def scan(store_id: int):
    """→ (메뉴 목록 [{name_ko, price, image, options}], 메뉴판 사진 경로 목록)"""
    folder = SOURCES[store_id]
    files = [p for p in folder.iterdir() if p.suffix.lower() in IMAGE_EXT]
    boards = sorted(p for p in files if p.stem in BOARD_NAMES)
    # 같은 메뉴판이 두 이름으로 있으면 하나만
    if len(boards) > 1 and len({p.stat().st_size for p in boards}) == 1:
        boards = boards[:1]
    items = [p for p in files if p.stem not in BOARD_NAMES]
    if store_id in ORDER_FILE:
        order = [e["file"] for e in json.loads(ORDER_FILE[store_id].read_text(encoding="utf-8"))]
        items.sort(key=lambda p: order.index(p.name) if p.name in order else len(order))
    else:
        items.sort(key=lambda p: p.name)

    menus: dict[str, dict] = {}
    sets: dict[str, dict[str, int]] = {}
    for p in items:
        parsed = parse_name(p.stem)
        if not parsed:
            print("  건너뜀(파일명 형식 아님):", p.name)
            continue
        name, price = parsed
        m = SET_RE.match(name)
        if m:  # 밀플랜비 단품/세트
            base, kind = m.group(1).strip(), m.group(2)
            sets.setdefault(base, {})["단품" if kind == "단품" else kind[3]] = price
            if kind == "단품":
                menus[base] = {"name_ko": base, "price": price, "image": p, "options": []}
            continue
        menus.setdefault(name, {"name_ko": name, "price": price, "image": p, "options": []})
    for base, prices in sets.items():
        single = prices.get("단품")
        if base not in menus or single is None:
            continue
        for k in ("A", "B"):
            if k in prices:
                menus[base]["options"].append({**SET_OPTIONS[k], "price_delta": prices[k] - single})
    return list(menus.values()), boards


AI_SYSTEM = """You prepare menu data for international students (Chinese and English speakers) at a Korean restaurant.
For each Korean menu name, estimate from the name and common Korean restaurant recipes. Return JSON: {"items": [...]} with one object per input, same order, fields:
name_ko (copy input exactly), menu_category (short Korean group like 라멘, 소바, 우동, 카츠, 덮밥, 파스타, 전골, 구이, 안주, 부리또, 핫도그, 사이드, 음료, 주류),
menu_category_en, menu_category_zh, pronunciation (Revised Romanization of name_ko, lowercase, hyphens between words),
zh_name, zh_description, en_name, en_description (descriptions: one short sentence about taste and main ingredients; empty string for plain canned drinks),
ingredients (3-5 main ingredients in Korean), allergens (subset in Korean of: 밀, 대두, 우유, 계란, 땅콩, 새우, 게, 돼지고기, 소고기, 닭고기, 고등어, 오징어, 조개류, 메밀, 복숭아, 토마토, 호두, 잣, 아황산류),
contains_pork (true/false/null if unsure), contains_alcohol (true for alcoholic drinks or mirin-heavy sauces, else false/null),
halal ("yes"/"no"/"unknown"; pork or alcohol → "no"; non-certified meat → "unknown"), vegan ("yes"/"no"/"unknown"), spicy (0 none, 1 mild, 2 medium, 3 hot).
Output only the JSON object."""

FIELDS = ["menu_category", "menu_category_en", "menu_category_zh", "pronunciation", "zh_name", "zh_description",
          "en_name", "en_description", "ingredients", "allergens", "contains_pork", "contains_alcohol", "halal", "vegan", "spicy"]


def enrich(names: list[str], store_name: str, cache: dict) -> None:
    todo = [n for n in names if n not in cache]
    for i in range(0, len(todo), 12):
        batch = todo[i:i + 12]
        print(f"  AI 추정 {i + 1}~{i + len(batch)} / {len(todo)}")
        prompt = json.dumps({"restaurant": store_name, "menus": batch}, ensure_ascii=False)
        text = llm.ask(prompt, system=AI_SYSTEM)
        data = json.loads(text[text.find("{"): text.rfind("}") + 1])
        for name, item in zip(batch, data["items"]):
            if all(k in item for k in FIELDS):
                cache[name] = {k: item[k] for k in FIELDS}
            else:
                print("  AI 응답 누락:", name)
        AI_CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def tri(v) -> str:
    return v if v in ("yes", "no", "unknown") else "unknown"


def auto_options(ai: dict) -> list[dict]:
    opts = []
    if int(ai.get("spicy") or 0) >= 1:
        opts += [LESS_SPICY, NOT_SPICY]
    ing = " ".join(ai.get("ingredients") or [])
    if "양파" in ing:
        opts.append(NO_ONION)
    if "대파" in ing or "쪽파" in ing or re.search(r"(^|\s)파($|\s)", ing):
        opts.append(NO_GREEN_ONION)
    if "고수" in ing:
        opts.append(NO_CILANTRO)
    return opts


def main():
    stores = json.loads((DATA / "stores.json").read_text(encoding="utf-8"))
    cache = json.loads(AI_CACHE.read_text(encoding="utf-8")) if AI_CACHE.exists() else {}
    out, next_id = [], 1
    for store in stores:
        sid = store["id"]
        if sid not in SOURCES or not SOURCES[sid].exists():
            continue
        print(f"[{sid}] {store['name']}")
        menus, boards = scan(sid)
        enrich([m["name_ko"] for m in menus], store["name"], cache)

        dest = PUBLIC / str(sid)
        shutil.rmtree(dest, ignore_errors=True)
        (dest / "menu").mkdir(parents=True)
        store["menu_board_images"] = []
        for i, b in enumerate(boards, 1):
            shutil.copy2(b, dest / f"menu_board_{i:02d}{b.suffix.lower()}")
            store["menu_board_images"].append(f"/stores/{sid}/menu_board_{i:02d}{b.suffix.lower()}")

        for m in menus:
            ai = cache.get(m["name_ko"])
            if not ai:
                continue
            img = f"menu/{next_id:03d}{m['image'].suffix.lower()}"
            shutil.copy2(m["image"], dest / img)
            out.append({
                "id": next_id,
                "store_id": sid,
                "menu_category": ai["menu_category"],
                "menu_category_name": {"ko": ai["menu_category"], "zh": ai["menu_category_zh"], "en": ai["menu_category_en"]},
                "name_ko": m["name_ko"],
                "pronunciation": ai["pronunciation"],
                "translations": {
                    "ko": {"name": m["name_ko"]},
                    "zh": {"name": ai["zh_name"], "description": ai["zh_description"]},
                    "en": {"name": ai["en_name"], "description": ai["en_description"]},
                },
                "price": m["price"],
                "image_url": f"/stores/{sid}/{img}",
                "ingredients": ai["ingredients"],
                "allergens": ai["allergens"],
                "contains_pork": ai["contains_pork"],
                "contains_alcohol": ai["contains_alcohol"],
                "halal": tri(ai["halal"]),
                "vegan": tri(ai["vegan"]),
                "spicy": max(0, min(3, int(ai["spicy"] or 0))),
                "options": m["options"] + auto_options(ai),
            })
            next_id += 1
        # 가게 대표 사진 = 첫 메뉴 사진
        first = next((x for x in out if x["store_id"] == sid), None)
        if first:
            store["image_url"] = first["image_url"]
        print(f"  메뉴 {sum(1 for x in out if x['store_id'] == sid)}개, 메뉴판 {len(boards)}장")

    (DATA / "menus.json").write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (DATA / "stores.json").write_text(json.dumps(stores, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("완료: 메뉴", len(out))


if __name__ == "__main__":
    main()
