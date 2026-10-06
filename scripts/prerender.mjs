// Pre-renders the site into dist/index.html, so the page is there before any JavaScript runs: for visitors (it paints
// at once and `#section` links land natively), for crawlers and link previews, and for anyone without JavaScript.
// `npm run build` builds the client into dist/ first, then the server entry (src/site/entry-server.tsx) with
// `vite build --ssr` into node_modules/.cache/prerender/, whose asset URLs are the client build's (see vite.config.mts).
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const projectRoot = resolve(import.meta.dirname, '..');
const page = resolve(projectRoot, 'dist', 'index.html');
const { render } = await import(pathToFileURL(resolve(projectRoot, 'node_modules', '.cache', 'prerender', 'entry-server.mjs')).href);

const ROOT = '<div id="root"></div>';
const html = readFileSync(page, 'utf8');
if (html.split(ROOT).length !== 2) throw new Error(`prerender: expected exactly one empty ${ROOT} in ${page}`);

const rendered = render();
if (!rendered) throw new Error('prerender: the site rendered nothing');

// React writes the `<link rel="preload">` tags the site asks for with `preload()` (src/site/Preloads.tsx) at the start
// of its output; they belong in the head, ahead of the stylesheet, so the browser asks for them first. (The client
// doesn't ask again: Preloads renders nothing in the browser.)
const [, preloads = '', app] = rendered.match(/^((?:<link rel="preload"[^>]*\/>)*)([\s\S]*)$/);

// Every built file the HTML links must be one the client build wrote, or the page would point at nothing.
const assets = new Set([...rendered.matchAll(/\.\/(assets\/[^"'\s)?#,]+)/g)].map(([, path]) => path));
const missing = [...assets].filter(path => !existsSync(resolve(projectRoot, 'dist', decodeURIComponent(path))));
if (missing.length) throw new Error(`prerender: the rendered page links files the client build did not write:\n  ${missing.join('\n  ')}`);

// Vite puts the stylesheet and script tags at the end of the head; the preloads go before the first of them.
const headAssets = html.search(/<(?:script type="module"|link rel="stylesheet"|link rel="modulepreload")/);
if (headAssets < 0 || headAssets > html.indexOf('</head>')) throw new Error(`prerender: no built script or stylesheet in the head of ${page}`);
let built = html.slice(0, headAssets) + preloads + html.slice(headAssets);

// The stylesheet (about 5 kB compressed) goes inline, so the first paint waits on no request after the page itself.
// Its url()s are relative to dist/assets/, where the file was; inline they resolve against the page, one level up.
// The file is then removed: nothing else links it.
const stylesheets = [...built.matchAll(/<link rel="stylesheet"[^>]*href="\.\/(assets\/[^"]+\.css)"[^>]*>/g)];
for (const [tag, path] of stylesheets) {
  const file = resolve(projectRoot, 'dist', path);
  const css = readFileSync(file, 'utf8').replace(/url\((['"]?)\.\//g, 'url($1./assets/');
  if (/<\/style/i.test(css)) throw new Error(`prerender: ${path} would close its inline <style>`);
  built = built.replace(tag, () => `<style>${css}</style>`);
  rmSync(file);
}

// The page is already written, so the script that hydrates it need not compete with the fonts and first-screen images:
// it is fetched at low priority (it still runs as soon as it arrives and the document is parsed).
const scripts = built.match(/<script type="module" crossorigin src="[^"]+">/g) ?? [];
if (scripts.length !== 1) throw new Error(`prerender: expected one module script in the head, found ${scripts.length}`);
built = built.replace(scripts[0], tag => tag.replace('<script ', '<script fetchpriority="low" '));

writeFileSync(page, built.replace(ROOT, () => `<div id="root">${app}</div>`));
const preloadCount = preloads.split('<link').length - 1;
console.log(
  `prerender: wrote ${app.length} characters of HTML into dist/index.html, linking ${assets.size} built files, ` +
    `with ${preloadCount} preloads in the head and ${stylesheets.length} stylesheet inlined`,
);
