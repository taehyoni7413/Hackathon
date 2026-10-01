"""AI 메뉴 코치 (backend/menu_coach.py) — MOCK_LLM 으로 실제 API 호출 없이 확인"""
from fastapi.testclient import TestClient

from backend import llm, menu_coach
from backend.main import app

client = TestClient(app)


def test_menu_insight_mock(monkeypatch):
    monkeypatch.setattr(llm, "MOCK", True)
    menu = client.get("/api/stores/3/menus").json()[0]
    r = client.post("/api/menu-insight", json={"store_id": 3, "menu_id": menu["id"], "lang": "zh"})
    assert r.status_code == 200
    assert set(r.json()) == {"summary", "recommended_for", "notice"}


def test_menu_insight_unknown_menu():
    r = client.post("/api/menu-insight", json={"store_id": 1, "menu_id": 99999, "lang": "en"})
    assert r.status_code == 404


def test_parse_fenced_json():
    text = '```json\n{"summary": "a", "recommended_for": "b", "notice": "c"}\n```'
    assert menu_coach._parse(text) == {"summary": "a", "recommended_for": "b", "notice": "c"}
