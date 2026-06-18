#!/usr/bin/env bash
# Serve the demos (and the presentation fonts they reference) from the repo root.
# Usage:  demos/serve.sh [port]      then open  http://localhost:<port>/demos/
# Safe to run repeatedly: if a server is already up it just prints the URL.
# Uses serve.py (no-redirect, clean-URL -> .html) so back-navigation and
# cached npx-serve 301s don't 404 the individual demo pages.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${1:-3336}"

url_ok(){ curl -s -o /dev/null --max-time 2 "http://localhost:$1/index.html"; }

port_free(){ python3 - "$1" <<'PY'
import socket, sys
s = socket.socket()
s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)   # match the server (allow_reuse_address)
try:
    s.bind(("", int(sys.argv[1]))); s.close(); sys.exit(0)   # free (TIME_WAIT does not count)
except OSError:
    sys.exit(1)                                              # in use
PY
}

# Already being served here? Just reuse it.
if url_ok "$PORT"; then
  echo "✓ Demos already served at  http://localhost:$PORT/"
  exit 0
fi

# Chosen port busy with something else? pick the next free one.
if ! port_free "$PORT"; then
  for p in 3337 3338 3339 3340 8080 8000; do
    if port_free "$p"; then PORT="$p"; break; fi
  done
fi

echo "Serving  $ROOT"
echo "→ Open   http://localhost:$PORT/"
echo "  (Ctrl-C to stop)"
cd "$ROOT" || { echo "could not cd to $ROOT"; exit 1; }
exec python3 "$ROOT/serve.py" "$PORT"
