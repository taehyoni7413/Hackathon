"""음식 번호 발급 (backend/main.py /api/orders)"""
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_dish_numbers_are_consecutive():
    a = client.post("/api/orders", json={"count": 2}).json()["numbers"]
    b = client.post("/api/orders", json={"count": 1}).json()["numbers"]
    assert len(a) == 2 and a[1] == a[0] + 1
    assert b == [a[1] + 1]


def test_dish_numbers_count_limit():
    assert client.post("/api/orders", json={"count": 0}).status_code == 422
