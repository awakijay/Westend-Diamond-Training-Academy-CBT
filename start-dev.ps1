param(
  [string]$ApiBaseUrl = "http://localhost:4000/api"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendEnvPath = Join-Path $projectRoot "backend\.env"
$backendEnvExamplePath = Join-Path $projectRoot "backend\.env.example"
$backendNodeModulesPath = Join-Path $projectRoot "backend\node_modules"
$frontendNodeModulesPath = Join-Path $projectRoot "node_modules"

if (-not (Test-Path $backendEnvPath)) {
  Copy-Item $backendEnvExamplePath $backendEnvPath
}

if (-not (Test-Path $backendNodeModulesPath)) {
  Write-Host "Installing backend dependencies..."
  & npm.cmd --prefix backend install
}

if (-not (Test-Path $frontendNodeModulesPath)) {
  Write-Host "Installing frontend dependencies..."
  & npm.cmd install
}

$escapedProjectRoot = $projectRoot.Replace("'", "''")
$escapedApiBaseUrl = $ApiBaseUrl.Replace("'", "''")

$backendCommand = @"
Set-Location '$escapedProjectRoot'
if (-not (Test-Path 'backend\.env')) { Copy-Item 'backend\.env.example' 'backend\.env' }
npm.cmd --prefix backend run dev
"@

$frontendCommand = @"
Set-Location '$escapedProjectRoot'
`$env:VITE_API_BASE_URL = '$escapedApiBaseUrl'
npm.cmd run dev
"@

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  $backendCommand
)

Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  $frontendCommand
)

Write-Host ""
Write-Host "Backend starting in a new PowerShell window at http://localhost:4000"
Write-Host "Frontend starting in a new PowerShell window at http://localhost:5173"
Write-Host "Student app: http://localhost:5173/#/"
Write-Host "Admin app:   http://localhost:5173/#/admin"
