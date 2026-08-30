#!/usr/bin/env bash
# wsl-setup.sh — installs Hermes Agent + jarvis_ai inside WSL2, and wires
# ~/.hermes/config.yaml to use hermes3:latest (conductor) and qwen3:30b
# (heavy lifter) via Ollama running on the Windows host.
#
# Invoked by install.ps1 as: bash wsl-setup.sh <install-root-wsl-path>
# Can also be run standalone from inside WSL2, e.g.:
#   bash wsl-setup.sh /mnt/c/Users/nick/LLaMEA-main/LLaMEA-main
set -euo pipefail

INSTALL_ROOT="${1:-$HOME/llamea-agent-setup}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_REPO="https://github.com/eadmin2/jarvis_ai.git"
JARVIS_DIR="$INSTALL_ROOT/jarvis_ai"

echo "==> Installing into: $INSTALL_ROOT"
mkdir -p "$INSTALL_ROOT"

# --- 1. Locate the Ollama endpoint reachable from WSL2 ----------------------
# Ollama runs natively on Windows (for GPU access); WSL2 has to reach it
# over the network. On Windows 11 "mirrored" WSL networking, localhost
# works directly. Otherwise, reach it via the WSL2 default-route gateway,
# which requires OLLAMA_HOST=0.0.0.0 on the Windows side and a firewall
# rule allowing inbound on 11434.
echo "==> Locating Ollama (expected to be running on the Windows host)..."
OLLAMA_BASE_URL=""
gateway_ip="$(ip route show default 2>/dev/null | awk '{print $3; exit}')"
for candidate in "http://localhost:11434" "http://${gateway_ip:-unset}:11434"; do
  if curl -fsS --max-time 3 "$candidate/api/tags" >/dev/null 2>&1; then
    OLLAMA_BASE_URL="$candidate/v1"
    echo "    found Ollama at $candidate"
    break
  fi
done

if [ -z "$OLLAMA_BASE_URL" ]; then
  echo "!! Could not reach Ollama from inside WSL2." >&2
  echo "   Make sure Ollama is running on Windows and, if you're not on" >&2
  echo "   WSL2 'mirrored' networking mode, that it's listening on" >&2
  echo "   0.0.0.0 (set OLLAMA_HOST=0.0.0.0 before 'ollama serve' on Windows)" >&2
  echo "   and that the Windows Firewall allows inbound on port 11434." >&2
  echo "   Falling back to http://localhost:11434/v1 -- fix Ollama's" >&2
  echo "   reachability, then edit ~/.hermes/config.yaml by hand." >&2
  OLLAMA_BASE_URL="http://localhost:11434/v1"
fi

# --- 2. OS prerequisites -----------------------------------------------------
echo "==> Installing OS packages (git, python3, curl)..."
sudo apt-get update -y
sudo apt-get install -y git python3 python3-venv python3-pip curl

# --- 3. Hermes Agent ----------------------------------------------------------
if ! command -v hermes >/dev/null 2>&1; then
  echo "==> Installing Hermes Agent..."
  curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
  # shellcheck disable=SC1090
  source "$HOME/.bashrc" 2>/dev/null || true
else
  echo "==> Hermes Agent already installed."
fi

# --- 4. ~/.hermes/config.yaml from the template ------------------------------
echo "==> Writing ~/.hermes/config.yaml (conductor=hermes3:latest, heavy lifter=qwen3:30b)..."
mkdir -p "$HOME/.hermes"
sed "s#\${OLLAMA_BASE_URL}#$OLLAMA_BASE_URL#g" \
  "$SCRIPT_DIR/hermes-config.yaml.template" > "$HOME/.hermes/config.yaml"

if [ ! -f "$HOME/.hermes/.env" ]; then
  echo "==> Seeding ~/.hermes/.env from jarvis-server.env.example (fill in real values!)"
  cp "$SCRIPT_DIR/jarvis-server.env.example" "$HOME/.hermes/.env"
fi

# --- 5. jarvis_ai --------------------------------------------------------------
if [ -d "$JARVIS_DIR/.git" ]; then
  echo "==> jarvis_ai already present at $JARVIS_DIR, pulling latest..."
  git -C "$JARVIS_DIR" pull --ff-only
else
  echo "==> Cloning jarvis_ai into $JARVIS_DIR..."
  git clone "$JARVIS_REPO" "$JARVIS_DIR"
fi

echo "==> Setting up jarvis_ai/server Python venv..."
cd "$JARVIS_DIR/server"
python3 -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install fastapi uvicorn requests pyyaml numpy anthropic \
  RealtimeSTT faster-whisper silero-vad websockets psutil

if [ ! -f config/server.yaml ]; then
  cp config/server.example.yaml config/server.yaml
  echo "    -> edit $JARVIS_DIR/server/config/server.yaml (voice.voice_id, machines:)"
fi

echo
echo "==================================================================="
echo " Done. Conductor=hermes3:latest, heavy lifter=qwen3:30b via Ollama"
echo " at $OLLAMA_BASE_URL."
echo
echo " Still to do by hand (interactive / secret-bearing, not scripted):"
echo "   1. Edit ~/.hermes/.env with real API_SERVER_KEY, JARVIS_HUD_TOKEN,"
echo "      and ELEVENLABS_API_KEY (see jarvis-server.env.example)."
echo "   2. hermes gateway              # start the Hermes API server"
echo "   3. cd $JARVIS_DIR/server && scripts/make-certs.sh"
echo "   4. scripts/make-boot-audio.sh YourName"
echo "   5. .venv/bin/python server.py  # start the voice/HUD server"
echo "==================================================================="
