"""백엔드B (backend/places.py) 기본 동작 — 외부 키(카카오·TMAP) 없이 확인 가능한 것만"""
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)

# backend/data/stores.json 첫 가게 근처 (충주 건국대 앞)
LAT, LNG = 36.9489305165078, 127.903216045866


def test_places_health():
    r = client.get("/api/places/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_stores_all():
    r = client.get("/api/stores/all")
    assert r.status_code == 200
    stores = r.json()
    assert len(stores) >= 1
    assert {"id", "name", "lat", "lng"} <= stores[0].keys()


def test_stores_nearby_sorted():
    r = client.get("/api/stores", params={"lat": LAT, "lng": LNG, "radius": 2000})
    assert r.status_code == 200
    dists = [s["distance_m"] for s in r.json()]
    assert dists == sorted(dists)


def test_every_store_has_menus():
    for s in client.get("/api/stores/all").json():
        menus = client.get(f"/api/stores/{s['id']}/menus").json()
        assert menus, f"store {s['id']} has no menus"
        assert all(m["name_ko"] and m["price"] > 0 for m in menus)


def test_store_not_found():
    assert client.get("/api/stores/99999").status_code == 404


def test_arrival_at_store():
    r = client.get("/api/arrival", params={"store_id": 1, "lat": LAT, "lng": LNG})
    assert r.status_code == 200
    assert r.json()["status"] == "arrived"


def test_arrival_far_away():
    r = client.get("/api/arrival", params={"store_id": 1, "lat": LAT + 0.01, "lng": LNG})
    assert r.json()["status"] == "not_arrived"


def test_map_demo_page_uses_api_prefix():
    r = client.get("/api/map")
    assert r.status_code == 200
    assert "/api/stores/all" in r.text
