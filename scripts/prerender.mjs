// Pre-renders the site into dist/index.html, so the page is there before any JavaScript runs: for visitors (it paints
// at once and `#section` links land natively), for crawlers and link previews, and for anyone without JavaScript.
// `npm run build` builds the client into dist/ first, then the server entry (src/site/entry-server.tsx) with
// `vite build --ssr` into node_modules/.cache/prerender/, whose asset URLs are the client build's (see vite.config.mts).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const projectRoot = resolve(import.meta.dirname, '..');
const page = resolve(projectRoot, 'dist', 'index.html');
const { render } = await import(pathToFileURL(resolve(projectRoot, 'node_modules', '.cache', 'prerender', 'entry-server.mjs')).href);

const ROOT = '<div id="root"></div>';
const html = readFileSync(page, 'utf8');
if (html.split(ROOT).length !== 2) throw new Error(`prerender: expected exactly one empty ${ROOT} in ${page}`);

const app = render();
if (!app) throw new Error('prerender: the site rendered nothing');

// Every built file the HTML links must be one the client build wrote, or the page would point at nothing.
const assets = new Set([...app.matchAll(/\.\/(assets\/[^"'\s)?#,]+)/g)].map(([, path]) => path));
const missing = [...assets].filter(path => !existsSync(resolve(projectRoot, 'dist', decodeURIComponent(path))));
if (missing.length) throw new Error(`prerender: the rendered page links files the client build did not write:\n  ${missing.join('\n  ')}`);

writeFileSync(page, html.replace(ROOT, () => `<div id="root">${app}</div>`));
console.log(`prerender: wrote ${app.length} characters of HTML into dist/index.html, linking ${assets.size} built files`);
