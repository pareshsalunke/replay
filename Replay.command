#!/bin/bash
# Replay — double-click launcher for macOS.
# Builds the app and serves it locally, then opens your browser.

# .command files launch with the home directory as cwd — move to this script's folder.
cd "$(dirname "$0")" || exit 1

echo "─────────────────────────────────────"
echo "  Replay"
echo "─────────────────────────────────────"

pause_and_exit() {
  echo ""
  read -n 1 -s -r -p "Press any key to close…"
  exit 1
}

# 1. Require Node.js.
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed (or not on your PATH)."
  echo "Install Node 20+ from https://nodejs.org and run this again."
  pause_and_exit
fi
echo "Node $(node -v) · npm $(npm -v)"

# 2. First run — install dependencies.
if [ ! -d "node_modules" ]; then
  echo ""
  echo "First run — installing dependencies (this happens once)…"
  npm install || { echo "npm install failed."; pause_and_exit; }
fi

# 3. Build.
echo ""
echo "Building Replay…"
npm run build || { echo "Build failed."; pause_and_exit; }

# 4. Serve + open the browser.
echo ""
echo "Starting Replay at http://localhost:4173"
echo "Keep this window open while using the app. Close it to stop."
echo ""
npm run preview
