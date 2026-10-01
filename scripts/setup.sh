#!/usr/bin/env bash
# 원클릭 환경 세팅 (macOS / Linux)
# 실행: bash scripts/setup.sh
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf '\n\033[36m==> %s\033[0m\n' "$1"; }

step "필수 도구 확인"
for cmd in python3 node npm git; do
  command -v "$cmd" >/dev/null || { echo "  $cmd 가 설치되어 있지 않습니다."; exit 1; }
done
python3 --version
node --version

step "Python 가상환경 + 패키지 설치"
[ -d .venv ] || python3 -m venv .venv
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
