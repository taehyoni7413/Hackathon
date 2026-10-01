# 👋 팀원 온보딩

> 대회 규칙·주제·심사 기준은 [contest.md](contest.md) 먼저 읽기 (5분).
> 개발 시간은 **10/1 19:30 ~ 10/2 11:30**. 핵심 기능 코드는 이 시간 안에만 작성.

## 1. 오기 전에 (약 10분)

필요 도구: **Git, Python 3.10+, Node.js 20+**

<details>
<summary>🍎 macOS 사용자: 도구 설치 (처음 한 번)</summary>

macOS 기본 `python3` 는 3.9 인 경우가 많아서 **새로 설치**해야 합니다. 터미널(⌘+Space → "터미널")에서:

```bash
# 1) Homebrew 가 없으면 설치 (https://brew.sh)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2) 도구 설치
xcode-select --install          # git (이미 있으면 에러 메시지 무시)
brew install python@3.12 node

# 3) 확인
python3.12 --version            # 3.12.x
node --version                  # v20 이상
```

`setup.sh` 가 3.10 이상 Python 을 자동으로 찾아 씁니다. 버전이 낮으면 설치 명령을 안내하고 멈춥니다.
</details>

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

http://localhost:3000 에서 오른쪽 위에 **"백엔드 연결됨"** 이 보이면 성공. 끌 때는 터미널에서 `Ctrl+C` (맥도 `Ctrl+C`, ⌘ 아님).
안 되면 단톡에 에러 메시지 캡처 공유.

## 2. 도착하면

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

> 외부 API·오픈소스 라이브러리·데이터를 새로 쓰면 README「외부 자료」에 바로 한 줄 추가 (발표에서 공개 필수).

## 🔑 API 키
- 기본값 `MOCK_LLM=1` → 키 없이 `/chat` 이 가짜 응답을 줌. **대부분 이대로 개발**하면 됨.
- 실제 Claude 호출은 AI/백엔드 담당과 시연 노트북만 (`MOCK_LLM=0` + `ANTHROPIC_API_KEY`).
