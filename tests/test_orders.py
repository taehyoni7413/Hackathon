"""주문번호 발급 (backend/main.py /api/orders)"""
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_order_numbers_increase():
    a = client.post("/api/orders").json()["number"]
    b = client.post("/api/orders").json()["number"]
    assert b == a + 1
