#!/usr/bin/env bash
# Statischer PoC-Server (OAuth braucht http(s), kein file://)
set -euo pipefail
cd "$(dirname "$0")"
PORT="${PORT:-8765}"
HOST="${HOST:-127.0.0.1}"
echo "Open: http://${HOST}:${PORT}/"
echo "Press Ctrl+C to stop."
exec python3 -m http.server "$PORT" --bind "$HOST"
