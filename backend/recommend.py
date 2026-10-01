"""AI 맞춤 추천: "고기가 먹고 싶어요" 같은 손님 말 → 우리 가게 메뉴 중에서만 골라 추천.

- 메뉴 후보는 backend/data/menus.json (+ 가게 이름) 만. AI 가 목록에 없는 id 를 내면 버린다.
- LLM: backend/llm.py (공용 키, gpt-6-luna). 실패하거나 MOCK_LLM=1 이면 키워드 점수로 대신 고른다.
- 같은 질문·언어는 메모리에 캐시 (공용 키 한도 절약).
"""
import json
import re

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend import llm
from backend.places import load_json

router = APIRouter()

MAX_QUERY = 120
MAX_ITEMS = 6
LANG_NAMES = {"ko": "Korean", "zh": "Simplified Chinese", "en": "English"}

SYSTEM = """You recommend dishes to an international student near campus.
You get the student's wish and a MENU list (one dish per line: id | store | Korean name | English name | group | price KRW | ingredients | flags).
Pick up to 6 dishes from the MENU that best match the wish. Use ONLY ids that appear in the MENU.
Respect dietary words strictly (no pork / halal / vegan / not spicy / no alcohol). Prefer variety across stores when it fits.
For each pick write one short reason in {language} (max 60 characters, Chinese max 30) that connects the wish to the dish.
If nothing fits, return an empty list.
Output only JSON: {{"items": [{{"id": 12, "reason": "..."}}]}}"""

_cache: dict[tuple[str, str], list[dict]] = {}


class RecommendRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=MAX_QUERY)
    lang: str = "ko"


def _catalog() -> tuple[dict[int, dict], str]:
    stores = {s["id"]: s for s in load_json("stores.json")}
    menus = {m["id"]: m for m in load_json("menus.json") if m.get("store_id") in stores}
    lines = []
    for m in menus.values():
        flags = []
        if m.get("contains_pork"):
            flags.append("pork")
        if m.get("contains_alcohol"):
            flags.append("alcohol")
        if m.get("halal") == "yes":
            flags.append("halal")
        if m.get("vegan") == "yes":
            flags.append("vegan")
        flags.append(f"spicy{m.get('spicy', 0)}")
        en = (m.get("translations", {}).get("en") or {}).get("name", "")
        lines.append(
            f"{m['id']} | {stores[m['store_id']]['name']} | {m['name_ko']} | {en} | {m.get('menu_category', '')}"
            f" | {m.get('price', '')} | {', '.join(m.get('ingredients') or [])} | {' '.join(flags)}"
        )
    return menus, "\n".join(lines)


# AI 없이 고를 때 쓰는 간단한 키워드 (한국어·중국어·영어)
KEYWORDS = {
    "meat": (["고기", "육", "肉", "meat", "beef", "pork", "chicken", "닭", "돼지", "소"], ["돼지고기", "소고기", "닭", "차슈", "삼겹", "항정", "고기", "대창", "베이컨", "햄"]),
    "spicy": (["매운", "맵", "辣", "spicy", "hot"], []),
    "bread": (["빵", "面包", "bread", "sandwich", "burrito", "부리또", "샌드위치"], ["빵", "또띠아", "토르티야", "부리또", "핫도그"]),
    "noodle": (["면", "라멘", "국수", "面", "noodle", "ramen", "pasta", "파스타", "소바", "우동"], ["면", "파스타", "소바", "우동", "라멘", "쌀국수"]),
    "rice": (["밥", "덮밥", "饭", "rice"], ["밥", "덮밥"]),
    "soup": (["국물", "따뜻", "汤", "soup", "stew", "전골"], ["육수", "국물", "전골"]),
}


def _fallback(query: str, menus: dict[int, dict]) -> list[dict]:
    q = query.lower()
    scored = []
    for m in menus.values():
        text = " ".join([m["name_ko"], m.get("menu_category", ""), *(m.get("ingredients") or [])])
        score = 0
        for key, (words, hints) in KEYWORDS.items():
            if any(w in q for w in words):
                if key == "spicy":
                    score += m.get("spicy", 0)
                elif any(h in text for h in hints) or (key == "meat" and m.get("contains_pork")):
                    score += 2
        if any(w in q for w in ["돼지고기 빼", "no pork", "不要猪肉", "할랄", "halal", "清真"]) and m.get("contains_pork"):
            score = -9
        if m.get("menu_category") in ("음료", "주류"):
            score -= 1
        if score > 0:
            scored.append((score, m["id"]))
    scored.sort(key=lambda x: (-x[0], x[1]))
    return [{"menu_id": i, "store_id": menus[i]["store_id"], "reason": ""} for _, i in scored[:MAX_ITEMS]]


@router.post("/recommend")
def recommend(req: RecommendRequest):
    """손님 말 → {"items": [{menu_id, store_id, reason}], "source": "ai" | "keyword"}"""
    query = req.query.strip()
    if not query:
        raise HTTPException(400, "query is empty")
    lang = req.lang if req.lang in LANG_NAMES else "en"
    menus, catalog = _catalog()
    if not menus:
        return {"items": [], "source": "keyword"}

    key = (query.lower(), lang)
    if key in _cache:
        return {"items": _cache[key], "source": "ai"}

    if not llm.MOCK:
        try:
            text = llm.ask(
                f"Wish: {query}\n\nMENU:\n{catalog}",
                system=SYSTEM.format(language=LANG_NAMES[lang]),
            )
            data = json.loads(text[text.find("{"): text.rfind("}") + 1])
            items, seen = [], set()
            for it in data.get("items", []):
                try:
                    mid = int(it.get("id"))
                except (TypeError, ValueError):
                    continue
                # 우리 메뉴 목록에 있는 것만, 중복 없이
                if mid in menus and mid not in seen:
                    seen.add(mid)
                    reason = re.sub(r"\s+", " ", str(it.get("reason", ""))).strip()[:80]
                    items.append({"menu_id": mid, "store_id": menus[mid]["store_id"], "reason": reason})
                if len(items) >= MAX_ITEMS:
                    break
            _cache[key] = items
            return {"items": items, "source": "ai"}
        except (llm.LLMError, ValueError, json.JSONDecodeError, AttributeError):
            pass  # 아래 키워드 추천으로
    return {"items": _fallback(query, menus), "source": "keyword"}
