"""AI 맞춤 추천 (backend/recommend.py) — MOCK_LLM 키워드 추천과 메뉴 목록 밖 id 거르기"""
import json

from fastapi.testclient import TestClient

from backend import llm, recommend
from backend.main import app

client = TestClient(app)
MENU_IDS = {m["id"] for m in json.load(open("backend/data/menus.json", encoding="utf-8"))}


def test_keyword_recommend_returns_only_our_menus(monkeypatch):
    monkeypatch.setattr(llm, "MOCK", True)
    r = client.post("/api/recommend", json={"query": "매운 음식이 땡겨요", "lang": "ko"})
    assert r.status_code == 200
    items = r.json()["items"]
    assert items and all(i["menu_id"] in MENU_IDS for i in items)


def test_ai_ids_outside_menu_are_dropped(monkeypatch):
    monkeypatch.setattr(llm, "MOCK", False)
    good = next(iter(MENU_IDS))
    monkeypatch.setattr(llm, "ask", lambda *a, **k: json.dumps({"items": [{"id": 99999, "reason": "x"}, {"id": good, "reason": "ok"}]}))
    recommend._cache.clear()
    items = client.post("/api/recommend", json={"query": "아무거나 test", "lang": "en"}).json()["items"]
    assert [i["menu_id"] for i in items] == [good]


def test_empty_query_rejected():
    assert client.post("/api/recommend", json={"query": "", "lang": "ko"}).status_code == 422
