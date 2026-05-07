#!/usr/bin/env bash
# funnel-skills — friendly installer for non-technical users
#
# Run via:
#   curl -fsSL https://raw.githubusercontent.com/naveends798/funnel-skills/main/install.sh | bash
# Or by double-clicking install.command on macOS.

set -euo pipefail

# --- Pretty output ---
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[0;33m'
CYAN=$'\033[0;36m'
PURPLE=$'\033[0;35m'
BOLD=$'\033[1m'
DIM=$'\033[2m'
NC=$'\033[0m'

step() { printf "\n${BOLD}${PURPLE}→${NC} ${BOLD}%s${NC}\n" "$1"; }
ok()   { printf "  ${GREEN}✓${NC} %s\n" "$1"; }
warn() { printf "  ${YELLOW}!${NC} %s\n" "$1"; }
err()  { printf "  ${RED}✗${NC} %s\n" "$1"; }
info() { printf "    ${DIM}%s${NC}\n" "$1"; }

# --- Banner ---
clear 2>/dev/null || true
cat <<BANNER

  ${BOLD}${CYAN}funnel-skills${NC}
  ${DIM}Ten Claude Skills for end-to-end funnel buildouts${NC}

BANNER

REPO_URL="${FUNNEL_SKILLS_REPO:-https://github.com/naveends798/funnel-skills.git}"
FS_HOME="${FUNNEL_SKILLS_HOME:-$HOME/.funnel-skills}"
CLAUDE_HOME="$HOME/.claude"

# --- Pre-flight: Node ---
step "Checking prerequisites"

if ! command -v node >/dev/null 2>&1; then
  err "Node.js is not installed."
  echo ""
  echo "  ${BOLD}Node.js is the engine that runs funnel-skills under the hood.${NC}"
  echo "  It's free, takes 2 minutes to install, and you'll never need to think about it again."
  echo ""
  if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "  ${CYAN}Easiest install on macOS:${NC}"
    echo "    1. Open this link in your browser: ${BOLD}https://nodejs.org/en/download${NC}"
    echo "    2. Click ${BOLD}macOS Installer${NC} — get the LTS (recommended) version"
    echo "    3. Double-click the .pkg file, click Continue → Install"
    echo "    4. Re-run this installer when done"
    echo ""
    if command -v open >/dev/null 2>&1; then
      printf "  Open the download page now? [Y/n] "
      read -r ans
      if [[ "$ans" != "n" && "$ans" != "N" ]]; then
        open "https://nodejs.org/en/download"
        echo "  ${DIM}Browser opened. Install Node, then re-run this installer.${NC}"
      fi
    fi
  else
    echo "  ${CYAN}Install Node.js 20+ from:${NC} https://nodejs.org/"
  fi
  exit 1
fi

NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt 20 ]; then
  err "Node $(node -v) detected. funnel-skills needs Node 20 or newer."
  echo ""
  echo "  Update Node via https://nodejs.org/ → download the LTS version."
  exit 1
fi
ok "Node $(node -v)"

# --- Pre-flight: git ---
if ! command -v git >/dev/null 2>&1; then
  err "git is not installed."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "  ${CYAN}On macOS:${NC} run ${BOLD}xcode-select --install${NC} (a popup appears, click Install)"
  fi
  exit 1
fi
ok "git $(git --version | awk '{print $3}')"

# --- Pre-flight: Claude Code ---
if [ -d "$CLAUDE_HOME" ]; then
  ok "Claude Code config detected at $CLAUDE_HOME"
else
  warn "Claude Code config folder not found at $CLAUDE_HOME"
  info "If you don't have Claude Code yet, install it from https://claude.com/claude-code"
  info "I'll create the folder anyway so the install completes."
  mkdir -p "$CLAUDE_HOME"
fi

# --- Step 1: Clone or update ---
step "Installing funnel-skills to $FS_HOME"

