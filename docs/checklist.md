# ✅ 해커톤 체크리스트

## 📅 D-1 (전날까지)

### 👥 팀원 전원
- [x] 레포 Collaborator 초대
- [ ] [onboarding.md](onboarding.md) 1단계: clone → `scripts/setup` → `scripts/dev` 로 "백엔드 연결됨" 확인
- [ ] 노트북 충전기, 멀티탭, 핫스팟 등 장비 체크

### 🧠 AI / 백엔드 담당
- [ ] Anthropic API 키 발급 + 결제/한도 확인
- [ ] `.env`에 `MOCK_LLM=0`, `ANTHROPIC_API_KEY` 설정 → `/chat` 실제 호출 테스트
- [ ] 키는 본인 `.env`에만 보관 (레포·단톡 공유 금지)

### 📋 PM (나)
- [ ] GitHub `main` 브랜치 보호 규칙 설정 (PR 필수)
- [ ] GitHub 라벨 생성: `backend` `ml` `frontend` `pm`
- [ ] 데이터셋/공공 API 후보 조사 (공공데이터포털, Kaggle, AI Hub 등)
- [ ] [solo-playbook.md](solo-playbook.md) 한 번 읽고 시간 배분 숙지

## ⏱️ 당일 타임라인 (24시간 기준, 기간에 맞게 비율 조정)
| 구간 | 시간 | 할 일 |
|------|------|-------|
| 솔로 기획 | 0 – 2h | 나 혼자: [solo-playbook.md](solo-playbook.md) 진행 (아이디어 → API 계약 → 더미 API → 이슈) |
| 합류 브리핑 | 2h – 2h 20m | 팀원 `git pull` + 10분 브리핑 + 이슈 배정 |
| MVP 개발 | ~ 12h | 핵심 기능 3개 end-to-end 연결 (가짜 데이터라도 흐름 먼저) |
| 고도화 | ~ 18h | 모델/프롬프트 개선, UI 다듬기 |
| 마무리 | 마지막 ~4h | 기능 동결 → 데모 리허설 → 발표 자료 → 제출 |

## 🚨 원칙
- [ ] 합류 후 1~2시간 안에 "화면 → 백엔드 → AI" 한 바퀴 동작
- [ ] 마감 3~4시간 전 **기능 동결** (feature freeze), 이후 버그 수정만
- [ ] 데모는 녹화본도 백업으로 준비 (네트워크/API 장애 대비)
- [ ] 비밀키는 절대 커밋 금지
- [ ] 시연 방식 결정: [deploy.md](deploy.md)

## 📤 제출 전
- [ ] README 주제/소개/실행법 업데이트
- [ ] 데모 영상 / 스크린샷
- [ ] 발표 자료 최종본
- [ ] 레포 공개 여부 & 제출 링크 확인
