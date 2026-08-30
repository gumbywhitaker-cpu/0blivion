# LLaMEA Agent Setup — Hermes3 (conductor) + Qwen3:30b (heavy lifter)

Windows installer for [jarvis_ai](https://github.com/eadmin2/jarvis_ai) (a
voice + HUD front end for NousResearch's
[Hermes Agent](https://github.com/NousResearch/hermes-agent)), wired to two
local [Ollama](https://ollama.com) models:

- **`hermes3:latest`** — the *conductor*. This is Hermes Agent's main/default
  model: it owns the agent loop, tool calls, conversation, and orchestration.
- **`qwen3:30b`** — the *heavy lifter*. Wired in as an Ollama-backed provider
  you can switch to mid-session for anything that needs a bigger model
  (`/model qwen3:30b --provider ollama`), and pre-wired into the specific
  Hermes "auxiliary" tasks that are actually reasoning-heavy (context
  compression, request triage, kanban decomposition — see below).

Everything installs into `C:\Users\nick\LLaMEA-main\LLaMEA-main` by default
(override with `-InstallRoot` — see below).

## Important: read this before running anything

**Hermes Agent itself only supports Linux, macOS, or WSL2** — there is no
native Windows build. `install.ps1` therefore drives the install *through
WSL2*: Ollama runs natively on Windows (for GPU access), and Hermes Agent +
jarvis_ai run inside a WSL2 Ubuntu distro, talking to Windows' Ollama over
the network.

**Hermes Agent has no built-in "conductor / heavy-lifter" model
architecture.** This is not a Hermes feature — it's a configuration pattern
built out of the pieces Hermes actually has:

| Hermes concept | What we use it for here |
|---|---|
| `model.default` | The conductor (`hermes3:latest`) — the model driving the agent loop by default. |
| `providers.ollama` | A named custom provider exposing both models from your local Ollama. |
| `/model qwen3:30b --provider ollama` | Manual mid-session switch to the heavy lifter when you want it to do the actual work. |
| `auxiliary.compression`, `auxiliary.triage_specifier`, `auxiliary.kanban_decomposer` | The auxiliary tasks that are genuinely reasoning-heavy — routed to `qwen3:30b` instead of the default. Auxiliary tasks are *side* tasks (vision, title generation, approval prompts, etc.); most stay on the conductor via `provider: auto`. |
| `fallback_providers` | `qwen3:30b` is also registered as the fallback if the conductor's endpoint fails. |

There is no mechanism in Hermes to automatically hand off an entire
in-progress *main* agent turn to a second model — that always requires the
manual `/model` switch above. If you were expecting an automatic "conductor
delegates hard problems to the heavy lifter" behavior, that doesn't exist
upstream; this setup gets you as close as the real config surface allows.

## What's in this folder

| File | Purpose |
|---|---|
| `install.ps1` | Run this **from an elevated Windows PowerShell prompt**. Installs Ollama, pulls both models, ensures WSL2 + Ubuntu exist, copies this folder's scripts in, then runs `wsl-setup.sh` inside WSL2. |
| `wsl-setup.sh` | Runs inside WSL2 Ubuntu. Installs Hermes Agent, clones `jarvis_ai`, sets up its Python venv, and writes `~/.hermes/config.yaml` from the template below. |
| `hermes-config.yaml.template` | The Hermes `config.yaml` implementing the table above. `wsl-setup.sh` substitutes `${OLLAMA_BASE_URL}` and writes it to `~/.hermes/config.yaml`. |
| `jarvis-server.env.example` | Placeholders for the secrets `jarvis_ai` needs (`API_SERVER_KEY`, `JARVIS_HUD_TOKEN`, `ELEVENLABS_API_KEY`) — copy to `~/.hermes/.env` inside WSL2 and fill in. Never commit real values here. |

## Usage

1. Open PowerShell **as Administrator** on the Windows machine.
2. From this folder:
   ```powershell
   .\install.ps1
   # or, to install somewhere other than C:\Users\nick\LLaMEA-main\LLaMEA-main:
   .\install.ps1 -InstallRoot "D:\somewhere\else"
   ```
3. The script will pause and tell you to fill in `~/.hermes/.env` (inside
   WSL2, at `\\wsl$\Ubuntu\home\<you>\.hermes\.env`) with your ElevenLabs key
   and generated secrets — see `jarvis-server.env.example` — before the
   voice server (`jarvis_ai/server/server.py`) will actually run.
4. Follow the remaining manual steps `jarvis_ai`'s own
   [docs/SETUP.md](https://github.com/eadmin2/jarvis_ai/blob/main/docs/SETUP.md)
   describes (TLS cert trust on the browser device, boot-audio generation,
   etc.) — those are unavoidably interactive and aren't scripted here.

## Verifying the model wiring after install

Inside WSL2:

```bash
hermes model list                 # confirm both models show under provider "ollama"
cat ~/.hermes/config.yaml         # confirm model.default is hermes3:latest
```

Inside a Hermes session, force the heavy lifter for one turn:

```
/model qwen3:30b --provider ollama
```
