import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = readPort('PREVIEW_PORT', 4173);
const storyPort = readPort('STORYBOOK_PORT', 6007);
const children = new Set();
let stopping = false;
let shutdownPromise;

function readPort(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > 65535) throw new Error(`${name} must be an integer from 1 to 65535`);
  return value;
}
function assertFree(port) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => server.close(resolve));
  });
}
function start(name, executable, args, env) {
  const child = spawn(process.execPath, [resolve(root, executable), ...args], {
    cwd: root, env: { ...process.env, ...env }, stdio: 'inherit', detached: process.platform !== 'win32',
  });
  children.add(child);
  child.once('error', error => { console.error(`${name}: ${error.message}`); void shutdown(1); });
  child.once('exit', (code, signal) => {
    if (!stopping) {
      console.error(`${name} exited (${signal ?? code}); stopping the complete preview.`);
      void shutdown(code || 1);
    }
  });
  return child;
}
function signal(child, name) {
  try {
    if (process.platform === 'win32') child.kill(name);
    else process.kill(-child.pid, name);
  } catch (error) { if (error.code !== 'ESRCH') console.error(error.message); }
}
function shutdown(code) {
  if (shutdownPromise) return shutdownPromise;
  stopping = true;
  shutdownPromise = (async () => {
    for (const child of children) signal(child, 'SIGTERM');
    const exited = Promise.all([...children].map(child => child.exitCode !== null || child.signalCode !== null
      ? Promise.resolve() : new Promise(resolve => child.once('exit', resolve))));
    let timer;
    await Promise.race([exited, new Promise(resolve => { timer = setTimeout(resolve, 2500); })]);
    clearTimeout(timer);
    // Kill remaining descendants too, even when their immediate parent already exited.
    for (const child of children) signal(child, 'SIGKILL');
    process.exitCode = code;
  })();
  return shutdownPromise;
}
async function ready(url) {
  const end = Date.now() + 120000;
  while (!stopping && Date.now() < end) {
    try { if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return; } catch { /* Still starting. */ }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  if (!stopping) throw new Error(`Preview startup timed out: ${url}`);
}
process.once('SIGINT', () => void shutdown(0));
process.once('SIGTERM', () => void shutdown(0));
try {
  if (port === storyPort) throw new Error('PREVIEW_PORT and STORYBOOK_PORT must differ');
  await Promise.all([assertFree(port), assertFree(storyPort)]);
  const common = { PREVIEW_PORT: String(port), STORYBOOK_PORT: String(storyPort) };
  start('Storybook', 'node_modules/storybook/dist/bin/dispatcher.js', [
    'dev', '--host', '127.0.0.1', '--port', String(storyPort), '--exact-port', '--ci', '--no-open', '--no-version-updates', '--disable-telemetry',
  ], { ...common, UNIFIED_STORYBOOK: '1' });
  await ready(`http://127.0.0.1:${storyPort}/index.json`);
  if (!stopping) {
    start('Vite', 'node_modules/vite/bin/vite.js', ['--host', '127.0.0.1', '--port', String(port), '--strictPort'], { ...common, UNIFIED_PREVIEW: '1' });
    await ready(`http://127.0.0.1:${port}/`);
    if (!stopping) console.log(`\nPreview${process.env.PREVIEW_LABEL ? ` [${process.env.PREVIEW_LABEL}]` : ''}: http://127.0.0.1:${port}/\nStorybook: http://127.0.0.1:${port}/storybook/\n`);
  }
} catch (error) {
  console.error(`Preview failed: ${error.message}`);
  await shutdown(1);
}
