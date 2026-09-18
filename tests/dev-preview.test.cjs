const assert = require('node:assert/strict');
const { test } = require('node:test');
const { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { createServer } = require('node:net');

async function freePort() {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
async function fixture(extra = {}) {
  const root = mkdtempSync(join(tmpdir(), 'unified-preview-test-'));
  mkdirSync(join(root, 'scripts'));
  copyFileSync(join(__dirname, '../scripts/dev.mjs'), join(root, 'scripts/dev.mjs'));
  const fixtureChild = `
    const fs = require('node:fs');
    const http = require('node:http');
    const story = !!process.env.UNIFIED_STORYBOOK;
    fs.appendFileSync(process.env.PIDS_FILE, process.pid + '\\n');
    if (!story && process.env.FAIL_VITE) process.exit(7);
    http.createServer((req, res) => res.end('{}')).listen(Number(story ? process.env.STORYBOOK_PORT : process.env.PREVIEW_PORT), '127.0.0.1');
  `;
  for (const file of ['node_modules/storybook/dist/bin/dispatcher.js', 'node_modules/vite/bin/vite.js']) {
    mkdirSync(join(root, file, '..'), { recursive: true });
    writeFileSync(join(root, file), fixtureChild);
  }
  const port = await freePort(), storyPort = await freePort();
  const child = spawn(process.execPath, ['scripts/dev.mjs'], { cwd: root, env: { ...process.env, PREVIEW_PORT: String(port), STORYBOOK_PORT: String(storyPort), PIDS_FILE: join(root, 'pids'), ...extra }, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', data => output += data);
  child.stderr.on('data', data => output += data);
  const exit = once(child, 'exit');
  return { root, child, exit, port, storyPort, output: () => output, async cleanup() {
    if (child.exitCode === null) { child.kill('SIGTERM'); await exit; }
    rmSync(root, { recursive: true, force: true });
  } };
}
async function waitFor(check) {
  const end = Date.now() + 10000;
  while (!check()) {
    if (Date.now() > end) throw new Error('Timed out waiting for launcher');
    await new Promise(resolve => setTimeout(resolve, 20));
  }
}
function assertChildrenGone(root) {
  for (const pid of readFileSync(join(root, 'pids'), 'utf8').trim().split('\n').map(Number)) {
    assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' });
  }
}
test('unified preview stops both children on Ctrl-C', { timeout: 15000 }, async () => {
  const f = await fixture();
  try {
    await waitFor(() => f.output().includes('Storybook: http'));
    f.child.kill('SIGINT');
    assert.equal((await f.exit)[0], 0);
    assertChildrenGone(f.root);
  } finally { await f.cleanup(); }
});
test('a child startup failure stops its sibling and preserves a failing exit code', { timeout: 15000 }, async () => {
  const f = await fixture({ FAIL_VITE: '1' });
  try {
    assert.equal((await f.exit)[0], 7);
    assertChildrenGone(f.root);
  } finally { await f.cleanup(); }
});
test('an occupied public port fails without starting children or moving the preview', { timeout: 15000 }, async () => {
  const busy = createServer();
  await new Promise(resolve => busy.listen(0, '127.0.0.1', resolve));
  const f = await fixture({ PREVIEW_PORT: String(busy.address().port) });
  try {
    assert.equal((await f.exit)[0], 1);
    assert.match(f.output(), /EADDRINUSE/);
    assert.throws(() => readFileSync(join(f.root, 'pids')), { code: 'ENOENT' });
  } finally {
    await f.cleanup();
    await new Promise(resolve => busy.close(resolve));
  }
});
