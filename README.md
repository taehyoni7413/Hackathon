# 🚀 Hackathon Project

> 대회: 2026 제1회 컴퓨터공학과 해커톤 L/NKerthon ([대회 정보](docs/contest.md))
> 주제: **우리가 바꾸는 캠퍼스의 하루**
> 서비스명: **BUK** (밥 먹는 소리 "벅" + KU) — 유학생이 학교 앞 식당을 찾고, 내 언어로 메뉴·식단 정보를 보고, 사장님께 한국어 주문 화면을 보여주는 웹앱

## 👥 Team (최대 3명)
| 이름 | 역할 | GitHub |
|------|------|--------|
|      | PM / 발표 | |
|      | | |
|      | | |

자세한 역할 분담은 [docs/roles.md](docs/roles.md) 참고.

## 🧱 Tech Stack
- **Backend**: FastAPI
- **Frontend**: Next.js (TypeScript + Tailwind)
- **ML**: pandas, numpy, scikit-learn
- **LLM**: OpenAI API (`gpt-6-luna`, `text-embedding-3-small`) — 주최 측 제공 공용 키

## 📁 Structure
```
backend/    FastAPI 서버 (main.py, llm.py)
web/        Next.js 프론트엔드 (/api/* → FastAPI 프록시)
ml/         모델 학습 스크립트
data/       데이터 (원본은 git 제외)
notebooks/  EDA 노트북
tests/      백엔드 테스트
scripts/    원클릭 세팅 / 실행 스크립트
docs/       기획 · API 계약 · 역할 · 체크리스트 · 발표
```

## ⚙️ Quick Start
**처음 한 번 (세팅)**
```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1   # Windows
bash scripts/setup.sh                                         # macOS / Linux
```

