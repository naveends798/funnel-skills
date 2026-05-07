#!/usr/bin/env bash
# funnel-skills — clean uninstall
# Removes the symlinks from ~/.claude/skills and ~/.claude/commands.
# By default LEAVES ~/.funnel-skills/ alone so your generated client output is preserved.
# Pass --purge to delete everything.

set -euo pipefail

PURGE=0
for arg in "$@"; do
  case "$arg" in
    --purge) PURGE=1 ;;
  esac
done

FS_HOME="${FUNNEL_SKILLS_HOME:-$HOME/.funnel-skills}"
CLAUDE_HOME="$HOME/.claude"

echo "→ removing skill symlinks from $CLAUDE_HOME/skills/"
for entry in "$CLAUDE_HOME/skills"/*; do
  [ -L "$entry" ] || continue
  target=$(readlink "$entry" 2>/dev/null || true)
  case "$target" in
    "$FS_HOME"/.claude/skills/*) rm "$entry"; echo "  - $(basename "$entry")" ;;
  esac
done

echo "→ removing command symlinks from $CLAUDE_HOME/commands/"
for entry in "$CLAUDE_HOME/commands"/*; do
  [ -L "$entry" ] || continue
  target=$(readlink "$entry" 2>/dev/null || true)
  case "$target" in
    "$FS_HOME"/.claude/commands/*) rm "$entry"; echo "  - $(basename "$entry")" ;;
  esac
done

if [ "$PURGE" = "1" ]; then
  echo "→ purging $FS_HOME (this deletes your client output too)"
  rm -rf "$FS_HOME"
else
  echo "→ left $FS_HOME in place (your /output is preserved). Run with --purge to delete it."
fi

echo "✓ uninstalled. Remove FUNNEL_SKILLS_HOME from your shell profile manually if you want it fully gone."
