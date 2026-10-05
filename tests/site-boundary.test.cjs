const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const walk = (dir) =>
  fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const file = path.posix.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
const imports = (file) => [...read(file).matchAll(/^\s*import\s+(type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/gm)].map((match) => ({ typeOnly: !!match[1], spec: match[2] }));
const resolved = (file, spec) => path.posix.normalize(path.posix.join(path.posix.dirname(file), spec));

test('The .com is its own source tree: index.html loads src/site, and src/site imports nothing from the desk experience', () => {
  assert.match(read('index.html'), /<script type="module" src="\/src\/site\/main\.tsx"><\/script>/);
  for (const file of walk('src/site').filter((name) => /\.tsx?$/.test(name))) {
    for (const { spec } of imports(file)) {
      if (spec.startsWith('.')) assert.doesNotMatch(resolved(file, spec), /^src\/experience\//, `${file} imports ${spec}`);
    }
  }
});

test('Band content is plain data: no stylesheets and no components, only types and assets from elsewhere', () => {
  for (const file of walk('src/content').filter((name) => /\.tsx?$/.test(name))) {
    for (const { typeOnly, spec } of imports(file)) {
      assert.doesNotMatch(spec, /\.css$/, `${file} imports a stylesheet`);
      if (spec.startsWith('.') && !typeOnly) assert.match(resolved(file, spec), /^(assets\/|src\/content\/)/, `${file} imports ${spec}`);
    }
  }
});

test('The press kit reads its words from the copy catalogue', () => {
  const catalogue = JSON.parse(read('src/content/locales/en.json'));
  assert.equal(catalogue.pressKit.foot.book, 'Book The Band');
  assert.equal(catalogue.pressKit.band.heading, 'Three friends. One orbit.');
  assert.equal(catalogue.band.members.ryan.bio.length, 2);
  const page = read('src/site/PressKit/PressKit.tsx') + read('src/site/PressKit/LiveVideo.tsx') + read('src/site/PressKit/BandcampPlayer.tsx');
  for (const words of ['Book The Band', 'Three friends', 'Future rock', 'Watch with sound', 'On this page', 'by Funkadelic Astronaut']) assert.ok(!page.includes(words), `"${words}" is written in a component`);
  // The desk reads the members' shared bios from the same place.
  assert.match(read('src/experience/sections/BandDossier/bandMembers.tsx'), /\bt\(`band\.members\.\$\{id\}\.bio`\)/);
});

test('The catalogue is read in-repo: no i18n library, and inline markup becomes elements, never HTML', () => {
  const manifest = JSON.parse(read('package.json'));
  for (const name of ['i18next', 'react-i18next']) assert.ok(!(name in { ...manifest.dependencies, ...manifest.devDependencies }), `${name} is a dependency`);
  const copy = read('src/i18n/copy.tsx');
  assert.doesNotMatch(copy, /dangerouslySetInnerHTML/);
  assert.match(copy, /export function t<K extends CopyKey>\(key: K, values\?: CopyValues\): At<Catalogue, K>/);
  for (const file of walk('src').concat(walk('.storybook')).filter((name) => /\.tsx?$/.test(name))) {
    for (const { spec } of imports(file)) assert.doesNotMatch(spec, /i18next/, `${file} imports ${spec}`);
  }
});
