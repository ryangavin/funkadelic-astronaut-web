const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const zlib = require('node:zlib');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

// The site's fonts are cut down to the characters its copy uses by scripts/subset-fonts.mjs. This finds the characters
// the copy uses the same way the script does, and fails when one the original font has is missing from the cut.

const jsonStrings = (value) =>
  typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value).flatMap(jsonStrings) : [];
const tsStrings = (source) =>
  [...source.matchAll(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g)]
    .map(([token]) => token)
    .filter((token) => !token.startsWith('/'))
    .map((token) => token.slice(1, -1));

/** Every character the site may draw from its copy, with the uppercase forms headlines use, and the hyphen `hyphens: auto` adds. */
const requiredCharacters = () => {
  const text = [
    ...jsonStrings(JSON.parse(read('src/content/locales/en.json'))),
    ...fs.readdirSync(path.join(root, 'src/content')).filter((name) => name.endsWith('.ts')).flatMap((name) => tsStrings(read(`src/content/${name}`))),
  ].join('');
  const chars = new Set('‐');
  for (const char of new Set(text)) for (const c of char + char.toUpperCase()) if (c.codePointAt(0) >= 0x20) chars.add(c);
  return chars;
};

/** The code points a WOFF2 font maps to a glyph, read from its cmap table's format 4 and 12 subtables. */
const KNOWN_TAGS = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca']; // the rest don't matter here
const cmapOf = (file) => {
  const woff = fs.readFileSync(file);
  assert.equal(woff.toString('latin1', 0, 4), 'wOF2', `${file} is not WOFF2`);
  const numTables = woff.readUInt16BE(12);
  const compressedLength = woff.readUInt32BE(20);
  let at = 48;
  const base128 = () => {
    let value = 0;
    for (;;) {
      const byte = woff[at++];
      value = value * 128 + (byte & 0x7f);
      if (!(byte & 0x80)) return value;
    }
  };
  // Tables sit back to back in the decompressed stream, in directory order, at their transformed length if transformed.
  let offset = 0;
  let cmap;
  for (let i = 0; i < numTables; i++) {
    const flags = woff[at++];
    const tag = (flags & 0x3f) === 63 ? woff.toString('latin1', at, (at += 4)) : KNOWN_TAGS[flags & 0x3f];
    const version = flags >> 6;
    const length = base128();
    const transformed = tag === 'glyf' || tag === 'loca' ? version !== 3 : version !== 0;
    const stored = transformed ? base128() : length;
    if (tag === 'cmap') cmap = { offset, length };
    offset += stored;
  }
  const data = zlib.brotliDecompressSync(woff.subarray(at, at + compressedLength)).subarray(cmap.offset, cmap.offset + cmap.length);

  const mapped = new Set();
  for (let i = 0; i < data.readUInt16BE(2); i++) {
    const sub = data.readUInt32BE(4 + i * 8 + 4);
    const format = data.readUInt16BE(sub);
    if (format === 4) {
      const segments = data.readUInt16BE(sub + 6) / 2;
      const ends = sub + 14;
      const starts = ends + segments * 2 + 2;
      const deltas = starts + segments * 2;
      const rangeOffsets = deltas + segments * 2;
      for (let s = 0; s < segments; s++) {
        const start = data.readUInt16BE(starts + s * 2);
        const end = data.readUInt16BE(ends + s * 2);
        const delta = data.readUInt16BE(deltas + s * 2);
        const rangeOffset = data.readUInt16BE(rangeOffsets + s * 2);
        for (let code = start; code <= end && code !== 0xffff; code++) {
          // With no range offset the glyph is code + delta; otherwise it is looked up, and 0 there means no glyph.
          const looked = rangeOffset ? data.readUInt16BE(rangeOffsets + s * 2 + rangeOffset + (code - start) * 2) : code;
          if (looked && (looked + delta) & 0xffff) mapped.add(code);
        }
      }
    } else if (format === 12) {
      for (let g = 0; g < data.readUInt32BE(sub + 12); g++) {
        const group = sub + 16 + g * 12;
        const start = data.readUInt32BE(group);
        const startGlyph = data.readUInt32BE(group + 8);
        for (let code = start; code <= data.readUInt32BE(group + 4); code++) if (startGlyph + code - start) mapped.add(code);
      }
    }
  }
  return mapped;
};

/** The subset fonts fonts.css loads, each with the Google Fonts original it was cut from. */
const siteFonts = () =>
  [...read('src/site/styles/fonts.css').matchAll(/url\('([^']+)'\)/g)].map(([, url]) => {
    const subset = path.join(root, 'src/site/styles', url);
    return { subset, source: subset.replace(/-site\.woff2$/, '-latin.woff2') };
  });

test('fonts.css loads the cut-down fonts, each with its original beside it', () => {
  const fonts = siteFonts();
  assert.equal(fonts.length, 5);
  for (const { subset, source } of fonts) {
    assert.match(subset, /-site\.woff2$/, `${subset} is not one of the cut-down fonts`);
    assert.ok(fs.existsSync(subset), `${subset} is missing; run node scripts/subset-fonts.mjs`);
    assert.ok(fs.existsSync(source), `${source} is missing`);
  }
});

test('Every character the copy uses that the original font has is in the cut-down font', () => {
  const chars = requiredCharacters();
  for (const { subset, source } of siteFonts()) {
    const has = cmapOf(subset);
    const had = cmapOf(source);
    assert.ok(had.has(0x41) && has.has(0x41), `could not read the cmap of ${subset}`);
    for (const char of chars) {
      const code = char.codePointAt(0);
      const name = `U+${code.toString(16).toUpperCase().padStart(4, '0')}`;
      assert.ok(!had.has(code) || has.has(code), `"${char}" (${name}) is missing from ${path.relative(root, subset)}; run node scripts/subset-fonts.mjs`);
    }
  }
});
