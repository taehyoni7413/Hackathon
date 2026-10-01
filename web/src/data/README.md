# 번들 정적 데이터

`stores.json` 에 실제 대표 식당 데이터(`StoreWithMenus[]`, 형식은 `src/types/models.ts`)를 넣으면
백엔드가 꺼져 있어도 이 데이터로 시연할 수 있습니다.

- 비어 있으면(`[]`) `src/mocks/stores.ts` 의 가짜 데이터를 사용합니다.
- 이미지 경로(`image_url`, `menu_board_images[]`)는 `web/public/stores/{store_id}/...` 기준 절대 경로(`/stores/s01/menu1.jpg`)로 적습니다.
