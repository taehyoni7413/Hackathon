#!/usr/bin/env bash
# 원클릭 환경 세팅 (macOS / Linux)
# 실행: bash scripts/setup.sh
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf '\n\033[36m==> %s\033[0m\n' "$1"; }
fail() { printf '\033[31m  %s\033[0m\n' "$1"; exit 1; }

step "필수 도구 확인"
command -v git >/dev/null || fail "git 이 없습니다. 설치: xcode-select --install"

# macOS 기본 python3 는 3.9 인 경우가 많음 → 3.10 이상인 것을 찾아서 사용
PY=""
for cand in python3.13 python3.12 python3.11 python3.10 python3; do
  if command -v "$cand" >/dev/null && "$cand" -c 'import sys; sys.exit(sys.version_info < (3, 10))' 2>/dev/null; then
    PY="$cand"; break
  fi
done
[ -n "$PY" ] || fail "Python 3.10 이상이 필요합니다. 설치: brew install python@3.12  (Homebrew: https://brew.sh)"
"$PY" --version

command -v node >/dev/null || fail "Node.js 가 없습니다. 설치: brew install node"
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
[ "$NODE_MAJOR" -ge 20 ] || fail "Node.js 20 이상이 필요합니다 (현재 $(node --version)). 업데이트: brew upgrade node"
node --version

step "Python 가상환경 + 패키지 설치"
if [ -d .venv ] && ! .venv/bin/python -c 'import sys; sys.exit(sys.version_info < (3, 10))' 2>/dev/null; then
  echo "  기존 .venv 가 Python 3.10 미만이라 다시 만듭니다"
  rm -rf .venv
fi
[ -d .venv ] || "$PY" -m venv .venv
.venv/bin/python -m pip install -q --upgrade pip
.venv/bin/python -m pip install -q -r requirements.txt

step "환경변수 파일 생성 (이미 있으면 건너뜀)"
[ -f .env ] || { cp .env.example .env; echo "  .env 생성 (MOCK_LLM=1)"; }
[ -f web/.env.local ] || { cp web/.env.example web/.env.local; echo "  web/.env.local 생성"; }

step "Next.js 패키지 설치"
(cd web && npm ci)

step "백엔드 테스트"
.venv/bin/python -m pytest -q

printf '\n\033[32m✅ 세팅 완료! 실행: bash scripts/dev.sh\033[0m\n'