**개발 서버 실행 (백엔드 + 프론트 동시)**
```powershell
powershell -ExecutionPolicy Bypass -File scripts\dev.ps1     # Windows
bash scripts/dev.sh                                           # macOS / Linux
```
- 프론트: http://localhost:3000
- API 문서: http://localhost:8000/api/docs
- 기본 `MOCK_LLM=1` → API 키 없이 가짜 응답. 실제 호출은 `MOCK_LLM=0` + 공용 키 ([onboarding](docs/onboarding.md#-api-키))

**테스트**
```bash
.venv/Scripts/python -m pytest -q        # Windows (macOS/Linux: .venv/bin/python)
cd web && npm run lint && npm run build
```

## 🗺️ 프론트 환경변수 (`web/.env.local`, 커밋 금지)
| 이름 | 설명 |
|------|------|
| `NEXT_PUBLIC_KAKAO_MAP_KEY` | 카카오맵 JavaScript 키. 없으면 지도 대신 식당 목록만 표시 |
| `NEXT_PUBLIC_USE_MOCK` | 기본(비움)은 **백엔드B 데이터**(`/api/stores/all`, 연결 실패 시 내장 데이터). `1`이면 백엔드 없이 내장 데이터(`web/src/data/stores.json` → 비어 있으면 가짜 8곳)로 화면 작업 |
| `BACKEND_URL` | Next.js가 `/api/*`를 전달할 FastAPI 주소 |

카카오 개발자 콘솔 → 앱 → 플랫폼 → Web 에 `http://localhost:3000` 과 배포 도메인을 등록해야 지도가 뜹니다.

## 📱 휴대폰에서 테스트하기
위치(Geolocation)는 **HTTPS**에서만 동작합니다. PC는 `http://localhost:3000`으로 확인하고, 휴대폰은 배포 주소로 확인하세요.

1. https://vercel.com 에서 GitHub 레포 Import
2. **Root Directory**: `web`
3. Environment Variables: `NEXT_PUBLIC_KAKAO_MAP_KEY` (필요하면 `NEXT_PUBLIC_USE_MOCK`, `BACKEND_URL`)
4. Deploy → 나온 `https://...vercel.app` 주소를 카카오 콘솔 Web 플랫폼에 추가
5. 가게·메뉴는 백엔드B 데이터(`backend/data/*.json`)를 씁니다. 발표장에서는 설정 ⚙️ → **데모 모드**를 켜세요.

### 앱처럼 설치하기 (PWA)
- **안드로이드(크롬)**: 설정 ⚙️ → [홈 화면에 추가], 또는 크롬 메뉴 → 앱 설치
- **아이폰(사파리)**: 공유 버튼(□↑) → [홈 화면에 추가]
- 홈 화면 아이콘으로 열면 주소창 없이 전체 화면으로 실행됩니다.
- 서비스 워커(`web/public/sw.js`)가 한 번 열어본 화면·이미지를 저장해 두어, 발표장 네트워크가 끊겨도 다시 열립니다 (`npm run build` 후 실행한 프로덕션에서만 동작).
- 앱 아이콘은 `web/public/icons/` 의 임시 아이콘입니다. 로고가 정해지면 같은 이름·크기(192, 512, maskable 512, apple 180)로 교체하세요.

## 🗺️ 백엔드B: 가게·위치·도보 길안내·도착 확인 (`backend/places.py`)
모든 경로는 `/api` 아래. 데이터는 `backend/data/stores.json`, `backend/data/menus.json`.

| Method | Path | 설명 | 필요한 키 |
|--------|------|------|-----------|
| GET | `/api/places/health` | 키 로딩 상태 확인 | — |
| GET | `/api/location?lat=&lng=` | 좌표 → 주소 + 카카오맵 링크 | `KAKAO_REST_KEY` |
| GET | `/api/stores?lat=&lng=&radius=` | 반경 안 가게, 가까운 순 | (주소만 있으면 `KAKAO_REST_KEY`로 좌표 변환) |
| GET | `/api/stores/all` | 전체 가게 | — |
| GET | `/api/stores/{id}` / `/api/stores/{id}/menus?lang=` | 가게 / 메뉴 | — |
| GET | `/api/route?from_lat=&from_lng=&store_id=` | 도보 경로(TMAP) | `TMAP_APP_KEY` |
| GET | `/api/arrival?store_id=&lat=&lng=&accuracy=` | 도착 확인 (50m + GPS 오차) | — |
| GET | `/api/map`, `/api/gps-test` | 백엔드 확인용 데모 페이지 | `KAKAO_JS_KEY` |

키는 `.env`(로컬)와 Vercel 환경변수에만 넣고 레포에는 올리지 않습니다.
## 📦 외부 자료 (발표에서 공개 필수)
> 대회 규정: 외부 코드·오픈소스·데이터를 활용했다면 최종 발표에서 주요 활용 내용을 밝혀야 함. **새로 쓰면 바로 한 줄 추가.**

| 종류 | 이름 | 용도 | 링크 |
|------|------|------|------|
| 프레임워크 | FastAPI | 백엔드 API 서버 | https://fastapi.tiangolo.com |
| 프레임워크 | Next.js (create-next-app 기본 템플릿) | 프론트엔드 | https://nextjs.org |
| 라이브러리 | Tailwind CSS | 스타일 | https://tailwindcss.com |
| 라이브러리 | pandas, numpy, scikit-learn | 데이터 처리·모델 | https://scikit-learn.org |
| API | OpenAI API (gpt-6-luna, text-embedding-3-small, 주최 측 제공) | 요청사항 한국어 번역(`/api/translate`), AI 메뉴 코치(`/api/menu-insight`), LLM 기능 | https://platform.openai.com/docs |
| AI 도구 | Claude Code | 코딩 보조 | https://claude.com/claude-code |
| API | 카카오맵 JavaScript SDK | 지도·마커·경로선 표시 (프론트) | https://apis.map.kakao.com/web/ |
| API | 카카오맵 길찾기 링크 (`map.kakao.com/link/to`) | 외부 길 안내 버튼 | https://apis.map.kakao.com/web/guide/#routeurl |
| API·데이터 | OSRM 공개 도보 경로 서버 (routing.openstreetmap.de, © OpenStreetMap 기여자) | 도보 경로 2순위 | https://routing.openstreetmap.de |
| API | TMAP 보행자 경로 API (백엔드 `GET /api/route`) | 도보 경로 안내 (키는 서버에만) | https://openapi.sk.com |
| API | 카카오 로컬 REST API (좌표→주소, 주소→좌표) | 내 위치 주소 표시, 가게 주소 좌표 변환 (백엔드) | https://developers.kakao.com/docs/latest/ko/local/dev-guide |
| API | Web Speech API (브라우저 내장 음성 인식 · 크롬은 Google, 사파리는 Apple 엔진) | 요청사항 음성 입력(STT). 음성은 각 브라우저 회사 서버에서 글자로 변환 | https://developer.mozilla.org/docs/Web/API/Web_Speech_API |
| 프레임워크 | Flask | 메뉴 번역 단독 데모(`app.py`) | https://flask.palletsprojects.com |
| 데이터 | OpenStreetMap (© OpenStreetMap 기여자, ODbL) | 학교 정문 좌표(`SCHOOL_COORD`) | https://www.openstreetmap.org/node/4629757791 |
|  |  |  |  |

**사전 준비 내역 (규정상 허용되는 기본 환경 설정):** 대회 전에는 프로젝트 기본 구조(FastAPI + Next.js 템플릿), 세팅·실행 스크립트, 협업 문서만 준비했으며, 주제 관련 기능 코드는 모두 대회 시간(10/1 19:30 ~ 10/2 11:30) 중 작성.

## 📚 Docs
| 문서 | 언제 |
|------|------|
| [대회 정보](docs/contest.md) | 규칙·주제·심사 기준·일정 |
| [온보딩](docs/onboarding.md) | 팀원: 오기 전 세팅 + 도착 후 |
| [솔로 플레이북](docs/solo-playbook.md) | PM: 팀원 합류 전 2시간 (19:30 – 21:30) |
| [아이디어](docs/ideas.md) | 개발 시작 직후 |
| [API 계약](docs/api-contract.md) | 백엔드 ↔ 프론트 약속 |
| [역할 분담](docs/roles.md) | 역할·폴더·통합 규칙 |
| [체크리스트](docs/checklist.md) | 시작 전 ~ 제출 (16시간 타임라인) |
| [발표 구성](docs/pitch.md) | 6분 발표 · 필수 구성 5요소 |
| [시연/배포](docs/deploy.md) | 시연 방식 결정 |
| [협업 규칙](.github/CONTRIBUTING.md) | 브랜치·커밋·PR |

## 🍽️ 메뉴 번역 데모

`menu_translator.py`와 `app.py`에는 메뉴 번역·AI 메뉴 코치·요청사항 번역을 확인할 수 있는 독립 실행형 데모가 포함되어 있습니다.

```bash
python -m pip install -r requirements.txt
MOCK_LLM=1 python app.py
```

브라우저에서 `http://127.0.0.1:5000`을 열면 한국어·영어·중국어 메뉴 표시, 재료·알레르겐 정보, AI 메뉴 코치, 손님 언어에서 가게 언어로 요청사항 번역을 확인할 수 있습니다. `少辣一点` 같은 예시 요청은 `덜 맵게 해주세요.`로 변환됩니다.

실제 OpenAI 응답을 사용하려면 키를 코드나 저장소에 넣지 않고 환경변수로 설정합니다.

```bash
export OPENAI_API_KEY="your-api-key"
unset MOCK_LLM
python app.py
```

데모 테스트:

```bash
python -m unittest -v test_menu_translator
```
