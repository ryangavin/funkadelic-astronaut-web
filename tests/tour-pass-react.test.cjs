const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('React tour pass preserves the complete Olive’s artist pass', () => {
  const component = read('src/components/TourPass/TourPass.tsx');
  const css = read('src/components/TourPass/TourPass.css');

  for (const content of [
    '2026-09-18',
    'Artist pass',
    'Olive’s',
    'Nyack, New York',
    '118A Main Street',
    'Doors + set · TBD',
    '/assets/performance.webp',
    'Ticket TBD',
  ]) {
    assert.match(component, new RegExp(content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(component, /<header className="tour-pass__headline">/);
  assert.match(component, /className="tour-pass__tier-band"/);
  assert.match(component, /className="tour-pass__venue-image"/);
  // Every pass is one size: the card has a fixed height and long venue names step down instead of wrapping it taller.
  assert.match(component, /export const venueFit = \(venue: string\): VenueFit => \(venue\.length <= 12 \? 'short' : venue\.length <= 22 \? 'medium' : 'long'\)/);
  assert.match(component, /<p className="tour-pass__venue" data-fit=\{venueFit\(venue\)\}>/);
  const passCss = read('src/components/TourPass/TourPass.css');
  assert.match(passCss, /\.tour-pass \{[\s\S]+?height: calc\(540 \* var\(--u\)\);/);
  assert.doesNotMatch(passCss, /min-height: calc\(540/);
  assert.match(component, /actionHref \? \([\s\S]+?<a[\s\S]+?: \([\s\S]+?<span/);
  assert.match(css, /\.tour-pass::before[\s\S]+?border-radius: 50%/);
  assert.match(component, /function Barcode/);
  assert.match(css, /transform: rotate\(var\(--tour-pass-rotation\)\)/);
  assert.match(component, /DEFAULT_TOUR_PASS_ROTATION = -2\.15/);
  assert.match(css, /\[data-color='blue'\]/);
  assert.match(css, /\[data-color='green'\]/);
});

test('Storybook loads shared local fonts', () => {
  const fonts = read('src/styles/fonts.css');
  const storybook = read('.storybook/preview.ts');

  assert.match(fonts, /font-family: 'Balsamiq Sans'/);
  assert.match(fonts, /font-family: 'Modak'/);
  assert.match(fonts, /font-family: 'Caveat'/);
  assert.match(fonts, /--font-body:/);
  assert.match(fonts, /--font-display:/);
  assert.match(fonts, /--font-handwritten:/);
  assert.match(storybook, /src\/styles\/fonts\.css/);
});
