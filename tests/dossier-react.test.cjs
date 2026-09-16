const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('IndexCard sets type on printed rules and keeps clear of a clipped photo', () => {
  const component = read('src/components/IndexCard/IndexCard.tsx');
  const css = read('src/components/IndexCard/IndexCard.css');

  assert.match(component, /INDEX_CARD_SIZES = \['4x6', '3x5'\]/);
  assert.match(component, /className="index-card__clearance"/);
  assert.match(css, /--index-card-unit: calc\(100cqw \/ 720\)/);
  assert.match(css, /--index-card-head: 84;/);
  assert.match(css, /\[data-ruling='ruled'\] \.index-card__sheet::before \{[\s\S]+?rgb\(214 73 63/);
  assert.match(css, /line-height: calc\(var\(--index-card-lead\) \* var\(--index-card-unit\)\)/);
  assert.match(css, /\.index-card__head,\n\.index-card__body \{[\s\S]+?font-family: var\(--font-handwritten/);
  assert.match(css, /\.index-card__note \{[\s\S]+?font-family: var\(--font-handwritten/);
});

test('Folder hinges its cover on the spine and carries a tab on the back leaf', () => {
  const component = read('src/components/Folder/Folder.tsx');
  const css = read('src/components/Folder/Folder.css');

  assert.match(component, /FOLDER_STOCKS = \['manila', 'kraft', 'green'\]/);
  assert.match(component, /data-open=\{open \? 'true' : 'false'\}/);
  assert.match(css, /--folder-unit: calc\(100cqw \/ 1440\)/);
  assert.match(css, /\.folder__cover \{[\s\S]+?transform-origin: 100% 50%/);
  assert.match(css, /\.folder\[data-open='false'\] \.folder__cover \{\s+transform: rotateY\(180deg\)/);
  assert.match(css, /\.folder__face--outside \{\s+transform: rotateY\(180deg\)/);
  assert.match(css, /\.folder__tab \{[\s\S]+?top: calc\(-1 \* var\(--folder-tab\)/);
});

test('Packet clips a Polaroid over an IndexCard and marks the print for the stack to lag', () => {
  const component = read('src/components/Packet/Packet.tsx');

  assert.match(component, /PACKET_RATIO = '720 \/ 480'/);
  assert.match(component, /<IndexCard \{\.\.\.card\} clearance=\{clearance\} \/>/);
  assert.match(component, /<div className="packet__photo" data-stack-lag="">\s+<Polaroid \{\.\.\.photo\} \/>/);
  assert.match(component, /<PaperClip part="back" className="packet__clip packet__clip--back" \/>/);
  assert.match(component, /<PaperClip part="front" className="packet__clip" \/>/);
  assert.match(read('src/components/Packet/Packet.css'), /\.packet__card \{\s+position: absolute;\s+z-index: 1;/);
  assert.match(read('src/components/Packet/Packet.css'), /\.packet__clip--back \{\s+z-index: 0;/);
});

test('Stack maths: depth wraps, slots layer by depth, and one packet flies per sift', async () => {
  const { depthOf, slotFor, movesBetween, siftKeyframes, layerSwitchAt } = await import('../src/behaviors/Stack/sift.ts');

  assert.deepEqual([0, 1, 2].map((item) => depthOf(item, 1, 3)), [2, 0, 1]);
  assert.equal(depthOf(4, 0, 0), 0);

  const top = slotFor(0, 0, 3);
  const bottom = slotFor(2, 2, 3);
  assert.equal(top.zIndex, 3);
  assert.equal(bottom.zIndex, 1);
  assert.equal(top.dx, 0);
  assert.ok(Math.abs(bottom.dx) > 0 && bottom.dy < 0 && bottom.scale < 1);
  assert.match(top.transform, /^translate\(0\.00%, 0\.00%\) rotate\(-1\.20deg\) scale\(1\.000\)$/);

  assert.deepEqual(movesBetween(0, 1, 3), [{ item: 0, kind: 'toBack' }]);
  assert.deepEqual(movesBetween(1, 0, 3), [{ item: 0, kind: 'toFront' }]);
  assert.deepEqual(movesBetween(2, 0, 3), [{ item: 2, kind: 'toBack' }]);
  assert.deepEqual(movesBetween(1, 1, 3), []);
  assert.deepEqual(movesBetween(0, 1, 1), []);

  const away = siftKeyframes('toBack', top, bottom);
  assert.equal(away[0].transform, top.transform);
  assert.equal(away.at(-1).transform, bottom.transform);
  assert.match(String(away[2].transform), /translate\(6[0-9]\.\d+%/);
  const back = siftKeyframes('toFront', bottom, top, -1);
  assert.equal(back.at(-1).transform, top.transform);
  assert.match(String(back[1].transform), /translate\([0-9]+\.\d+%/);
  assert.ok(layerSwitchAt('toBack') > layerSwitchAt('toFront'));
});
