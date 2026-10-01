# 🌐 시연 / 배포 옵션

> 아직 미정. **기본은 로컬 시연**(가장 안전·빠름). 주최 측이 URL 제출을 요구하면 아래 B로.

## A. 로컬 시연 (기본)
1. 시연 노트북 1대에서 `.env` 의 `MOCK_LLM=0`, `OPENAI_API_KEY` 설정
2. `scripts/dev.ps1` (또는 `dev.sh`) 실행 → http://localhost:3000
3. 네트워크 장애 대비 **데모 녹화본** 준비

## B. 온라인 배포 (URL 제출이 필요할 때)
| 대상 | 추천 | 메모 |
|------|------|------|
| `web/` (Next.js) | Vercel | Root Directory = `web`, 환경변수 `BACKEND_URL` = 백엔드 공개 주소 |
| `backend/` (FastAPI) | Render / Railway | Start: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`, 환경변수 `MOCK_LLM=0`, `OPENAI_API_KEY` |

- 배포는 **마감 4시간 전까지** 한 번 해보기 (당일 처음 하면 꼭 막힘)
- 무료 플랜은 첫 요청이 느릴 수 있음(콜드 스타트) → 발표 직전에 한 번 호출해서 깨워두기

## 배포 횟수 제한 (무료 플랜 하루 100회)
- `vercel.json` 의 `git.deploymentEnabled`: **main 에 머지할 때만 자동 배포**, PR 브랜치 미리보기 빌드는 하지 않음
- PR 화면을 미리 보고 싶으면 로컬에서 `scripts/dev` 로 확인
