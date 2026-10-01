from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_chat_mock(monkeypatch):
    from backend import llm

    monkeypatch.setattr(llm, "MOCK", True)
    r = client.post("/api/chat", json={"message": "hi"})
    assert r.status_code == 200
    assert r.json()["reply"].startswith("[MOCK]")


def test_chat_without_key_returns_502(monkeypatch):
    from backend import llm

    monkeypatch.setattr(llm, "MOCK", False)
    monkeypatch.setattr(llm, "_client", None)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    r = client.post("/api/chat", json={"message": "hi"})
    assert r.status_code == 502


def test_translate_mock(monkeypatch):
    from backend import llm

    monkeypatch.setattr(llm, "MOCK", True)
    r = client.post("/api/translate", json={"text": "less spicy please", "lang": "en"})
    assert r.status_code == 200
    assert r.json()["ko"]


def test_translate_korean_passthrough():
    for lang in ("ko", "ko-KR"):
        r = client.post("/api/translate", json={"text": "덜 맵게 해주세요", "lang": lang})
        assert r.json() == {"ko": "덜 맵게 해주세요"}


def test_translate_other_speech_lang_is_translated(monkeypatch):
    from backend import llm

    monkeypatch.setattr(llm, "MOCK", True)
    r = client.post("/api/translate", json={"text": "Không cay", "lang": "vi-VN"})
    assert r.status_code == 200
    assert r.json()["ko"].startswith("[MOCK]")


def test_translate_limits():
    assert client.post("/api/translate", json={"text": "  "}).status_code == 400
    assert client.post("/api/translate", json={"text": "a" * 201}).status_code == 400


def test_key_with_bom_is_cleaned(monkeypatch):
    from backend import llm

    monkeypatch.setattr(llm, "_client", None)
    monkeypatch.setenv("OPENAI_API_KEY", "﻿sk-test-key\n")
    assert llm._get_client().api_key == "sk-test-key"
    monkeypatch.setattr(llm, "_client", None)


def test_predict():
    r = client.post("/api/predict", json={"features": [1, 2, 3]})
    assert r.status_code == 200
    assert r.json()["prediction"] == 2
