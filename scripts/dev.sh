#!/usr/bin/env bash
# 백엔드 + 프론트 동시 실행 (macOS / Linux)
# 실행: bash scripts/dev.sh   (Ctrl+C 로 둘 다 종료)
set -euo pipefail
cd "$(dirname "$0")/.."

[ -x .venv/bin/python ] || { echo "먼저 세팅을 실행하세요: bash scripts/setup.sh"; exit 1; }

for port in 8000 3000; do
  if command -v lsof >/dev/null && lsof -ti tcp:$port >/dev/null 2>&1; then
    echo "포트 $port 이 이미 사용 중입니다. 이전에 켜 둔 서버를 끄거나: kill \$(lsof -ti tcp:$port)"
    exit 1
  fi
done

echo "==> FastAPI  http://localhost:8000/docs"
.venv/bin/python -m uvicorn backend.main:app --reload --port 8000 &
BACKEND_PID=$!
trap 'kill $BACKEND_PID 2>/dev/null' EXIT

echo "==> Next.js  http://localhost:3000"
cd web && npm run dev
