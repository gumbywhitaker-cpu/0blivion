<#
.SYNOPSIS
  One-time setup for running KiwiFlow locally on Windows.

.DESCRIPTION
  Installs dependencies, creates a .env with a freshly generated AUTH_SECRET,
  sets up the local SQLite database, seeds it with demo data, and starts the
  dev server. See docs/WINDOWS_INSTALL.md for the guide this script backs.

  Safe to re-run: each step is a no-op (or asks before overwriting) if
  you've already run it before.
#>

$ErrorActionPreference = 'Stop'

function Write-Step($msg) {
  Write-Host ""
  Write-Host "==> $msg" -ForegroundColor Cyan
}

function Test-Command($name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

# --- Sanity check: are we in the kiwiflow project folder? ---
if (-not (Test-Path (Join-Path $PSScriptRoot '..\package.json'))) {
  Write-Host "Couldn't find package.json next to this script's parent folder." -ForegroundColor Red
  Write-Host "Run this from inside the cloned 'kiwiflow' folder, e.g.:"
  Write-Host "  cd 0blivion\kiwiflow"
  Write-Host "  .\scripts\windows-setup.ps1"
  exit 1
}
Set-Location (Join-Path $PSScriptRoot '..')

# --- Check prerequisites ---
Write-Step "Checking for Git and Node.js"
$missing = @()
if (-not (Test-Command 'git')) { $missing += 'Git (https://git-scm.com/download/win)' }
if (-not (Test-Command 'node')) { $missing += 'Node.js LTS (https://nodejs.org)' }
if ($missing.Count -gt 0) {
  Write-Host "Missing prerequisite(s):" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host "  - $_" }
  Write-Host "Install the above, close and reopen PowerShell, then re-run this script."
  exit 1
}
$nodeVersion = node --version
Write-Host "Found Node.js $nodeVersion and Git."

# --- Install dependencies ---
Write-Step "Installing dependencies (npm install)"
npm install
if ($LASTEXITCODE -ne 0) {
  Write-Host "npm install failed -- see docs/WINDOWS_INSTALL.md's Troubleshooting section." -ForegroundColor Red
  exit 1
}

# --- Set up .env ---
Write-Step "Setting up .env"
if (Test-Path '.env') {
  Write-Host ".env already exists -- leaving it as-is."
} else {
  Copy-Item '.env.example' '.env'
  $secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
  (Get-Content '.env') -replace 'AUTH_SECRET=".*"', "AUTH_SECRET=`"$secret`"" | Set-Content '.env'
  Write-Host "Created .env with a freshly generated AUTH_SECRET."
  Write-Host "(Optional integrations like email/AI/Xero/MYOB are left blank -- the app"
  Write-Host " runs fine without them; see .env.example for what each one enables.)"
}

# --- Database setup ---
Write-Step "Setting up the local database (Prisma migrate)"
npx prisma migrate dev --name init
if ($LASTEXITCODE -ne 0) {
  Write-Host "Database setup failed -- see docs/WINDOWS_INSTALL.md's Troubleshooting section." -ForegroundColor Red
  exit 1
}

Write-Step "Loading demo data"
npm run db:seed

# --- Done ---
Write-Step "All set"
Write-Host "Demo logins:"
Write-Host "  Grower:     hana@whakatane-orchards.example / kiwiflow123"
Write-Host "  Contractor: wiremu@southernharvest.example / kiwiflow123"
Write-Host ""
Write-Host "Starting the dev server -- open http://localhost:3000 once it's ready."
Write-Host "(Press Ctrl+C to stop it; run 'npm run dev' from this folder to start it again later.)"
Write-Host ""
npm run dev
