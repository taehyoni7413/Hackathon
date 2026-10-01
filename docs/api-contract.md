# 🔗 API 계약

> 백엔드 ↔ 프론트의 **유일한 약속**. 코드보다 이 문서를 먼저 고친다.
> - 백엔드: `backend/main.py` 의 Pydantic 모델과 일치
> - 프론트: `web/src/lib/api.ts` 의 타입과 일치
> - **모든 경로는 `/api` 접두사 포함** (예: `GET /api/health`). 아래 표의 경로 앞에 `/api` 를 붙여 읽는다
> - 배포(Vercel): `vercel.json` 이 `/api/*` 를 경로 그대로 `api` 서비스(FastAPI)로 보냄 / 로컬: Next.js 가 같은 경로로 FastAPI 에 전달
> - API 문서: 로컬 http://localhost:8000/api/docs

## 상태
| Method | Path | 설명 | 상태 | 담당 |
|--------|------|------|------|------|
| GET | `/health` | 서버 상태 | ✅ 구현 | Backend |
| POST | `/predict` | 예시 예측 (주제 확정 후 교체) | 🟡 더미 | ML |
| POST | `/chat` | AI 응답 (gpt-6-luna) | ✅ 구현 (`MOCK_LLM`) | Backend |
| POST | `/translate` | 요청사항(사용자 언어) → 사장님용 한국어 | ✅ 구현 | Backend |

상태: ⬜ 계획 / 🟡 더미 응답 / ✅ 실제 구현

---

### `GET /health`
**Response 200**
```json
{ "status": "ok" }
```

### `POST /predict`
**Request**
```json
{ "features": [1.0, 2.0, 3.0] }
```
**Response 200**
```json
{ "prediction": 2.0 }
```
**Error** `400` — features 가 비어 있음

### `POST /translate`
메뉴 상세에서 말하거나 입력한 요청사항을 사장님께 보여줄 한국어 문장으로 바꾼다. `lang` 이 `ko` 면 그대로 돌려준다.
**Request**
```json
{ "text": "不要放香菜，少辣一点", "lang": "zh" }
```
**Response 200**
```json
{ "ko": "고수는 빼고 덜 맵게 해주세요." }
```
**Error** `400` — 비었거나 200자 초과 / `502` — 번역 실패 (프론트는 원문 그대로 표시)

### `POST /chat`
**Request**
```json
{ "message": "질문", "system": "(선택) 시스템 프롬프트" }
```
**Response 200**
```json
{ "reply": "답변 텍스트" }
```
**Error** `502` — LLM 호출 실패 (`detail` 에 사유)

---

<!-- 새 엔드포인트 템플릿
### `METHOD /path`
설명:
**Request**
```json
{}
```
**Response 200**
```json
{}
```
-->
