#!/usr/bin/env bash
# Double-click this file on macOS to install funnel-skills.
# It just runs install.sh in your terminal — same as the curl|bash one-liner.

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

if [ -f "$DIR/install.sh" ]; then
  bash "$DIR/install.sh"
else
  # Fallback to remote install if install.sh is missing locally
  curl -fsSL https://raw.githubusercontent.com/naveends798/funnel-skills/main/install.sh | bash
fi

echo ""
echo "Press any key to close this window..."
read -n 1 -s
