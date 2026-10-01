# 🚀 Hackathon Project

> 주제: _(발표 후 작성)_
> 한 줄 소개: _(발표 후 작성)_

## 👥 Team
| 이름 | 역할 | GitHub |
|------|------|--------|
|      | PM / 발표 | |
|      | Backend | |
|      | ML / AI | |
|      | Frontend / Demo | |

자세한 역할 분담은 [docs/roles.md](docs/roles.md) 참고.

## 🧱 Tech Stack
- **Backend**: FastAPI
- **Frontend**: 주제에 맞게 택1
  - `frontend/` Streamlit — 빠른 데모, Python만 사용
  - `web/` Next.js (TypeScript + Tailwind) — 서비스형 UI, Vercel 배포
- **ML**: pandas, numpy, scikit-learn
- **LLM**: Claude API (`anthropic` SDK)

## 📁 Structure
```
backend/    FastAPI 서버 (main.py, llm.py)
frontend/   Streamlit 데모 화면
web/        Next.js 프론트엔드
ml/         모델 학습 스크립트
data/       데이터 (원본은 git 제외)
notebooks/  EDA 노트북
tests/      테스트
docs/       아이디어 / 역할 / 체크리스트 / 발표 템플릿
```

## ⚙️ Quick Start
```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # 기본 MOCK_LLM=1 (키 없이 가짜 응답), 실제 호출은 AI 담당만

# 백엔드
uvicorn backend.main:app --reload        # http://localhost:8000/docs

# 프론트 A: Streamlit (다른 터미널)
streamlit run frontend/app.py            # http://localhost:8501

# 프론트 B: Next.js (다른 터미널)
cd web
npm install
cp .env.example .env.local
npm run dev                              # http://localhost:3000

# 테스트
pytest
```

## 📚 Docs
- [아이디어 브레인스토밍](docs/ideas.md)
- [역할 분담](docs/roles.md)
- [해커톤 당일 체크리스트](docs/checklist.md)
- [발표 구성](docs/pitch.md)
- [협업 규칙](.github/CONTRIBUTING.md)
