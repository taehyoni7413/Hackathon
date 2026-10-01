#!/usr/bin/env bash
# 백엔드 + 프론트 동시 실행 (macOS / Linux)
# 실행: bash scripts/dev.sh   (Ctrl+C 로 둘 다 종료)
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> FastAPI  http://localhost:8000/docs"
.venv/bin/python -m uvicorn backend.main:app --reload --port 8000 &
BACKEND_PID=$!
trap 'kill $BACKEND_PID 2>/dev/null' EXIT

echo "==> Next.js  http://localhost:3000"
cd web && npm run dev
