#!/usr/bin/env bash
# Workshop Setup — macOS
# Usage: bash setup-mac.sh [--wezterm] [--docker]
set -uo pipefail

# ── ANSI colors ───────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'
CYAN='\033[0;36m';  BOLD='\033[1m';      DIM='\033[2m';  NC='\033[0m'

# ── Animation helpers ─────────────────────────────────────────────────────────
SPIN='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
ERRORS=()

# Section header with overall progress bar
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

# Run a command with spinner; show ✅ or ❌ on completion
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

# Silent check: is a command available?
installed() { command -v "$1" &>/dev/null; }

# ── Header ────────────────────────────────────────────────────────────────────
clear
printf "${BOLD}${CYAN}"
cat << 'EOF'
  ╔══════════════════════════════════════════╗
  ║     Workshop Setup — macOS               ║
  ╚══════════════════════════════════════════╝
EOF
printf "${NC}\n"

TOTAL=8

# ── 1. Homebrew ───────────────────────────────────────────────────────────────
section 1 $TOTAL "Package manager (Homebrew)"
if installed brew; then
  run_step "brew update & upgrade" brew upgrade --quiet
else
  run_step "Install Homebrew" bash -c \
    '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  if [[ -f /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> "$HOME/.zprofile"
  fi
fi

# ── 2. Base tools ─────────────────────────────────────────────────────────────
section 2 $TOTAL "Base tools"
for pkg in curl git gh; do
  if installed "$pkg"; then
    printf "${GREEN}✅${NC}  $pkg ${DIM}(already installed)${NC}\n"
  else
    run_step "Install $pkg" brew install "$pkg"
  fi
done

# ── 3. Runtime: bun ───────────────────────────────────────────────────────────
section 3 $TOTAL "Runtime: bun"
if installed bun; then
  printf "${GREEN}✅${NC}  bun ${DIM}$(bun --version) (already installed)${NC}\n"
else
  run_step "Install bun" bash -c 'curl -fsSL https://bun.sh/install | bash'
  export PATH="$HOME/.bun/bin:$PATH"
  for rc in "$HOME/.zshrc" "$HOME/.bashrc"; do
    [[ -f "$rc" ]] && grep -q 'bun' "$rc" || true \
      || echo 'export PATH="$HOME/.bun/bin:$PATH"' >> "$rc"
  done
fi

# ── 4. Runtime: python3 ───────────────────────────────────────────────────────
section 4 $TOTAL "Runtime: python3"
if installed python3; then
  printf "${GREEN}✅${NC}  python3 ${DIM}$(python3 --version) (already installed)${NC}\n"
else
  run_step "Install python3" brew install python3
fi

# ── 5. Runtime: uv ───────────────────────────────────────────────────────────
section 5 $TOTAL "Runtime: uv"
if installed uv; then
  printf "${GREEN}✅${NC}  uv ${DIM}$(uv --version) (already installed)${NC}\n"
else
  run_step "Install uv" brew install uv
fi

# ── 6. CLI tools ─────────────────────────────────────────────────────────────
section 6 $TOTAL "CLI tools"
if installed claude; then
  printf "${GREEN}✅${NC}  claude ${DIM}(already installed)${NC}\n"
else
  run_step "Install Claude Code CLI" bun install -g @anthropic-ai/claude-code \
    || run_step "Install Claude Code CLI (npm fallback)" npm install -g @anthropic-ai/claude-code
fi

if installed agy; then
  printf "${GREEN}✅${NC}  agy ${DIM}(Antigravity CLI, already installed)${NC}\n"
else
  run_step "Install Antigravity CLI" bash -c \
    'curl -fsSL https://antigravity.google/cli/install.sh | bash'
fi

# ── 7. Desktop apps ───────────────────────────────────────────────────────────
section 7 $TOTAL "Desktop apps"
if [[ -d "/Applications/Google Chrome.app" ]]; then
  printf "${GREEN}✅${NC}  Google Chrome ${DIM}(already installed)${NC}\n"
else
  run_step "Install Google Chrome" brew install --cask google-chrome
fi

if [[ -d "/Applications/Claude.app" ]]; then
  printf "${GREEN}✅${NC}  Claude Desktop ${DIM}(already installed)${NC}\n"
else
  run_step "Install Claude Desktop App" brew install --cask claude
fi

if [[ -d "/Applications/Antigravity.app" ]]; then
  printf "${GREEN}✅${NC}  Antigravity Desktop ${DIM}(already installed)${NC}\n"
else
  printf "${YELLOW}⚠️ ${NC}  Antigravity Desktop — install manually: ${CYAN}https://antigravity.google${NC}\n"
fi

if [[ -d "/Applications/Mark.app" ]] || ls /Applications/Mark*.app &>/dev/null 2>&1 || true; then
  printf "${GREEN}✅${NC}  Mark (Markdown viewer) ${DIM}(already installed)${NC}\n"
else
  printf "${YELLOW}⚠️ ${NC}  Mark (Markdown viewer) — install manually: ${CYAN}https://playloom.app/mark${NC}\n"
fi

if [[ " $* " == *" --wezterm "* ]] || [[ "${1:-}" == "--wezterm" ]]; then
  if [[ -d "/Applications/WezTerm.app" ]]; then
    printf "${GREEN}✅${NC}  WezTerm ${DIM}(already installed)${NC}\n"
  else
    run_step "Install WezTerm" brew install --cask wezterm
  fi
fi

if [[ " $* " == *" --docker "* ]]; then
  if installed docker; then
    printf "${GREEN}✅${NC}  Docker ${DIM}$(docker --version) (already installed)${NC}\n"
  else
    run_step "Install Docker Desktop" brew install --cask docker
    printf "${YELLOW}⚠️ ${NC}  Launch Docker Desktop once to complete setup.\n"
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
