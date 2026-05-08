// Launch the dashboard for a built client funnel.
//
// What this fixes:
//   - Opening dashboard/index.html via file:// makes Chrome silently block
//     scripts (and silently block iframe loads from sibling folders).
//   - Iframe src `../08-design/landing.html` only works if the HTTP server
//     is rooted at output/<slug>/ — not at output/<slug>/dashboard/.
//
// What this does:
//   1. Picks a free port starting at 8765.
//   2. Starts `python3 -m http.server <port> --bind 127.0.0.1` rooted at
//      output/<slug>/, in the background, log to /tmp.
//   3. Opens http://127.0.0.1:<port>/ — index.html redirects to dashboard/.
//   4. Prints a kill instruction so the user can stop it later.
//
// usage: node launch-dashboard.mjs <slug> [port]

import { existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { createServer } from 'node:net';

const ROOT = process.cwd();
const slug = process.argv[2];
const startPort = parseInt(process.argv[3] || '8765', 10);

if (!slug) {
  console.error('usage: node launch-dashboard.mjs <slug> [port]');
  process.exit(1);
}

const clientDir = join(ROOT, 'output', slug);
if (!existsSync(clientDir)) {
  console.error(`No client folder: ${clientDir}`);
  process.exit(1);
}
if (!existsSync(join(clientDir, 'dashboard', 'index.html'))) {
  console.error(`Dashboard not built yet for ${slug}. Run render-dashboard.mjs first.`);
  process.exit(1);
}

async function findFreePort(start) {
  for (let p = start; p < start + 50; p++) {
    if (await portFree(p)) return p;
  }
  return start; // give up — caller will see the error
}

function portFree(p) {
  return new Promise((resolve) => {
    const s = createServer();
    s.once('error', () => resolve(false));
    s.once('listening', () => s.close(() => resolve(true)));
    s.listen(p, '127.0.0.1');
  });
}

const port = await findFreePort(startPort);
const url = `http://127.0.0.1:${port}/`;
const logPath = `/tmp/funnel-dashboard-${slug}.log`;

// Pick a python interpreter — prefer python3, fall back to python.
const py = whichOne(['python3', 'python']);
if (!py) {
  console.error('! no python3/python on PATH. Install Python or open dashboard/index.html manually after starting any HTTP server rooted at output/' + slug + '/.');
  process.exit(2);
}

const child = spawn(py, ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
  cwd: clientDir,
  detached: true,
  stdio: ['ignore', 'ignore', 'ignore'],
});
child.unref();

// Tiny readiness wait — http.server binds within ~50ms.
await new Promise((r) => setTimeout(r, 350));

// Open browser (macOS `open`, Linux `xdg-open`, Windows `start`).
const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
const args = process.platform === 'win32' ? ['/c', 'start', url] : [url];
spawn(opener, args, { stdio: 'ignore', detached: true }).unref();

console.log(`✓ dashboard running at ${url}`);
console.log(`  pid: ${child.pid}  ·  log: ${logPath}`);
console.log(`  stop:  lsof -ti:${port} | xargs kill   (or: kill ${child.pid})`);

function whichOne(candidates) {
  for (const c of candidates) {
    const r = spawnSync(c, ['--version'], { stdio: 'ignore' });
    if (r.status === 0) return c;
  }
  return null;
}
