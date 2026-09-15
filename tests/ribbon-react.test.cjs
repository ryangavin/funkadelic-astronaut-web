const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Ribbon draws the footer seam and clips its block along the same wave', () => {
  const ribbon = read('src/components/Ribbon/Ribbon.tsx');
  const css = read('src/components/Ribbon/Ribbon.css');
  const legacy = read('app.js');

  // The footer wave and colours match the home page.
  assert.match(legacy, /footer: \{ frequency: 1\.3, amplitude: 15, rotation: 0, x: 0, y: -8 \}/);
  assert.match(ribbon, /FOOTER_RIBBON_WAVE: RibbonWave = \{ frequency: 1\.3, amplitude: 15, rotation: 0, x: 0, y: -8 \}/);
  assert.match(ribbon, /FOOTER_RIBBON_HEIGHT = 64/);
  assert.match(ribbon, /purple: '#9275b2'/);
  assert.match(ribbon, /const STROKES = \[44, 26, 14\]/);
  assert.match(ribbon, /const strokes = \[ink, PAPER, INK\]/);

  // Same block clipping and worn-ink finish as the original seam.
  assert.match(ribbon, /clipPath: `path\('\$\{wave\} L \$\{width\} \$\{size\.height\} L 0 \$\{size\.height\} Z'\)`/);
  assert.match(ribbon, /<PrintInkFilter id=\{filterId\} \/>/);
  assert.match(css, /\.ribbon \{[\s\S]+?padding-top: var\(--ribbon-height\)/);
});

test('Puck registers the ribbon as a slot-bearing layout block with the footer defaults', () => {
  const config = read('src/puck/config.tsx');

  assert.match(config, /components: \['PaperSheet', 'Pin', 'Ribbon'\]/);
  assert.match(config, /Ribbon: \{[\s\S]+?content: \{ type: 'slot' \}/);
  assert.match(config, /Ribbon: \{[\s\S]+?\.\.\.FOOTER_RIBBON_WAVE/);
});

test('Social icons include the GitHub mark used by the footer credit', () => {
  const platforms = read('src/components/SocialIcon/platforms.ts');

  assert.match(platforms, /github: \{\n\s+label: 'GitHub'/);
  // Normalised like its peers: a full 24-unit circle centred on x=12.
  assert.match(platforms, /github: \{[\s\S]+?silhouette: 'M12 0a12 12 0 1 0 0 24a12 12 0 1 0 0 -24z'/);
  assert.match(platforms, /github: \{[\s\S]+?glyph:\n\s+'M12 0/);
});