if [ -d "$FS_HOME/.git" ]; then
  info "already installed — updating to latest"
  git -C "$FS_HOME" pull --ff-only --quiet
else
  info "downloading from GitHub..."
  git clone --depth 1 --quiet "$REPO_URL" "$FS_HOME"
fi
ok "code at $FS_HOME"

# --- Step 2: Dependencies ---
step "Installing helper packages"
info "this takes 30-60 seconds the first time"
(cd "$FS_HOME" && npm install --silent --no-fund --no-audit 2>&1 | tail -3 || true)
ok "dependencies ready"

# --- Step 3: Wire into Claude Code (symlinks) ---
step "Connecting to Claude Code"

mkdir -p "$CLAUDE_HOME/skills" "$CLAUDE_HOME/commands"

link_dir() {
  local src="$1"
  local dst="$2"
  for entry in "$src"/*; do
    [ -e "$entry" ] || continue
    local name=$(basename "$entry")
    local target="$dst/$name"
    if [ -L "$target" ]; then
      rm "$target"
    elif [ -e "$target" ]; then
      mv "$target" "$target.bak.$(date +%s)"
      info "backed up existing $name → $name.bak.*"
    fi
    ln -s "$entry" "$target"
  done
}

link_dir "$FS_HOME/.claude/skills" "$CLAUDE_HOME/skills"
ok "10 skills linked into Claude Code"
link_dir "$FS_HOME/.claude/commands" "$CLAUDE_HOME/commands"
ok "slash commands linked: /funnel-intake, /audit, /funnel-help, /funnel-list"

# --- Step 4: Shell profile ---
step "Setting up environment"

PROFILE=""
case "$SHELL" in
  */zsh)  PROFILE="$HOME/.zshrc" ;;
  */bash) PROFILE="$HOME/.bashrc"; [ -f "$HOME/.bash_profile" ] && PROFILE="$HOME/.bash_profile" ;;
esac

if [ -n "$PROFILE" ] && [ -w "$PROFILE" ]; then
  if ! grep -q "FUNNEL_SKILLS_HOME" "$PROFILE" 2>/dev/null; then
    {
      echo ""
      echo "# funnel-skills"
      echo "export FUNNEL_SKILLS_HOME=\"$FS_HOME\""
    } >> "$PROFILE"
    ok "added FUNNEL_SKILLS_HOME to $PROFILE"
  else
    ok "FUNNEL_SKILLS_HOME already in $PROFILE"
  fi
fi
export FUNNEL_SKILLS_HOME="$FS_HOME"

# --- Step 5: Done ---
cat <<DONE

${BOLD}${GREEN}══════════════════════════════════════════════════════${NC}
${BOLD}${GREEN}  ✓ funnel-skills is installed.${NC}
${BOLD}${GREEN}══════════════════════════════════════════════════════${NC}

${BOLD}Two things to remember:${NC}

  ${CYAN}${BOLD}/funnel-intake${NC}    ${DIM}— build a complete client funnel${NC}
  ${CYAN}${BOLD}/audit <name>${NC}     ${DIM}— audit a live funnel with real metrics${NC}

${BOLD}How to start:${NC}

  1. Open ${BOLD}Claude Code${NC} (any folder works)
  2. Type ${CYAN}/funnel-intake${NC} and hit enter
  3. Paste anything you have about the client (URL, notes, PDF path)
  4. Watch the dashboard open with everything built

${BOLD}Need help inside Claude Code?${NC} Type ${CYAN}/funnel-help${NC}.

${DIM}Output goes to ./output/<client>/ wherever you run /funnel-intake from.${NC}
${DIM}Optional API keys (deeper research): edit $FS_HOME/.env${NC}

DONE

# Try to open the welcome page
WELCOME="$FS_HOME/welcome.html"
if [ -f "$WELCOME" ]; then
  if command -v open >/dev/null 2>&1; then
    open "$WELCOME"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$WELCOME" 2>/dev/null || true
  fi
fi
