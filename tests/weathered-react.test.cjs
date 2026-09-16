const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Weathered textures sit above the surface and beneath whatever is placed on it', () => {
  const component = read('src/behaviors/Weathered/Weathered.tsx');
  const css = read('src/behaviors/Weathered/Weathered.css');

  assert.match(component, /WEATHERED_TEXTURES = \['patina', 'flecks', 'grain', 'wear'\]/);
  assert.match(component, /className=\{`weathered \$\{className\}`\} data-tone=\{tone\}/);
  assert.match(css, /\.weathered \{\s+position: relative;\s+isolation: isolate;/);
  assert.match(css, /\.weathered__layer \{\s+position: absolute;\s+z-index: -1;/);
  assert.match(css, /\.weathered\[data-tone='light'\] \.weathered__layer--flecks \{[\s\S]+?mix-blend-mode: screen/);
  for (const texture of ['paper-patina', 'paper-dark-flecks', 'paper-flecks', 'paper-grain', 'print-wear']) {
    assert.ok(fs.existsSync(path.join(root, 'assets', `${texture}.svg`)), texture);
  }
});
