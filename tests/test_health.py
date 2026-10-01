from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_predict():
    r = client.post("/predict", json={"features": [1, 2, 3]})
    assert r.status_code == 200
    assert r.json()["prediction"] == 2
