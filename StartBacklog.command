#!/bin/bash
# ==============================================================================
# StartBacklog.command
# Double-clickable macOS launcher for the Local Kanban Backlog Manager
# ==============================================================================

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Source user shell environment to resolve node, nvm, homebrew, etc.
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
[ -s "$HOME/.nvm/nvm.sh" ] && source "$HOME/.nvm/nvm.sh" > /dev/null 2>&1
[ -f "$HOME/.zshrc" ] && source "$HOME/.zshrc" > /dev/null 2>&1

if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not found in your PATH."
    echo "Please ensure Node.js is installed."
    echo ""
    read -n 1 -s -r -p "Press any key to close..."
    exit 1
fi

# Locate server.cjs
if [ -f "private/backlog-manager/server.cjs" ]; then
    SERVER_DIR="private/backlog-manager"
elif [ -f "server.cjs" ]; then
    SERVER_DIR="."
else
    echo "❌ Error: server.cjs not found in private/backlog-manager/ or current directory."
    read -n 1 -s -r -p "Press any key to close..."
    exit 1
fi

echo "=========================================================="
echo "    🗂  Starting Local Kanban Backlog Manager..."
echo "=========================================================="
echo "💡 Press Ctrl+C in this terminal window to stop the server."
echo ""

# Auto-open browser if server doesn't do it itself
(
  sleep 1.2
  # Read port from server output or fallback to 3030
  open "http://localhost:3030" 2>/dev/null || true
) &

(cd "$SERVER_DIR" && node server.cjs)
