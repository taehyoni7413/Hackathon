# 백엔드B 데이터

- `stores.json`: 가게 (실제 가게 3곳). `category` 는 설명을 보고 임시로 넣은 값
- `menus.json`: **⚠️ 임시 메뉴 (기능 확인용)**. 메뉴 이름·가격·재료·식단 정보는 실제와 다를 수 있음.
  메뉴판 사진을 받아 실제 데이터로 교체할 것.

## 형식
프론트 변환 코드: `web/src/lib/backendAdapter.ts` 의 `BackendStore`, `BackendMenu`

가게
```json
{ "id": 3, "name": "면식당 충주건국대점", "address": "…", "lat": 36.94, "lng": 127.90,
  "category": "japanese", "names": { "zh": "面食堂", "en": "Myeon Sikdang" },
  "description": { "ko": "…", "en": "…" },
  "open_hours": { "mon": "11:00-21:00", "sun": null },
  "image_url": "/stores/3/cover.jpg", "menu_board_images": ["/stores/3/menu_board_01.jpg"] }
```
`category`: korean / chinese / japanese / western / snack / cafe (없으면 "기타")

메뉴: `menus.json` 의 기존 항목 형식 참고 (`store_id` 는 가게 `id` 와 같은 숫자).
이미지는 `web/public/stores/{가게 id}/` 에 넣고 `/stores/{가게 id}/파일명` 으로 적는다.
