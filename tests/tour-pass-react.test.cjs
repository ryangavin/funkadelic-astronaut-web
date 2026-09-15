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
    'Sample date',
    'Artist pass',
    'Festival day 01',
    'Olive’s',
    'Nyack, New York',
    'Address to be announced',
    'Doors + set · TBD',
    '/assets/tour-pass-ryan-cutout.png',
    'Ticket TBD',
  ]) {
    assert.match(component, new RegExp(content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(component, /<header className="tour-pass__date-panel">/);
  assert.match(component, /<img[\s\S]+?className="tour-pass__portrait"/);
  assert.match(component, /actionHref \? \([\s\S]+?<a[\s\S]+?: \([\s\S]+?<span/);
  assert.match(css, /\.tour-pass::before[\s\S]+?clip-path:/);
  assert.match(css, /\.tour-pass__speech-bubble::before[\s\S]+?clip-path:/);
  assert.match(css, /transform: rotate\(-2\.15deg\)/);
});

test('Puck exposes editable tour content and Storybook loads shared local fonts', () => {
  const config = read('src/puck/config.tsx');
  const fonts = read('src/styles/fonts.css');
  const storybook = read('.storybook/preview.ts');

  for (const field of [
    'dateTime',
    'weekday',
    'month',
    'day',
    'statusLabel',
    'tierLabel',
    'stageLabel',
    'venue',
    'city',
    'location',
    'time',
    'portraitSrc',
    'actionLabel',
    'actionHref',
  ]) {
    assert.match(config, new RegExp(`${field}: \\{ type: 'text'`));
  }

  assert.match(config, /components: \['TourPass'\]/);
  assert.match(config, /render: \(props\) => <TourPass \{\.\.\.props\} \/>/);
  assert.match(fonts, /font-family: 'Balsamiq Sans'/);
  assert.match(fonts, /font-family: 'Modak'/);
  assert.match(fonts, /font-family: 'Caveat'/);
  assert.match(fonts, /--font-body:/);
  assert.match(fonts, /--font-display:/);
  assert.match(fonts, /--font-handwritten:/);
  assert.match(storybook, /src\/styles\/fonts\.css/);
});
