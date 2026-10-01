---
description: 선정한 아이디어로 MVP·API 계약·더미 API·역할별 이슈까지 준비 (팀원 합류 전)
argument-hint: <아이디어 번호 또는 설명>
---

`docs/ideas.md` 의 아이디어 중 "$ARGUMENTS" 로 확정한다. 팀원이 합류하자마자 각자 개발을 시작할 수 있도록 아래를 순서대로 진행하라. 각 단계 끝에 한 줄로 진행 상황을 알려라.

1. **아이디어 확정**: `docs/ideas.md` "최종 선정" 섹션 작성. MVP 핵심 기능은 최대 3개, 나머지는 "있으면 좋은 기능"으로.
2. **데모 시나리오**: `docs/pitch.md` 의 "데모 시나리오"에 사용자 관점 3~5단계로 작성.
3. **API 계약**: `docs/api-contract.md` 에 MVP에 필요한 엔드포인트를 템플릿 형식(요청/응답 예시 JSON, 에러)으로 추가하고 상태 표를 갱신. 예시용 `/predict` 가 필요 없으면 제거 대상으로 표시.
4. **더미 백엔드**: 계약의 각 엔드포인트를 `backend/main.py` 에 Pydantic 모델과 함께 추가하되 응답은 계약 예시와 같은 가짜 값. `tests/` 에 엔드포인트별 200 응답 테스트 추가 후 `pytest` 실행.
5. **프론트 타입**: `web/src/lib/api.ts` 에 계약과 1:1인 타입과 함수 추가. `cd web && npm run lint && npm run build` 로 확인.
6. **이슈 초안**: 역할(`backend` / `ml` / `frontend` / `pm`)별로 1~3개씩, `.github/ISSUE_TEMPLATE/task.md` 형식으로 이슈 초안을 채팅에 표로 보여준다. 이슈 간 의존 관계도 표시.
7. 사용자가 이슈 초안을 승인하면 `gh issue create --label <역할>` 로 생성한다 (라벨이 없으면 `gh label create` 먼저). 승인 전에는 생성하지 않는다.
8. 변경사항을 `feat/kickoff` 브랜치에 커밋하고 PR 생성 여부를 사용자에게 묻는다.

원칙: `docs/contest.md` 규칙을 따른다 (최대 3명, 11:30 제출, 기술 완성도 최우선). 새로 쓰는 외부 API·데이터는 README「외부 자료」 표에 추가한다. 범위를 넓히지 말 것. 화면/모델의 실제 구현은 팀원 몫이므로 더미와 타입까지만 만든다.
