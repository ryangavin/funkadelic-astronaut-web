// Makes the site's web fonts, cut down to the characters the site uses. Rerun it when the copy gains a character the
// fonts may not have (tests/font-subset.test.cjs fails when it does): `node scripts/subset-fonts.mjs` (needs fontTools'
// `pyftsubset` with brotli on the PATH: `pip install 'fonttools[woff]'`). The outputs are committed, so the build
// itself never needs fontTools.
//
// - Sources: the Google Fonts latin subsets in assets/fonts/ (`*-latin.woff2`), which are kept as they are.
// - Outputs: the same faces as `*-site.woff2` next to them, which src/site/styles/fonts.css loads. Every variation axis
//   keeps its full range, every OpenType layout feature and the hinting are kept, so text renders exactly as before.
// - The characters: printable ASCII; every character in the strings of src/content/locales/en.json and the string
//   literals of src/content/*.ts, with their upper- and lower-case forms (headlines are `text-transform: uppercase`);
//   and the typographic extras the copy and the browser use (no-break space, soft and hyphenation hyphens, which
//   `hyphens: auto` inserts, dashes, curly quotes, ellipsis, bullet, middle dot, ×, and the replacement character).
//   A character a source font doesn't have is simply left out; the fallback font draws it, as before.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const fonts = resolve(root, 'assets', 'fonts');
const content = resolve(root, 'src', 'content');

/** Every string value in a parsed JSON document. */
const jsonStrings = value =>
  typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value).flatMap(jsonStrings) : [];

/** The string literals ('…', "…", `…`) in TypeScript source, skipping comments. */
const tsStrings = source =>
  [...source.matchAll(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g)]
    .map(([token]) => token)
    .filter(token => !token.startsWith('/'))
    .map(token => token.slice(1, -1));

const text = [
  ...jsonStrings(JSON.parse(readFileSync(resolve(content, 'locales', 'en.json'), 'utf8'))),
  ...readdirSync(content)
    .filter(name => name.endsWith('.ts') && statSync(resolve(content, name)).isFile())
    .flatMap(name => tsStrings(readFileSync(resolve(content, name), 'utf8'))),
].join('');

const codePoints = new Set();
for (let code = 0x20; code <= 0x7e; code++) codePoints.add(code);
for (const char of new Set(text)) {
  for (const form of [char, char.toUpperCase(), char.toLowerCase()]) for (const c of form) codePoints.add(c.codePointAt(0));
}
// No-break space, soft hyphen, hyphen, non-breaking hyphen, en and em dashes, curly quotes, ellipsis, bullet, middle dot,
// multiplication sign, replacement character.
for (const char of ' ­‐‑–—‘’“”…•·×�') {
  codePoints.add(char.codePointAt(0));
}
for (const code of [...codePoints]) if (code < 0x20 || (code >= 0x7f && code < 0xa0)) codePoints.delete(code);
const unicodes = [...codePoints].sort((a, b) => a - b).map(code => code.toString(16).toUpperCase().padStart(4, '0'));

const FACES = [
  'archivo/Archivo',
  'archivo/Archivo-Italic',
  'bowlby-one/BowlbyOne',
  'newsreader/Newsreader',
  'newsreader/Newsreader-Italic',
];

for (const face of FACES) {
  const source = resolve(fonts, `${face}-latin.woff2`);
  const output = resolve(fonts, `${face}-site.woff2`);
  execFileSync('pyftsubset', [
    source,
    `--unicodes=${unicodes.join(',')}`,
    "--layout-features=*",
    '--flavor=woff2',
    `--output-file=${output}`,
  ], { stdio: 'inherit' });
  console.log(`${face}: ${statSync(source).size} → ${statSync(output).size} bytes`);
}
console.log(`${unicodes.length} characters`);
