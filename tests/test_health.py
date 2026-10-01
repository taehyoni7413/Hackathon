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


def test_predict():
    r = client.post("/api/predict", json={"features": [1, 2, 3]})
    assert r.status_code == 200
    assert r.json()["prediction"] == 2
