# 백엔드B 데이터

- `stores.json`: 가게 3곳 (실제). `category` 는 설명을 보고 넣은 값
- `menus.json`: **실제 메뉴명·가격·사진** (네이버 지도 메뉴 사진, 팀원 수집). `scripts/build_menus.py` 로 생성 — 직접 고치지 말고 스크립트를 다시 실행
  - 번역·발음·재료·알레르기·식단(할랄/비건/돼지고기/술)·맵기·메뉴 분류는 **AI(gpt-6-luna) 추정** → 앱에 "AI가 추정한 정보" 안내 표시
- `menu_ai.json`: AI 추정 결과 캐시 (메뉴명 기준). 틀린 값은 여기서 고치고 스크립트를 다시 실행하면 반영

## 메뉴 추가·수정
1. 사진을 가게 폴더에 `메뉴명_가격.jpg` 로 넣는다 (Appro: `Appro_메뉴사진/`, 밀플랜비: `밀플랜비_메뉴사진/`, 면식당: `assets/menu_photos/myeonsikdang_chungju_geongukdae/`)
   - 전체 메뉴판은 `메뉴판.jpg` (앱의 "원본 메뉴판 보기")
   - 밀플랜비처럼 `메뉴(단품)_가격`, `메뉴(세트 A(...))_가격` 은 메뉴 1개 + 세트 옵션으로 합쳐짐
2. `.venv\Scripts\python scripts\build_menus.py` (OPENAI_API_KEY 필요, 새 메뉴만 AI 호출)
3. 사진은 `web/public/stores/{가게 id}/` 로 복사됨 → 커밋

## 형식
프론트 변환 코드: `web/src/lib/backendAdapter.ts` 의 `BackendStore`, `BackendMenu`
`category`: korean / chinese / japanese / western / snack / cafe (없으면 "기타")
