const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('PaperSheet reuses the site torn edge and positions against a 1440 reference width', () => {
  const sheet = read('src/components/PaperSheet/PaperSheet.tsx');
  const sheetCss = read('src/components/PaperSheet/PaperSheet.css');
  const edge = read('src/styles/torn-edge.css');

  assert.match(sheet, /className="paper-sheet torn-edge"/);
  assert.match(sheet, /PAPER_SHEET_REFERENCE_WIDTH = 1440/);
  assert.match(sheetCss, /--sheet-unit: calc\(100cqw \/ 1440\)/);

  for (const side of ['top', 'bottom', 'left', 'right']) {
    assert.match(edge, new RegExp(`paper-torn-${side}\\.svg`));
    assert.ok(fs.existsSync(path.join(root, 'assets', `paper-torn-${side}.svg`)));
  }
});

test('Pin places children in sheet units and exposes the Puck drag handle', () => {
  const pin = read('src/components/Pin/Pin.tsx');
  const pinCss = read('src/components/Pin/Pin.css');

  assert.match(pin, /dragRef/);
  assert.match(pinCss, /position: absolute/);
  assert.match(pinCss, /var\(--pin-x, 0\) \* var\(--sheet-unit/);
});

test('Puck registers the sheet and pin as slot-bearing layout blocks', () => {
  const config = read('src/puck/config.tsx');

  assert.match(config, /components: \['PaperSheet', 'Pin'\]/);
  assert.match(config, /PaperSheet: \{[\s\S]+?content: \{ type: 'slot' \}/);
  assert.match(config, /Pin: \{[\s\S]+?inline: true/);
  assert.match(config, /dragRef=\{puck\.dragRef\}/);
});

test('PaperSheet prints an optional image onto the stock underneath the content', () => {
  const sheet = read('src/components/PaperSheet/PaperSheet.tsx');
  const sheetCss = read('src/components/PaperSheet/PaperSheet.css');
  const config = read('src/puck/config.tsx');

  assert.match(sheet, /imageSrc\?: string/);
  assert.match(sheet, /const image = imageSrc \? \([\s\S]+?className="paper-sheet__image"/);
  assert.match(sheet, /\{image\}\s+<div className="paper-sheet__stage"/);
  assert.match(sheetCss, /\.paper-sheet__image \{[\s\S]+?mix-blend-mode: multiply/);
  assert.match(sheetCss, /\.paper-sheet__image \{[\s\S]+?z-index: 0/);
  assert.match(sheetCss, /\.paper-sheet__stage \{[\s\S]+?z-index: 1/);
  for (const field of ['imageSrc', 'imageSize', 'imagePosition', 'imageOpacity', 'imageContrast']) {
    assert.match(config, new RegExp(`PaperSheet: \\{[\\s\\S]+?${field}: \\{ type: '(text|number)'`));
  }
});
