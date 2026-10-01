# 👋 팀원 온보딩

## 1. 해커톤 전날 (집에서, 약 10분)

필요 도구: **Git, Python 3.10+, Node.js 20+**

```bash
git clone https://github.com/taehyoni7413/Hackathon.git
cd Hackathon
```

```powershell
# Windows
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
```

```bash
# macOS / Linux
bash scripts/setup.sh
```

마지막에 `✅ 세팅 완료!` 가 뜨면 끝. 한 번 실행해 보기:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\dev.ps1   # Windows
bash scripts/dev.sh                                         # macOS / Linux
```

http://localhost:3000 에서 오른쪽 위에 **"백엔드 연결됨"** 이 보이면 성공.
안 되면 단톡에 에러 메시지 캡처 공유.

## 2. 해커톤 당일 도착하면

```bash
git checkout main
git pull
# 패키지가 바뀌었을 수 있으니 setup 한 번 더 (빠르게 끝남)
```

그 다음 순서대로 읽기 (10분):
1. [`docs/ideas.md`](ideas.md) — 우리가 만들 것
2. [`docs/api-contract.md`](api-contract.md) — 백엔드 ↔ 프론트 약속
3. GitHub **Issues** — 내 역할 라벨의 이슈를 골라 본인에게 assign

## 3. 작업 흐름

```bash
git checkout main && git pull
git checkout -b feat/<이슈번호>-<짧은설명>     # 예: feat/12-result-page
# 작업 → 커밋
git push -u origin feat/12-result-page
# GitHub에서 PR 생성 (본문에 closes #12)
```

규칙 요약은 [CONTRIBUTING](../.github/CONTRIBUTING.md), 역할별 폴더는 [roles.md](roles.md).

## 🔑 API 키
- 기본값 `MOCK_LLM=1` → 키 없이 `/chat` 이 가짜 응답을 줌. **대부분 이대로 개발**하면 됨.
- 실제 Claude 호출은 AI/백엔드 담당과 시연 노트북만 (`MOCK_LLM=0` + `ANTHROPIC_API_KEY`).
