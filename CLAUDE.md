# Hackathon 프로젝트

해커톤용 레포. 2~4인 팀이 역할별로 각자 개발 후 PR로 통합한다. 문서와 응답은 한국어.

## 구조
- `backend/` FastAPI. `main.py`(엔드포인트, Pydantic 모델), `llm.py`(Claude 래퍼, `MOCK_LLM=1`이면 가짜 응답)
- `web/` Next.js (App Router, TS, Tailwind). `/api/*` 요청을 `next.config.ts` rewrites로 FastAPI에 전달. API 타입은 `web/src/lib/api.ts`
- `ml/` 학습 스크립트, `data/`(원본 git 제외), `notebooks/`
- `docs/api-contract.md` 백엔드↔프론트 계약의 단일 기준. 엔드포인트 변경 시 이 문서 → `backend/main.py` → `web/src/lib/api.ts` 순서로 함께 수정
- `docs/ideas.md` 아이디어/MVP, `docs/solo-playbook.md` 팀원 합류 전 2시간 진행표

## 명령
- 세팅: `powershell -ExecutionPolicy Bypass -File scripts\setup.ps1`
- 실행: `powershell -ExecutionPolicy Bypass -File scripts\dev.ps1` (백엔드 :8000, 프론트 :3000)
- 테스트: `.venv\Scripts\python -m pytest -q` / `cd web && npm run lint && npm run build`

## 규칙
- `main` 직접 push 금지. `feat/<이슈번호>-<설명>` 브랜치 → PR
- 커밋 타입: feat / fix / docs / refactor / chore
- 새 엔드포인트는 먼저 더미 응답으로 열고 테스트(`tests/`) 추가
- 비밀키는 `.env`에만. 커밋 금지
