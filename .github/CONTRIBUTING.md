# 🤝 협업 규칙

## 브랜치
- `main`: 항상 실행 가능한 상태 유지 (직접 push 금지, PR로만 머지)
- 작업 브랜치: `feat/<기능>`, `fix/<버그>`, `docs/<문서>`
  - 예: `feat/chat-ui`, `fix/predict-500`

```bash
git checkout main && git pull
git checkout -b feat/my-feature
# 작업...
git add . && git commit -m "feat: 채팅 화면 추가"
git push -u origin feat/my-feature
# GitHub에서 PR 생성 → 1명 리뷰 후 머지
```

## 커밋 메시지
| 타입 | 용도 |
|------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `docs` | 문서 |
| `refactor` | 리팩터링 |
| `chore` | 설정, 의존성 등 |

## 해커톤 특화 규칙
- PR은 작게, 자주. 리뷰는 10분 이내로.
- 충돌 줄이기: 각자 담당 폴더 위주로 작업 (`docs/roles.md` 참고)
- 마감 직전에는 PM 확인 후에만 `main` 머지
