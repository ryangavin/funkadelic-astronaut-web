const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const render = (node) => renderToStaticMarkup(React.createElement('div', null, node));
const hidden = /<span class="printed-wordmark__text">[^<]*<\/span>/g;
const visibleText = (html) => html.replace(hidden, '').replace(/<[^>]+>/g, '');

test('Wordmark splits printed text into independent glyphs while words and reading stay intact', async () => {
  const { printGlyphs, GLYPH_CLASS } = await import('../src/components/2D/Wordmark/glyphs.ts');
  const html = render(printGlyphs('GOOD MUSIC'));

  assert.equal(html.match(hidden)[0], '<span class="printed-wordmark__text">GOOD MUSIC</span>');
  assert.equal(html.match(/class="printed-wordmark__word" aria-hidden="true"/g).length, 2);
  assert.equal(html.match(new RegExp(`class="${GLYPH_CLASS}"`, 'g')).length, 9);
  assert.match(html, /<span class="printed-wordmark__glyph">D<\/span><\/span> <span class="printed-wordmark__word"/);
  assert.equal(visibleText(html), 'GOOD MUSIC');

  // Graphemes stay whole: a combining accent and an emoji are one glyph each.
  assert.equal(render(printGlyphs('é\u{1F3B8}')).match(new RegExp(`class="${GLYPH_CLASS}"`, 'g')).length, 2);
  // Whitespace-only text and non-text nodes pass through untouched.
  assert.equal(render(printGlyphs([' ', null, 3])), '<div> <span class="printed-wordmark__text">3</span><span class="printed-wordmark__word" aria-hidden="true"><span class="printed-wordmark__glyph">3</span></span></div>');
});

test('Wordmark splits text inside supplied markup and moves artwork as one print', async () => {
  const { printGlyphs, GLYPH_CLASS } = await import('../src/components/2D/Wordmark/glyphs.ts');
  const Custom = ({ children }) => React.createElement('em', null, children);
  const html = render(printGlyphs(React.createElement('span', { className: 'row' },
    React.createElement('svg', { className: 'icon' }), 'LIVE', React.createElement(Custom, null, 'NOW'))));

  assert.match(html, /^<div><span class="row"><svg class="icon printed-wordmark__glyph"><\/svg>/);
  assert.equal(html.match(new RegExp(`class="${GLYPH_CLASS}"`, 'g')).length, 4);
  assert.match(html, /<em>NOW<\/em><\/span><\/div>$/);
  assert.equal(visibleText(html), 'LIVENOW');
});

test('Wordmark wires its jitter prop to every glyph on one shared cadence', () => {
  const wordmark = read('src/components/2D/Wordmark/Wordmark.tsx');
  const css = read('src/components/2D/Wordmark/Wordmark.css');
  const motion = read('src/behaviors/Jitter/motion.ts');

  assert.match(wordmark, /jitter\?: boolean \| JitterOptions/);
  assert.match(wordmark, /const motion: JitterOptions = \{ preset: 'print'/);
  assert.match(wordmark, /querySelectorAll<HTMLElement>\(`\.\$\{GLYPH_CLASS\}`\)/);
  assert.match(wordmark, /return attachJitter\(root\.current, glyphs, motion\)/);
  assert.match(wordmark, /\{jittering \? printGlyphs\(children\) : children\}/);
  assert.match(motion, /layer: HTMLElement \| HTMLElement\[\]/);
  assert.match(css, /\.printed-wordmark__word \{ white-space: nowrap; \}/);
  assert.match(css, /\.printed-wordmark__glyph \{ display: inline-block; \}/);
  assert.match(css, /\.printed-wordmark__text \{[\s\S]+?clip-path: inset\(50%\)/);
});
