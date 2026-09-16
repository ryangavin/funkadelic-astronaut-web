const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Polaroid is a captioned figure with the two instant-film formats', () => {
  const component = read('src/components/Polaroid/Polaroid.tsx');
  const css = read('src/components/Polaroid/Polaroid.css');

  assert.match(component, /POLAROID_FORMATS = \['square', 'wide'\]/);
  assert.match(component, /<figure className="polaroid__card">/);
  assert.match(component, /<img className="polaroid__photo" src=\{src\} alt=\{alt\} \/>/);
  assert.match(component, /<figcaption className="polaroid__caption">/);

  // Real pack proportions, in 720ths of the width.
  assert.match(css, /--polaroid-unit: calc\(100cqw \/ 720\)/);
  assert.match(css, /--polaroid-ratio: 720 \/ 875;/);
  assert.match(css, /--polaroid-pad-bottom: 180;/);
  assert.match(css, /\[data-format='wide'\] \{[\s\S]+?--polaroid-ratio: 720 \/ 573;/);
});

test('Polaroid prints its photo like dye film: cropped to a focus, blacks lifted, recessed under gloss', () => {
  const css = read('src/components/Polaroid/Polaroid.css');

  assert.match(css, /object-position: var\(--polaroid-focus\)/);
  assert.match(css, /\.polaroid__fade::before \{[\s\S]+?mix-blend-mode: lighten/);
  assert.match(css, /\.polaroid__window::after \{[\s\S]+?inset 0 calc\(2 \* var\(--polaroid-unit\)\)/);
  assert.match(css, /\.polaroid__card::after \{[\s\S]+?112deg/);
  assert.match(css, /\.polaroid__caption \{[\s\S]+?height: calc\(var\(--polaroid-pad-bottom\) \* var\(--polaroid-unit\)\)/);
  assert.match(css, /\.polaroid__caption \{[\s\S]+?align-content: center/);
  assert.match(css, /\.polaroid__line \{[\s\S]+?align-items: baseline/);
  assert.match(css, /\.polaroid__caption \{[\s\S]+?font-family: var\(--font-handwritten/);
  assert.ok(fs.existsSync(path.join(root, 'assets', 'paper-grain.svg')));
});
