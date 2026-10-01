# 🚀 Hackathon Project

> 대회: 2026 제1회 컴퓨터공학과 해커톤 L/NKerthon ([대회 정보](docs/contest.md))
> 주제: **우리가 바꾸는 캠퍼스의 하루**
> 서비스명 / 한 줄 소개: _(아이디어 확정 후 작성)_

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
- API 문서: http://localhost:8000/docs
- 기본 `MOCK_LLM=1` → API 키 없이 가짜 응답. 실제 호출은 `MOCK_LLM=0` + 공용 키 ([onboarding](docs/onboarding.md#-api-키))

**테스트**
```bash
.venv/Scripts/python -m pytest -q        # Windows (macOS/Linux: .venv/bin/python)
cd web && npm run lint && npm run build
```

## 📦 외부 자료 (발표에서 공개 필수)
> 대회 규정: 외부 코드·오픈소스·데이터를 활용했다면 최종 발표에서 주요 활용 내용을 밝혀야 함. **새로 쓰면 바로 한 줄 추가.**

| 종류 | 이름 | 용도 | 링크 |
|------|------|------|------|
| 프레임워크 | FastAPI | 백엔드 API 서버 | https://fastapi.tiangolo.com |
| 프레임워크 | Next.js (create-next-app 기본 템플릿) | 프론트엔드 | https://nextjs.org |
| 라이브러리 | Tailwind CSS | 스타일 | https://tailwindcss.com |
| 라이브러리 | pandas, numpy, scikit-learn | 데이터 처리·모델 | https://scikit-learn.org |
| API | OpenAI API (gpt-6-luna, text-embedding-3-small, 주최 측 제공) | LLM 기능 | https://platform.openai.com/docs |
| AI 도구 | Claude Code | 코딩 보조 | https://claude.com/claude-code |
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
