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
  assert.match(component, /<Weathered className="index-card__sheet" grain>/);
  assert.match(component, /className="index-card__clearance"/);
  assert.match(css, /--index-card-unit: calc\(100cqw \/ 720\)/);
  assert.match(css, /--index-card-head: 84;/);
  assert.match(css, /\[data-ruling='ruled'\] \.index-card__sheet::before \{[\s\S]+?rgb\(214 73 63/);
  assert.match(css, /line-height: calc\(var\(--index-card-lead\) \* var\(--index-card-unit\)\)/);
  assert.match(css, /\.index-card__head,\n\.index-card__body \{[\s\S]+?font-family: var\(--font-handwritten/);
  assert.match(css, /\.index-card__note \{[\s\S]+?font-family: var\(--font-handwritten/);
  assert.match(component, /signature\?: IndexCardSignature/);
  assert.match(component, /className="index-card__signature index-card__signature--scrawl"/);
  const scrawls = read('src/sections/BandDossier/signatures.ts');
  for (const name of ['RYAN_SIGNATURE', 'KEVIN_SIGNATURE', 'SAM_SIGNATURE']) assert.match(scrawls, new RegExp(`export const ${name} = \\[`));
  assert.match(css, /\.index-card__signature \{[\s\S]+?font-family: var\(--index-card-signature-font/);
  assert.match(css, /\.index-card__stamp--bottom-left \{/);
  assert.match(css, /\.index-card__signoff \{[\s\S]+?display: flex/);
  assert.match(component, /INDEX_CARD_STAMP_POSITIONS = \['top-right', 'bottom-left', 'bottom-right', 'signature'\]/);
  const fonts = read('src/styles/fonts.css');
  assert.match(fonts, /font-family: 'Homemade Apple'/);
  assert.match(fonts, /font-family: 'Kristi'/);
  assert.match(fonts, /font-family: 'Herr Von Muellerhoff'/);
  for (const family of ['homemadeapple/HomemadeApple-Regular.ttf', 'kristi/Kristi-Regular.ttf', 'herrvonmuellerhoff/HerrVonMuellerhoff-Regular.ttf']) {
    assert.ok(fs.existsSync(path.join(root, 'assets', 'fonts', family)), family);
  }
  assert.match(fonts, /--font-signature-ryan:/);
});

test('Folder hinges its cover on the spine and carries a tab on the back leaf', () => {
  const component = read('src/components/Folder/Folder.tsx');
  const css = read('src/components/Folder/Folder.css');

  assert.match(component, /FOLDER_STOCKS = \['manila', 'kraft', 'green'\]/);
  assert.match(component, /<Weathered className="folder__leaf folder__back" patina=\{0\.5\} flecks=\{0\.5\}>/);
  assert.match(component, /data-open=\{open \? 'true' : 'false'\}/);
  assert.match(css, /--folder-unit: calc\(100cqw \/ 1440\)/);
  assert.match(css, /\.folder__cover \{[\s\S]+?transform-origin: 100% 50%/);
  assert.match(css, /\.folder\[data-open='false'\] \.folder__cover \{\s+transform: rotateY\(180deg\)/);
  assert.match(css, /\.folder__face--outside \{\s+transform: rotateY\(180deg\)/);
  assert.match(css, /\.folder__tab \{[\s\S]+?top: calc\(-1 \* var\(--folder-tab\)/);
  assert.match(component, /FOLDER_TABS = \['top', 'side'\]/);
  assert.match(css, /\.folder\[data-stamps='bottom'\] \.folder__stamp \{/);
  assert.match(css, /\.folder\[data-tab='side'\] \.folder__label \{[\s\S]+?writing-mode: vertical-rl/);
  assert.match(read('src/sections/BandDossier/bandMembers.tsx'), /export const BAND_PACKET: PacketProps/);
});

test('Packet clips a Polaroid over an IndexCard and marks the print for the stack to lag', () => {
  const component = read('src/components/Packet/Packet.tsx');

  assert.match(component, /PACKET_RATIO = '720 \/ 480'/);
  assert.match(component, /<IndexCard \{\.\.\.cardProps\} clearance=\{clearance\}>\s+\{children\}\s+\{factList\}/);
  assert.match(component, /facts\?: React\.ReactNode\[\]/);
  assert.match(component, /<div className="packet__photo" data-stack-lag="">\s+<Polaroid \{\.\.\.photo\} \/>/);
  assert.match(component, /<PaperClip part="back" className="packet__clip packet__clip--back" \/>/);
  assert.match(component, /<PaperClip part="front" className="packet__clip" \/>/);
  assert.match(read('src/components/Packet/Packet.css'), /\.packet__card \{\s+position: absolute;\s+z-index: 1;/);
  assert.match(read('src/components/Packet/Packet.css'), /\.packet__clip--back \{\s+z-index: 0;/);
});

test('BandDossier is the band section: the live set in the cover, the pile and the folded one-sheet in the well', () => {
  const section = read('src/sections/BandDossier/BandDossier.tsx');
  const css = read('src/sections/BandDossier/BandDossier.css');

  assert.match(section, /export function MemberPile\(/);
  assert.match(section, /role="region" aria-roledescription="carousel" aria-label="Meet the band"/);
  assert.match(section, /className="member-pile__status" role="status" aria-live="polite"/);
  assert.match(section, /export function BandDossier\(/);
  assert.match(section, /<section className=\{`dossier \$\{className\}`\} style=\{\{ \.\.\.placement, \.\.\.style \}\} aria-label="The band">/);
  assert.match(section, /tab="side"/);
  assert.match(section, /stampsAt="bottom"/);
  assert.match(section, /video=\{liveSet\.video\}\s+plain\s+format="wide"/);
  assert.match(section, /note=\{liveSet\.note\}/);
  // The cassette player is left in the cover under the print, with the demo tape in it unless told otherwise.
  assert.match(section, /tape = DEMO_TAPE,/);
  assert.match(section, /\{tape && \(\s+<div className="dossier__deck">\s+<Walkman \{\.\.\.tape\} finish="silver" rotation=\{deckRotation\} \/>/);
  assert.match(read('src/sections/BandDossier/bandMembers.tsx'), /export const DEMO_TAPE: Tape = \{\s+src: demoTape,/);
  assert.match(css, /\.dossier__deck \{\s+position: absolute;\s+left: var\(--dossier-deck-x\);\s+bottom: var\(--dossier-deck-y\);\s+width: var\(--dossier-deck-width\);\s+z-index: 2;/);
  assert.match(css, /--dossier-deck-width: 94%;\s+--dossier-deck-x: -4%;\s+--dossier-deck-y: -14%;/);
  assert.match(section, /<MemberPile members=\{members\} initial=\{initial\} spread=\{spread\} spreadX=\{spreadX\} duration=\{duration\} \/>\s+<OneSheet \{\.\.\.oneSheet\} rotation=\{bandRotation\} \/>/);
  assert.match(section, /oneSheet = BAND_ONE_SHEET,/);
  // Placement is a set of props the stories expose as controls, written to variables the stylesheet defaults.
  assert.match(section, /export const DOSSIER_PLACEMENT = \{\s+proofWidth: 108,/);
  assert.match(section, /'--dossier-deck-x': `\$\{deckX\}%`/);
  assert.match(section, /rotation=\{proofRotation\}/);
  assert.match(css, /\.dossier \{\s+--dossier-proof-width: 108%;/);
  assert.match(css, /\.dossier__proof \{\s+width: var\(--dossier-proof-width\);\s+margin-left: var\(--dossier-proof-x\)/);
  assert.match(css, /\.member-pile \{\s+position: relative;\s+translate: var\(--dossier-pile-x\) 0;\s+rotate: var\(--dossier-pile-rotation\)/);
  assert.match(read('src/sections/BandDossier/BandDossier.stories.tsx'), /\.\.\.DOSSIER_PLACEMENT \}/);
  assert.match(css, /\.member-pile__status \{[\s\S]+?clip-path: inset\(50%\)/);
  assert.doesNotMatch(read('styles/sections.css'), /\.dossier\b(?!-)/, 'the legacy stylesheet must not style the React section');
  // The sheet's wear is a Weathered surface, so a glossy print laid on it is not speckled.
  assert.doesNotMatch(read('src/components/PaperSheet/PaperSheet.css'), /paper-sheet__wear/);
});

test('Stack maths: depth wraps, slots layer by depth, and one packet flies per sift', async () => {
  const { depthOf, slotFor, movesBetween, siftKeyframes, layerSwitchAt, STACK_SHIFTS } = await import('../src/behaviors/Stack/sift.ts');

  assert.deepEqual([0, 1, 2].map((item) => depthOf(item, 1, 3)), [2, 0, 1]);
  assert.equal(depthOf(4, 0, 0), 0);

  const top = slotFor(0, 0, 3);
  const bottom = slotFor(2, 2, 3);
  assert.equal(top.zIndex, 3);
  assert.equal(bottom.zIndex, 1);
  assert.equal(top.dx, STACK_SHIFTS[0]);
  assert.equal(slotFor(0, 2, 3).dx, STACK_SHIFTS[0]);
  // The sideways lean has its own dial, which follows the overall spread unless set.
  assert.equal(slotFor(0, 0, 3, 2).dx, STACK_SHIFTS[0] * 2);
  assert.equal(slotFor(0, 1, 3, 2, 0.5).dx, STACK_SHIFTS[0] * 0.5);
  assert.equal(slotFor(0, 1, 3, 2, 0.5).dy, slotFor(0, 1, 3, 2).dy);
  const middle = slotFor(1, 1, 3);
  assert.ok(Math.sign(bottom.dx) !== Math.sign(middle.dx) && bottom.dy < middle.dy && bottom.scale < 1);
  assert.ok(Math.sign(bottom.rotate - slotFor(2, 0, 3).rotate) !== Math.sign(middle.rotate - slotFor(1, 0, 3).rotate));
  assert.equal(top.transform, `translate(${STACK_SHIFTS[0].toFixed(2)}%, 0.00%) rotate(-1.20deg) scale(1.000)`);

  assert.deepEqual(movesBetween(0, 1, 3), [{ item: 0, kind: 'toBack' }]);
  assert.deepEqual(movesBetween(1, 0, 3), [{ item: 0, kind: 'toFront' }]);
  assert.deepEqual(movesBetween(2, 0, 3), [{ item: 2, kind: 'toBack' }]);
  assert.deepEqual(movesBetween(1, 1, 3), []);
  assert.deepEqual(movesBetween(0, 1, 1), []);

  const away = siftKeyframes('toBack', top, bottom);
  assert.equal(away[0].transform, top.transform);
  assert.equal(away.at(-1).transform, bottom.transform);
  assert.match(String(away[2].transform), new RegExp(`^translate\\(${(bottom.dx + 60).toFixed(2)}%`));
  const back = siftKeyframes('toFront', bottom, top, -1);
  assert.equal(back.at(-1).transform, top.transform);
  assert.match(String(back[1].transform), new RegExp(`^translate\\(${(bottom.dx + 58).toFixed(2)}%`));
  assert.ok(layerSwitchAt('toBack') > layerSwitchAt('toFront'));
});
