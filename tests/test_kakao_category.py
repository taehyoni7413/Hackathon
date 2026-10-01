"""카카오 장소 분류 → 앱 카테고리 변환 (backend/places.py) — API 호출 없이"""
from backend.places import to_app_category


def test_kakao_category_mapping():
    assert to_app_category("음식점 > 퓨전요리") == "fusion"
    assert to_app_category("음식점 > 양식 > 멕시칸,브라질") == "western"
    assert to_app_category("음식점 > 일식") == "japanese"
    assert to_app_category("음식점 > 한식 > 육류,고기") == "korean"
    assert to_app_category("카페") == "cafe"
    assert to_app_category("음식점 > 술집 > 호프,요리주점") is None
