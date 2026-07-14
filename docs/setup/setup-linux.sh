#!/usr/bin/env bash
# Workshop Setup — Linux (Ubuntu/Debian)
# Usage: bash setup-linux.sh [--wezterm] [--docker]
set -uo pipefail

# ── ANSI colors ───────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'
CYAN='\033[0;36m';  BOLD='\033[1m';      DIM='\033[2m';  NC='\033[0m'

# ── Animation helpers ─────────────────────────────────────────────────────────
SPIN='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
ERRORS=()

section() {
  local num=$1 total=$2 label="$3"
  local pct=$(( num * 100 / total ))
  local width=22
  local filled=$(( width * pct / 100 ))
  local bar="" i=0
  while [ $i -lt $filled ]; do bar="${bar}█"; i=$((i + 1)); done
  while [ $i -lt $width ];  do bar="${bar}░"; i=$((i + 1)); done
  printf "\n${BOLD}${CYAN}[%d/%d]${NC} %-32s ${YELLOW}[%s] %3d%%${NC}\n" \
    "$num" "$total" "$label" "$bar" "$pct"
}

run_step() {
  local label="$1"; shift
  local tmplog; tmplog=$(mktemp)
  local i=0

  "$@" >"$tmplog" 2>&1 &
  local pid=$!

  while kill -0 "$pid" 2>/dev/null; do
    local ch="${SPIN:$(( i % ${#SPIN} )):1}"
    printf "\r  ${CYAN}%s${NC}  %s" "$ch" "$label"
    i=$(( i + 1 ))
    sleep 0.08
  done

  wait "$pid"; local rc=$?
  if [[ $rc -eq 0 ]]; then
    printf "\r${GREEN}✅${NC}  %s\n" "$label"
  else
    printf "\r${RED}❌${NC}  %s\n" "$label"
    sed 's/^/     /' "$tmplog" | head -5 || true
    ERRORS+=("$label")
  fi
  rm -f "$tmplog"
  return $rc
}

installed() { command -v "$1" &>/dev/null; }

# ── Root check ────────────────────────────────────────────────────────────────
if [[ $EUID -eq 0 ]]; then
  printf "${YELLOW}⚠️  Running as root. Recommended: run as normal user with sudo.${NC}\n"
fi

# ── sudo pre-auth ─────────────────────────────────────────────────────────────
printf "${CYAN}🔑  sudo 권한이 필요합니다. 암호를 입력하세요:${NC}\n"
sudo -v || { printf "${RED}❌  sudo 인증 실패. 스크립트를 종료합니다.${NC}\n"; exit 1; }
# 스크립트 실행 중 sudo 세션이 만료되지 않도록 백그라운드에서 갱신
( while true; do sudo -n true; sleep 60; done ) &
SUDO_KEEPALIVE_PID=$!
trap 'kill "$SUDO_KEEPALIVE_PID" 2>/dev/null' EXIT

# ── Header ────────────────────────────────────────────────────────────────────
clear
printf "${BOLD}${CYAN}"
cat << 'EOF'
  ╔══════════════════════════════════════════╗
  ║     Workshop Setup — Linux               ║
  ╚══════════════════════════════════════════╝
EOF
printf "${NC}\n"

TOTAL=8

# ── 1. System update ──────────────────────────────────────────────────────────
section 1 $TOTAL "System update"
run_step "apt update & upgrade" bash -c 'sudo apt-get update -q && sudo apt-get upgrade -y -q'

