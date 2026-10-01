"""AI 메뉴 코치: "이 메뉴가 나에게 맞을까?" — 메뉴 정보를 바탕으로 사용자 언어로 짧게 추천·주의사항.

유현국 님 데모(menu_translator.py 의 generate_menu_insight, INSIGHT_PROMPT)를 앱 백엔드로 옮긴 것.
메뉴 데이터는 backend/data/menus.json 에서 읽고, LLM 은 backend/llm.py(공용 키, gpt-6-luna)를 쓴다.
같은 메뉴·언어는 메모리에 캐시해서 공용 키 한도를 아낀다.
"""
import json

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend import llm
from backend.places import load_json

router = APIRouter()

LANG_NAMES = {"ko": "Korean", "zh": "Simplified Chinese", "en": "English"}

INSIGHT_SYSTEM = """You are an AI food guide for international students ordering at a Korean restaurant near campus.
Given one menu item as JSON, answer in {language} with a JSON object of exactly three short fields:
summary: one sentence describing the taste and what the dish is.
recommended_for: who would likely enjoy it, considering flavor, spice level and portion.
notice: one dietary caution (pork, alcohol, allergens, spice, halal/vegan uncertainty) and that the recipe should be confirmed with the owner.
Base everything on the given data and common recipes; do not invent certainty. Each field at most 80 characters (Chinese: 40 characters).
Output only the JSON object."""

FIELDS = ("summary", "recommended_for", "notice")

MOCK_INSIGHT = {
    "ko": {"summary": "[MOCK] 메뉴 설명 예시입니다.", "recommended_for": "[MOCK] 추천 대상 예시입니다.", "notice": "[MOCK] 재료는 사장님께 확인하세요."},
    "zh": {"summary": "[MOCK] 菜品介绍示例。", "recommended_for": "[MOCK] 适合人群示例。", "notice": "[MOCK] 请向店主确认食材。"},
    "en": {"summary": "[MOCK] Sample dish summary.", "recommended_for": "[MOCK] Sample 'good for'.", "notice": "[MOCK] Please confirm ingredients with the owner."},
}

_cache: dict[tuple[int, int, str], dict] = {}


class InsightRequest(BaseModel):
    store_id: int
    menu_id: int
    lang: str = "en"


def _menu_facts(m: dict) -> dict:
    keys = ("name_ko", "translations", "price", "ingredients", "allergens",
            "contains_pork", "contains_alcohol", "halal", "vegan", "spicy")
    return {k: m.get(k) for k in keys}


def _parse(text: str) -> dict:
    # 모델이 ```json 으로 감싸도 처리
    start, end = text.find("{"), text.rfind("}")
    data = json.loads(text[start:end + 1])
    out = {k: str(data.get(k, "")).strip() for k in FIELDS}
    if not all(out.values()):
        raise ValueError("missing fields")
    return out


@router.post("/menu-insight")
def menu_insight(req: InsightRequest):
    """메뉴 1개 → {summary, recommended_for, notice} (사용자 언어)"""
    lang = req.lang if req.lang in LANG_NAMES else "en"
    menu = next((m for m in load_json("menus.json")
                 if m.get("store_id") == req.store_id and m.get("id") == req.menu_id), None)
    if menu is None:
        raise HTTPException(404, "menu not found")

    key = (req.store_id, req.menu_id, lang)
    if key in _cache:
        return _cache[key]
    if llm.MOCK:
        return MOCK_INSIGHT[lang]

    system = INSIGHT_SYSTEM.format(language=LANG_NAMES[lang])
    prompt = json.dumps(_menu_facts(menu), ensure_ascii=False)
    try:
        result = _parse(llm.ask(prompt, system=system))
    except llm.LLMError as e:
        raise HTTPException(502, str(e))
    except (ValueError, json.JSONDecodeError):
        raise HTTPException(502, "AI 응답 형식 오류")
    _cache[key] = result
    return result
