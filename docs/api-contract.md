# 🔗 API 계약

> 백엔드 ↔ 프론트의 **유일한 약속**. 코드보다 이 문서를 먼저 고친다.
> - 백엔드: `backend/main.py` 의 Pydantic 모델과 일치
> - 프론트: `web/src/lib/api.ts` 의 타입과 일치
> - 프론트는 `/api/<path>` 로 호출 (Next.js 가 FastAPI 로 전달)

## 상태
| Method | Path | 설명 | 상태 | 담당 |
|--------|------|------|------|------|
| GET | `/health` | 서버 상태 | ✅ 구현 | Backend |
| POST | `/predict` | 예시 예측 (주제 확정 후 교체) | 🟡 더미 | ML |
| POST | `/chat` | Claude 응답 | ✅ 구현 (`MOCK_LLM`) | Backend |

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