# ── 2. Base tools ─────────────────────────────────────────────────────────────
section 2 $TOTAL "Base tools"
MISSING=()
for pkg in curl git unzip; do installed "$pkg" || MISSING+=("$pkg"); done
if [[ ${#MISSING[@]} -gt 0 ]]; then
  run_step "Install ${MISSING[*]}" sudo apt-get install -y -q "${MISSING[@]}"
else
  printf "${GREEN}✅${NC}  curl, git, unzip ${DIM}(already installed)${NC}\n"
fi

if installed gh; then
  printf "${GREEN}✅${NC}  gh ${DIM}(already installed)${NC}\n"
else
  run_step "Add GitHub CLI repo" bash -c '
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
      | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
      | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
    sudo apt-get update -q'
  run_step "Install gh" sudo apt-get install -y -q gh
fi

# ── 3. Runtime: bun ───────────────────────────────────────────────────────────
section 3 $TOTAL "Runtime: bun"
if installed bun; then
  printf "${GREEN}✅${NC}  bun ${DIM}$(bun --version) (already installed)${NC}\n"
else
  run_step "Install bun" bash -c 'curl -fsSL https://bun.sh/install | bash'
  export PATH="$HOME/.bun/bin:$PATH"
  grep -q 'bun' "$HOME/.bashrc" || true \
    || echo 'export PATH="$HOME/.bun/bin:$PATH"' >> "$HOME/.bashrc"
fi

# ── 4. Runtime: python3 ───────────────────────────────────────────────────────
section 4 $TOTAL "Runtime: python3"
if installed python3; then
  printf "${GREEN}✅${NC}  python3 ${DIM}$(python3 --version) (already installed)${NC}\n"
else
  run_step "Install python3" sudo apt-get install -y -q python3 python3-pip python3-venv
fi

# ── 5. Runtime: uv ───────────────────────────────────────────────────────────
section 5 $TOTAL "Runtime: uv"
if installed uv; then
  printf "${GREEN}✅${NC}  uv ${DIM}$(uv --version) (already installed)${NC}\n"
else
  run_step "Install uv" bash -c 'curl -LsSf https://astral.sh/uv/install.sh | sh'
  export PATH="$HOME/.local/bin:$PATH"
fi

# ── 6. CLI tools ──────────────────────────────────────────────────────────────
section 6 $TOTAL "CLI tools"
if installed claude; then
  printf "${GREEN}✅${NC}  claude ${DIM}(already installed)${NC}\n"
else
  if ! run_step "Install Claude Code CLI" bun install -g @anthropic-ai/claude-code; then
    run_step "Install Node.js (fallback)" bash -c \
      'curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo bash - && sudo apt-get install -y -q nodejs'
    run_step "Install Claude Code CLI (npm)" npm install -g @anthropic-ai/claude-code
  fi
fi

if installed agy; then
  printf "${GREEN}✅${NC}  agy ${DIM}(already installed)${NC}\n"
else
  run_step "Install Antigravity CLI" bash -c \
    'curl -fsSL https://antigravity.google/cli/install.sh | bash'
fi

# ── 7. Desktop apps ───────────────────────────────────────────────────────────
section 7 $TOTAL "Desktop apps"
if installed google-chrome || installed google-chrome-stable; then
  printf "${GREEN}✅${NC}  Google Chrome ${DIM}(already installed)${NC}\n"
else
  run_step "Download Chrome .deb" bash -c \
    'wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb -O /tmp/chrome.deb'
  run_step "Install Google Chrome" bash -c \
    'sudo dpkg -i /tmp/chrome.deb || sudo apt-get install -f -y -q; rm -f /tmp/chrome.deb'
fi

printf "${YELLOW}⚠️ ${NC}  Claude Desktop — check availability at ${CYAN}https://claude.ai/download${NC}\n"
printf "${YELLOW}⚠️ ${NC}  Antigravity Desktop — install manually: ${CYAN}https://antigravity.google${NC}\n"
printf "${YELLOW}⚠️ ${NC}  Mark (Markdown viewer) — install manually: ${CYAN}https://playloom.app/mark${NC}\n"

if [[ " $* " == *" --docker "* ]]; then
  if installed docker; then
    printf "${GREEN}✅${NC}  Docker ${DIM}$(docker --version) (already installed)${NC}\n"
  else
    run_step "Install Docker" bash -c 'curl -fsSL https://get.docker.com | sudo sh'
    run_step "Add user to docker group" bash -c "sudo usermod -aG docker ${USER:-$(whoami)}"
    printf "${YELLOW}⚠️ ${NC}  Log out and back in for docker group to take effect.\n"
  fi
fi

if [[ " $* " == *" --wezterm "* ]] || [[ "${1:-}" == "--wezterm" ]]; then
  if installed wezterm; then
    printf "${GREEN}✅${NC}  WezTerm ${DIM}(already installed)${NC}\n"
  else
    run_step "Add WezTerm repo" bash -c '
      curl -fsSL https://apt.fury.io/wez/gpg.key \
        | sudo gpg --dearmor -o /usr/share/keyrings/wezterm-fury.gpg
      echo "deb [signed-by=/usr/share/keyrings/wezterm-fury.gpg] https://apt.fury.io/wez/ * *" \
        | sudo tee /etc/apt/sources.list.d/wezterm.list
      sudo apt-get update -q'
    run_step "Install WezTerm" sudo apt-get install -y -q wezterm
  fi
fi

# ── 8. Git config check ───────────────────────────────────────────────────────
section 8 $TOTAL "Git & GitHub"
GIT_NAME=$(git config --global user.name  2>/dev/null || true)
GIT_EMAIL=$(git config --global user.email 2>/dev/null || true)
if [[ -n "$GIT_NAME" && -n "$GIT_EMAIL" ]]; then
  printf "${GREEN}✅${NC}  git config: ${CYAN}%s <%s>${NC}\n" "$GIT_NAME" "$GIT_EMAIL"
else
  printf "${YELLOW}⚠️ ${NC}  git user not configured\n"
  printf "     ${DIM}git config --global user.name 'Your Name'${NC}\n"
  printf "     ${DIM}git config --global user.email 'you@example.com'${NC}\n"
fi

if gh auth status &>/dev/null || true; then
  printf "${GREEN}✅${NC}  gh auth: logged in\n"
else
  printf "${YELLOW}⚠️ ${NC}  gh auth: not logged in — run ${CYAN}gh auth login${NC} before the workshop\n"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
printf "\n${BOLD}${CYAN}══════════════════════════════════════════${NC}\n"
if [[ ${#ERRORS[@]} -eq 0 ]]; then
  printf "${GREEN}✅  All steps complete!${NC}\n"
  printf "\n  Next → ${CYAN}bun setup-common.ts${NC}\n"
else
  printf "${RED}❌  Failed: %s${NC}\n" "${ERRORS[*]}"
  exit 1
fi
printf "${BOLD}${CYAN}══════════════════════════════════════════${NC}\n\n"
