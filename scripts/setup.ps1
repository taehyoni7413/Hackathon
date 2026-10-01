# 원클릭 환경 세팅 (Windows)
# 실행: powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

Step "필수 도구 확인"
foreach ($cmd in @("python", "node", "npm", "git")) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "  $cmd 가 설치되어 있지 않습니다." -ForegroundColor Red
        exit 1
    }
}
python --version
node --version

Step "Python 가상환경 + 패키지 설치"
if (-not (Test-Path .venv)) { python -m venv .venv }
& .\.venv\Scripts\python -m pip install -q --upgrade pip
& .\.venv\Scripts\python -m pip install -q -r requirements.txt -r ml\requirements.txt

Step "환경변수 파일 생성 (이미 있으면 건너뜀)"
if (-not (Test-Path .env)) { Copy-Item .env.example .env; Write-Host "  .env 생성 (MOCK_LLM=1)" }
if (-not (Test-Path web\.env.local)) { Copy-Item web\.env.example web\.env.local; Write-Host "  web\.env.local 생성" }

Step "Next.js 패키지 설치"
Push-Location web
npm ci
Pop-Location

Step "백엔드 테스트"
& .\.venv\Scripts\python -m pytest -q
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "`n✅ 세팅 완료! 실행: powershell -ExecutionPolicy Bypass -File scripts\dev.ps1" -ForegroundColor Green
