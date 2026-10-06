// The last step of `npm run build`: makes sure every file the built site points at is in dist/, and publishes nothing
// else from assets/.
//
// Vite already writes, hashed, every file the site imports or its CSS links (fonts, images, the live set), and
// public/ brings the icons, share image, manifest, 404 page and redirect stubs. A file the site names only by a fixed
// `assets/...` URL (in a string Vite can't see) is not bundled: this copies exactly those from assets/ into
// dist/assets/, so unused art, audio and the unhashed originals of bundled files are never published.
//
// It then checks the build: every local URL in the built pages (src, href, srcset, og:image and the like), their
// stylesheets (url()), the scripts (`assets/...`) and the web app manifest must be a file in dist/. A missing one
// fails the build, naming it.
const { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } = require('node:fs');
const { dirname, extname, join, posix, resolve, sep } = require('node:path');

const projectRoot = resolve(__dirname, '..');
const dist = resolve(projectRoot, 'dist');
const assets = resolve(projectRoot, 'assets');

/** The site's own origin, as index.html's canonical link and og: tags write it. */
const SITE_ORIGIN = 'https://funkadelicastronaut.com';

/** Every file under `dir`, as paths relative to it with forward slashes. */
const filesIn = dir =>
  readdirSync(dir, { recursive: true })
    .map(String)
    .filter(file => statSync(join(dir, file)).isFile())
    .map(file => file.split(sep).join('/'));

/**
 * The local URLs a built file refers to, each as [referring file, URL]. Pages: src, href, poster, content (only the
 * site's own absolute URLs), srcset and imagesrcset; stylesheets: url(); scripts: string literals naming `assets/...`;
 * the manifest: its icons' src.
 */
function referencesIn(file, text) {
  const urls = [];
  const type = extname(file);
  if (type === '.html') {
    for (const [, url] of text.matchAll(/\s(?:src|href|poster)="([^"]+)"/g)) urls.push(url);
    // A meta tag's content is text unless it is one of the site's own URLs (og:image, og:url).
    for (const [, url] of text.matchAll(/\scontent="([^"]+)"/g)) if (url.startsWith(`${SITE_ORIGIN}/`)) urls.push(url);
    for (const [, set] of text.matchAll(/\s(?:srcset|imagesrcset)="([^"]+)"/g)) {
      for (const candidate of set.split(',')) urls.push(candidate.trim().split(/\s+/)[0]);
    }
  }
  if (type === '.html' || type === '.css') {
    for (const [, url] of text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) urls.push(url);
  }
  if (type === '.js') {
    for (const [, url] of text.matchAll(/["'`]((?:\.{0,2}\/)?assets\/[^"'`\s?#]+)["'`]/g)) urls.push(url);
  }
  if (type === '.webmanifest') {
    for (const icon of JSON.parse(text).icons ?? []) urls.push(icon.src);
  }
  return urls.map(url => [file, url]);
}

/**
 * Where `url`, referred to from `file` (a path in dist/), points inside dist/, or undefined when it is not one of
 * the site's own files: another origin, a data: or mailto: URL, a fragment, or not a URL at all (a meta tag's text).
 * Scripts resolve against the page, which is at dist/'s root.
 */
function localPath(file, url) {
  if (/^(data:|mailto:|tel:|javascript:|#|\{|\/\/)/.test(url)) return undefined;
  let path;
  if (url.startsWith(`${SITE_ORIGIN}/`)) path = url.slice(SITE_ORIGIN.length);
  else if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return undefined;
  else if (!/^[./\w-]/.test(url) || /\s/.test(url)) return undefined;
  else path = url;
  path = decodeURIComponent(path.split(/[?#]/)[0]);
  const base = extname(file) === '.js' || extname(file) === '.webmanifest' ? '' : posix.dirname(file);
  const resolved = path.startsWith('/') ? path.slice(1) : posix.normalize(posix.join(base, path));
  return resolved === '' || resolved.endsWith('/') ? `${resolved}index.html` : resolved;
}

const builtText = filesIn(dist).filter(file => ['.html', '.css', '.js', '.webmanifest'].includes(extname(file)));
const references = builtText.flatMap(file => referencesIn(file, readFileSync(join(dist, file), 'utf8')));

const copied = new Set();
const missing = [];
for (const [file, url] of references) {
  const path = localPath(file, url);
  if (!path || existsSync(join(dist, path))) continue;
  // A fixed `assets/...` URL: publish that one file from assets/.
  const source = path.startsWith('assets/') ? join(assets, path.slice('assets/'.length)) : undefined;
  if (source && existsSync(source) && statSync(source).isFile()) {
    mkdirSync(dirname(join(dist, path)), { recursive: true });
    copyFileSync(source, join(dist, path));
    copied.add(path);
  } else {
    missing.push(`${url} (in dist/${file})`);
  }
}

if (missing.length) {
  throw new Error(`copy-static-build: the built site refers to files that are not in dist/ or assets/:\n  ${missing.join('\n  ')}`);
}

const checked = new Set(references.map(([file, url]) => localPath(file, url)).filter(Boolean));
console.log(
  `copy-static-build: ${checked.size} local files referenced by the built site, all present; ` +
    `copied ${copied.size} fixed-URL file${copied.size === 1 ? '' : 's'} from assets/${copied.size ? `: ${[...copied].join(', ')}` : ''}`,
);
