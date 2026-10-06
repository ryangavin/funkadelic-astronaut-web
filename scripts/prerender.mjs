// Pre-renders the site into dist/index.html, so the page is there before any JavaScript runs: for visitors (it paints
// at once and `#section` links land natively), for crawlers and link previews, and for anyone without JavaScript.
// `npm run build` builds the client into dist/ first, then the server entry (src/site/entry-server.tsx) with
// `vite build --ssr` into node_modules/.cache/prerender/, whose asset URLs are the client build's (see vite.config.mts).
import { readFileSync, writeFileSync } from 'node:fs';
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
writeFileSync(page, html.replace(ROOT, () => `<div id="root">${app}</div>`));
console.log(`prerender: wrote ${app.length} characters of HTML into dist/index.html`);
