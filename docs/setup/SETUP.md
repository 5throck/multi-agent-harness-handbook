# Workshop Environment Setup Guide

Complete this setup **before** the workshop. The goal: when the session starts, your machine is ready to run all exercises without interruption.

---

## Installation Flow

```
1. OS Update
   └─ Windows: winget upgrade --all
   └─ macOS:   brew update && brew upgrade
   └─ Linux:   apt update && apt upgrade

2. Base Tools
   └─ Windows: PowerShell 7+, Windows Terminal, Git (+ Git Bash)
   └─ macOS / Linux: curl, git

3. Runtimes
   └─ bun  (primary runtime & package manager)
   └─ python3
   └─ uv   (Python package manager)

4. CLI Tools
   └─ gh  (GitHub CLI)
   └─ claude  (Claude Code CLI)
   └─ agy  (Antigravity CLI)

5. Desktop Apps
   └─ Google Chrome
   └─ Claude Desktop App
   └─ Antigravity Desktop App
   └─ Mark  (Markdown viewer)

6. Verify ✅
   └─ bun setup-common.ts
```

---

## Step 1 — Complete the Checklist

Before running any script, read and complete [`SETUP_CHECKLIST.md`](SETUP_CHECKLIST.md).

Key items:
- Subscribe to **Claude Pro/Max** and **Gemini Advanced** (subscriptions, not API keys)
- Create a **GitHub account** and be ready to run `gh auth login`
- Ensure you have **5 GB** free disk space and **admin/sudo** rights

---

## Step 2 — Run the OS Script

Open a terminal with administrator / sudo privileges and run the script for your OS.

### macOS

```bash
bash setup-mac.sh
# Optional: install WezTerm (GPU-accelerated terminal)
bash setup-mac.sh --wezterm
# Optional: install Docker Desktop
bash setup-mac.sh --docker
# Both optional tools:
bash setup-mac.sh --wezterm --docker
```

### Linux (Ubuntu / Debian)

```bash
bash setup-linux.sh
# Optional: install WezTerm
bash setup-linux.sh --wezterm
# Optional: install Docker
bash setup-linux.sh --docker
# Both optional tools:
bash setup-linux.sh --wezterm --docker
```

### Windows

Open **PowerShell as Administrator** and run:

```powershell
# Run setup (Execution Policy is auto-configured by the script)
.\setup-windows.ps1

# Options:
.\setup-windows.ps1 -WSL2      # also install WSL2 (requires restart)
.\setup-windows.ps1 -WezTerm   # also install WezTerm
.\setup-windows.ps1 -Docker    # also install Docker Desktop
.\setup-windows.ps1 -Force      # reinstall all tools even if already installed
.\setup-windows.ps1 -WSL2 -WezTerm -Docker  # all optional tools
```

> **After running**: close and reopen the terminal so PATH changes take effect.

---

## Step 3 — Verify Installation

```bash
bun setup-common.ts
```

This prints a verification table of all installed tools. **All rows must show ✅ before the workshop.**

---

## Installed Tools Summary

| Tool | Purpose | macOS | Linux | Windows |
|------|---------|-------|-------|---------|
| **bun** | Runtime & package manager | `bun.sh/install` | `bun.sh/install` | `bun.sh/install.ps1` |
| **git** | Version control | `brew install git` | `apt install git` | `winget Git.Git` |
| **gh** | GitHub CLI | `brew install gh` | apt (official repo) | `winget GitHub.cli` |
| **python3** | Python runtime | `brew install python3` | `apt install python3` | `winget Python.Python.3.13` |
| **uv** | Python package manager | `brew install uv` | `astral.sh/uv/install.sh` | `winget astral-sh.uv` |
| **claude** | Claude Code CLI | `bun install -g @anthropic-ai/claude-code` | `bun install -g @anthropic-ai/claude-code` | `bun install -g @anthropic-ai/claude-code` |
| **agy** | Antigravity CLI | `antigravity.google/cli/install.sh` | `antigravity.google/cli/install.sh` | `antigravity.google/cli/install.ps1` |
| **Google Chrome** | Browser | `brew install --cask google-chrome` | `.deb` direct download | `winget Google.Chrome` |
| **Claude Desktop** | Claude desktop app | `brew install --cask claude` | ⚠️ manual | `winget Anthropic.Claude` |
| **Antigravity Desktop** | Antigravity desktop app | ⚠️ manual | ⚠️ manual | ⚠️ manual |
| **Mark** | Markdown viewer | ⚠️ manual | ⚠️ manual | ⚠️ manual |
| **PowerShell 7+** | Shell | — | — | `winget Microsoft.PowerShell` |
| **Windows Terminal** | Terminal | — | — | `winget Microsoft.WindowsTerminal` |
| **unzip** | Archive tool | — (built-in) | `apt install unzip` | — (built-in) |
| **curl** | HTTP client | — (built-in) | `apt install curl` | — (built-in) |

> ⚠️ items require manual download and install.

### Optional tools (`--wezterm`, `--docker`)

| Tool | macOS | Linux | Windows |
|------|-------|-------|---------|
| **WezTerm** (`--wezterm`) | `brew install --cask wezterm` | apt (fury.io repo) | `winget wez.wezterm` |
| **Docker** (`--docker`) | `brew install --cask docker` | `get.docker.com` script | `winget Docker.DockerDesktop` |
| **WSL2** (`-WSL2`, Windows only) | — | — | `wsl --install` |

---

## Terminal App Recommendation (Windows)

| App | Description | Install |
|-----|-------------|---------|
| **Windows Terminal** ⭐ | Microsoft official, tabbed, WSL-integrated — recommended default | `winget install Microsoft.WindowsTerminal` |
| **WezTerm** | GPU-accelerated, multiplexer built-in, cross-platform — power user upgrade | `winget install wez.wezterm` |

Use `.\setup-windows.ps1 -WezTerm` to install WezTerm automatically.

---

## Troubleshooting

**`bun: command not found` after install**
Restart your terminal. On Windows, bun is automatically registered in the User PATH. macOS/Linux:
```bash
export PATH="$HOME/.bun/bin:$PATH"
```

**`claude: command not found` after `bun install -g`**
The script automatically retries with npm fallback if bun fails. If issues persist, check `bun pm ls -g` and add the bin dir to PATH.

**`agy: command not found` after install**
The Antigravity CLI install script places the binary in `~/.local/bin` or `/usr/local/bin`. Run `source ~/.bashrc` or restart your terminal.

**Windows: `execution of scripts is disabled`**
The script auto-configures `RemoteSigned`. To set manually:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Windows: running without admin privileges**
The script warns but continues. Some installs (winget, WSL2) may fail. Recommended: re-run PowerShell as Administrator.

**Installation logs**
Windows setup logs are automatically saved to `%USERPROFILE%\workshop-setup-logs\`.

---

> Run `bun setup-common.ts` as a final check. If all rows show ✅ you're ready for the workshop.
