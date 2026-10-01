# ✅ 해커톤 체크리스트

## 📅 사전 준비 (D-day 전)

### 👥 팀원 전원
- [x] 레포 Collaborator 초대
- [ ] clone 후 `.env.example` → `.env` 복사 (`MOCK_LLM=1` 그대로, 키 불필요)
- [ ] `pip install -r requirements.txt` → `pytest` 통과
- [ ] `uvicorn backend.main:app --reload` 실행 → http://localhost:8000/docs 확인
- [ ] 노트북 충전기, 멀티탭, 핫스팟 등 장비 체크

### 🧠 AI / 백엔드 담당
- [ ] Anthropic API 키 발급 + 결제/한도 확인
- [ ] `.env`에 `MOCK_LLM=0`, `ANTHROPIC_API_KEY` 설정 → `/chat` 실제 호출 테스트
- [ ] 키는 본인 `.env`에만 보관 (레포·단톡 공유 금지)

### 🎨 프론트 담당
- [ ] Streamlit: `streamlit run frontend/app.py` 실행 확인
- [ ] Next.js: `cd web && npm install && npm run dev` 실행 확인

### 📋 PM
- [ ] GitHub `main` 브랜치 보호 규칙 설정 (PR 필수)
- [ ] 데이터셋/공공 API 후보 조사 (공공데이터포털, Kaggle, AI Hub 등)
- [ ] 발표 템플릿 준비 (`docs/pitch.md`)

### 주제 발표 후
- [ ] 프론트 택1: Streamlit(빠른 데모) vs Next.js(서비스형 UI)
- [ ] `docs/roles.md`의 API 계약 표 확정 → 각자 개발 시작

## ⏱️ 당일 타임라인 (24시간 기준, 기간에 맞게 비율 조정)
| 구간 | 비율 | 할 일 |
|------|------|-------|
| 기획 | ~10% | 주제 분석 → `docs/ideas.md` 작성 → 아이디어 확정 → API 계약 합의 |
| MVP 개발 | ~50% | 핵심 기능 3개 end-to-end로 연결 (가짜 데이터라도 먼저 흐름 완성) |
| 고도화 | ~20% | 모델/프롬프트 개선, UI 다듬기 |
| 마무리 | ~20% | 기능 동결 → 데모 리허설 → 발표 자료 → 제출 |

## 🚨 원칙
- [ ] 처음 2~3시간 안에 "화면 → 백엔드 → AI" 한 바퀴 동작하게 만들기
- [ ] 마감 3~4시간 전 **기능 동결** (feature freeze), 이후 버그 수정만
- [ ] 데모는 녹화본도 백업으로 준비 (네트워크/API 장애 대비)
- [ ] 비밀키는 절대 커밋 금지

## 📤 제출 전
- [ ] README 주제/소개/실행법 업데이트
- [ ] 데모 영상 / 스크린샷
- [ ] 발표 자료 최종본
- [ ] 레포 공개 여부 & 제출 링크 확인
