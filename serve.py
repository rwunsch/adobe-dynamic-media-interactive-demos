#!/usr/bin/env python3
# Static server for the Dynamic Media demos with NO redirects.
# - Serves this script's own directory (the repo root) so index.html is at "/".
# - Maps extensionless clean URLs -> .html on the fly WITHOUT a 301.
# - Strips a leading "/demos/" so links that still use that prefix keep working.
# Usage:  python3 serve.py [port]      (default 3336)
import http.server, os, sys, functools
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3336
ROOT = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.path.split('?')[0].split('#')[0]
        if path.startswith('/demos/'):          # back-compat with /demos/* links
            path = path[len('/demos'):]
        fs = self.translate_path(path)
        if not path.endswith('/') and not os.path.exists(fs) and os.path.exists(fs + '.html'):
            path = path + '.html'
        self.path = path                        # query/fragment already irrelevant to translate_path
        return super().send_head()

# ThreadingHTTPServer: several demos may be embedded/opened at once — a
# single-threaded server would serialize and stall them.
class Server(http.server.ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True

print(f"Serving {ROOT}  ->  http://localhost:{PORT}/")
Server(('0.0.0.0', PORT), functools.partial(Handler, directory=ROOT)).serve_forever()
