<#
.SYNOPSIS
  Installs jarvis_ai + Hermes Agent on Windows, wired to hermes3:latest
  (conductor) and qwen3:30b (heavy lifter) via a local Ollama.

.DESCRIPTION
  Hermes Agent has no native Windows build (Linux/macOS/WSL2 only), so this
  script:
    1. Installs Ollama for Windows (if missing) and pulls both models.
    2. Ensures WSL2 + an Ubuntu distro are installed.
    3. Copies this folder's scripts into the install root (Windows side).
    4. Runs wsl-setup.sh inside WSL2 to install Hermes Agent + jarvis_ai and
       write ~/.hermes/config.yaml.

  Run this from an elevated PowerShell prompt. See README.md for the
  manual steps that remain after this script finishes (secrets, TLS certs,
  boot audio — all interactive / secret-bearing, so not scripted here).

.PARAMETER InstallRoot
  Windows path everything gets installed into.

.PARAMETER WslDistro
  Name of the WSL2 distro to use/install.
#>
[CmdletBinding()]
param(
    [string]$InstallRoot = "C:\Users\nick\LLaMEA-main\LLaMEA-main",
    [string]$WslDistro = "Ubuntu"
)

$ErrorActionPreference = "Stop"

function Test-Admin {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    $p = New-Object Security.Principal.WindowsPrincipal($id)
    return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Admin)) {
    Write-Error "Run this from an elevated (Administrator) PowerShell prompt."
    exit 1
}

Write-Host "==> Install root: $InstallRoot"
New-Item -ItemType Directory -Force -Path $InstallRoot | Out-Null

# --- 1. Ollama ---------------------------------------------------------------
$ollama = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollama) {
    Write-Host "==> Ollama not found. Installing via winget..."
    winget install --id Ollama.Ollama -e --accept-source-agreements --accept-package-agreements
    Write-Host "    Installed. Open a new shell if 'ollama' isn't on PATH yet, then re-run."
    exit 0
} else {
    Write-Host "==> Ollama already installed."
}

Write-Host "==> Pulling models (qwen3:30b is large, ~20GB -- this can take a while)..."
& ollama pull hermes3:latest
& ollama pull qwen3:30b

# --- 2. WSL2 + Ubuntu ----------------------------------------------------------
$wslDistros = (wsl -l -q 2>$null) -replace "`0", ""
if (-not ($wslDistros -match [Regex]::Escape($WslDistro))) {
    Write-Host "==> Installing WSL2 distro '$WslDistro'..."
    wsl --install -d $WslDistro
    Write-Host "!! WSL2/'$WslDistro' just installed for the first time."
    Write-Host "   Reboot if prompted, launch '$WslDistro' once to finish its"
    Write-Host "   first-run setup (create a Linux username/password), then"
    Write-Host "   re-run this script."
    exit 0
} else {
    Write-Host "==> WSL2 distro '$WslDistro' already present."
}

# --- 3. Copy scripts into the install root -------------------------------------
$here = $PSScriptRoot
foreach ($f in @("wsl-setup.sh", "hermes-config.yaml.template", "jarvis-server.env.example")) {
    Copy-Item -Path (Join-Path $here $f) -Destination $InstallRoot -Force
}

# --- 4. Translate the Windows path to its WSL2 mount point ---------------------
$wslInstallRoot = (wsl -d $WslDistro wslpath -a $InstallRoot).Trim()
Write-Host "==> WSL2 sees the install root as: $wslInstallRoot"

# --- 5. Run wsl-setup.sh inside WSL2 --------------------------------------------
Write-Host "==> Running wsl-setup.sh inside WSL2 ($WslDistro)..."
wsl -d $WslDistro bash "$wslInstallRoot/wsl-setup.sh" "$wslInstallRoot"

Write-Host ""
Write-Host "==> Done. See README.md for the remaining manual steps"
Write-Host "    (filling in ~/.hermes/.env, TLS certs, boot audio, starting services)."
