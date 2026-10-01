# 🚀 Hackathon Project

> 주제: _(발표 후 작성)_
> 한 줄 소개: _(발표 후 작성)_

## 👥 Team
| 이름 | 역할 | GitHub |
|------|------|--------|
|      | PM / 발표 | |
|      | Backend | |
|      | ML / AI | |
|      | Frontend | |

자세한 역할 분담은 [docs/roles.md](docs/roles.md) 참고.

## 🧱 Tech Stack
- **Backend**: FastAPI
- **Frontend**: Next.js (TypeScript + Tailwind)
- **ML**: pandas, numpy, scikit-learn
- **LLM**: Claude API (`anthropic` SDK)

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
- API 문서: http://localhost:8000/docs
- 기본 `MOCK_LLM=1` → API 키 없이 가짜 응답. 실제 호출은 AI 담당만 ([onboarding](docs/onboarding.md#-api-키))

**테스트**
```bash
.venv/Scripts/python -m pytest -q        # Windows (macOS/Linux: .venv/bin/python)
cd web && npm run lint && npm run build
```

## 📚 Docs
| 문서 | 언제 |
|------|------|
| [온보딩](docs/onboarding.md) | 팀원: 전날 세팅 + 당일 합류 |
| [솔로 플레이북](docs/solo-playbook.md) | PM: 팀원 합류 전 2시간 |
| [아이디어](docs/ideas.md) | 주제 발표 직후 |
| [API 계약](docs/api-contract.md) | 백엔드 ↔ 프론트 약속 |
| [역할 분담](docs/roles.md) | 역할·폴더·통합 규칙 |
| [체크리스트](docs/checklist.md) | D-1 ~ 제출 |
| [발표 구성](docs/pitch.md) | 발표 준비 |
| [시연/배포](docs/deploy.md) | 시연 방식 결정 |
| [협업 규칙](.github/CONTRIBUTING.md) | 브랜치·커밋·PR |
