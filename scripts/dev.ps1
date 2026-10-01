# 백엔드 + 프론트 동시 실행 (Windows)
# 실행: powershell -ExecutionPolicy Bypass -File scripts\dev.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "==> FastAPI  http://localhost:8000/docs (새 창)" -ForegroundColor Cyan
$backend = Start-Process -PassThru powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$root'; .\.venv\Scripts\python -m uvicorn backend.main:app --reload --port 8000"
)

Write-Host "==> Next.js  http://localhost:3000" -ForegroundColor Cyan
try {
    Set-Location web
    npm run dev
}
finally {
    if (-not $backend.HasExited) { Stop-Process -Id $backend.Id -Force }
}
