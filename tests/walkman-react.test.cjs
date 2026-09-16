const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Walkman is a plain audio element behind piano keys, a segmented display and a turning cassette', () => {
  const component = read('src/components/Walkman/Walkman.tsx');
  const css = read('src/components/Walkman/Walkman.css');

  assert.match(component, /WALKMAN_FINISHES = \['silver', 'blue', 'black'\]/);
  assert.match(component, /WALKMAN_TITLE_CELLS = 10/);
  assert.match(component, /<audio ref=\{audio\} src=\{src\} preload="metadata" loop=\{loop\} onEnded=\{onEnded\} \/>/);
  // The element is the source of truth: the keys ask, the display follows what it reports.
  assert.match(component, /element\.addEventListener\('play', onPlaying\)/);
  assert.match(component, /element\.addEventListener\('pause', onPause\)/);
  assert.match(component, /if \(!winding\.current\) setMode\('stop'\)/);
  for (const key of ['Rewind', 'Play', 'Fast forward', 'Stop']) assert.match(component, new RegExp(`aria-label="${key}"`));
  assert.match(component, /aria-pressed=\{mode === 'play'\}/);
  // Wind keys seek while held, by pointer or keyboard, and jump on a bare click.
  assert.match(component, /onPointerDown: \(event[\s\S]+?startWinding\(direction\)/);
  assert.match(component, /if \(\(event\.key === ' ' \|\| event\.key === 'Enter'\) && !event\.repeat\) startWinding\(direction\)/);
  assert.match(component, /skip\(direction\)/);
  assert.match(component, /WALKMAN_WIND_RATE = 8/);
  assert.match(component, /WALKMAN_SKIP_SECONDS = 10/);
  assert.match(component, /<input\s+type="range"[\s\S]+?aria-label="Volume"/);
  assert.match(component, /role="status" aria-live="polite"/);
  assert.match(component, /<Cassette label=\{label \?\? name\} side=\{side\} progress=\{progress\} \/>/);
  assert.match(component, /shown = tape === 'ok' \? name : tape === 'bad' \? 'BAD TAPE' : 'NO TAPE'/);

  // Measured in 720ths of the width, like the paper components.
  assert.match(css, /--walkman-unit: calc\(100cqw \/ 720\)/);
  assert.match(css, /aspect-ratio: 720 \/ 590/);
  // The cassette sits behind the door's smoked window, its bottom edge inside the mechanism.
  assert.match(css, /\.walkman__window \{[\s\S]+?overflow: hidden/);
  assert.match(css, /\.walkman__window::after \{[\s\S]+?112deg/);
  assert.match(css, /\.cassette \{[\s\S]+?width: calc\(590 \* var\(--walkman-unit\)\)/);
  assert.match(css, /\.walkman\[data-finish='blue'\] \{/);
  // Hubs spin with the transport; fast when winding, backwards on rewind, never under reduced motion.
  assert.match(css, /\.cassette__hub \{[\s\S]+?transform-box: fill-box/);
  assert.match(css, /\.walkman\[data-mode='play'\] \.cassette__hub \{\s+animation-play-state: running/);
  assert.match(css, /\.walkman\[data-mode='rew'\] \.cassette__hub \{\s+animation-direction: reverse/);
  assert.match(css, /prefers-reduced-motion: reduce\) \{\s+\.cassette__hub \{\s+animation: none/);
  // Unlit segments ghost, lit ones ink; the colon blinks while playing.
  assert.match(css, /\.segment \{\s+fill: var\(--walkman-lcd-ghost\)/);
  assert.match(css, /\.segment\[data-lit\] \{\s+fill: var\(--walkman-lcd-ink\)/);
  assert.match(css, /\.walkman__lcd\[data-blink\] \.segment--colon \{\s+animation: walkman-blink/);
  assert.match(css, /\.walkman__key\[aria-pressed='true'\]/);

  const cassette = read('src/components/Walkman/Cassette.tsx');
  assert.match(cassette, /const clip = useId\(\)/);
  assert.match(cassette, /<g transform=\{`translate\(\$\{cx\} \$\{AXIS\}\)`\}>\s+<g className="cassette__hub">/);
  assert.ok(fs.existsSync(path.join(root, 'assets', 'audio', 'demo-tape.mp3')));
});

test('Segments: the fourteen-segment font, the scrolling window and the tape counter', async () => {
  const { GLYPHS, OUTLINE, SEGMENTS, SCROLL_GAP, counter, encode, litSegments, normalise, scrollLength, titleFrom, window } = await import(
    '../src/components/Walkman/segments.ts'
  );

  assert.equal(SEGMENTS.length, 15);
  assert.deepEqual(litSegments(encode('A')), ['a', 'b', 'c', 'e', 'f', 'g1', 'g2']);
  assert.deepEqual(litSegments(encode('T')), ['a', 'i', 'l']);
  assert.deepEqual(litSegments(encode('X')), ['h', 'j', 'k', 'm']);
  // Digits stay inside the seven-segment outline so the counter can draw them.
  for (const digit of '0123456789') assert.equal(encode(digit) & ~OUTLINE, 0, `digit ${digit}`);
  assert.equal(encode('8'), OUTLINE);
  // Case, accents and typographic lookalikes fold onto what the display has; the rest go blank.
  assert.equal(normalise('é'), 'E');
  assert.equal(normalise('–'), '-');
  assert.equal(normalise('’'), "'");
  assert.equal(normalise('§'), ' ');
  assert.equal(encode('a'), GLYPHS.A);
  assert.equal(encode('§'), 0);

  // Short text sits left and never scrolls.
  assert.equal(scrollLength('PLAY', 10), 0);
  assert.equal(window('PLAY', 10).join(''), 'PLAY      ');
  assert.equal(window('PLAY', 10, 7).join(''), 'PLAY      ');
  // Long text loops with a gap; the offset wraps.
  const title = 'FUNKADELIC ASTRONAUT';
  assert.equal(scrollLength(title, 10), title.length + SCROLL_GAP);
  assert.equal(window(title, 10, 0).join(''), 'FUNKADELIC');
  assert.equal(window(title, 10, 11).join(''), 'ASTRONAUT ');
  assert.equal(window(title, 10, title.length + SCROLL_GAP).join(''), 'FUNKADELIC');
  assert.equal(window(title, 10, title.length - 2).join(''), 'UT   FUNKA');

  assert.equal(counter(undefined), '--:--');
  assert.equal(counter(Number.NaN), '--:--');
  assert.equal(counter(0), '00:00');
  assert.equal(counter(61.9), '01:01');
  assert.equal(counter(3599), '59:59');
  assert.equal(counter(6000), '99:00');

  assert.equal(titleFrom('/assets/audio/demo-tape.mp3'), 'demo tape');
  assert.equal(titleFrom('https://cdn.example/Live_Set%20One.m4a?x=1'), 'Live Set One');
  assert.equal(titleFrom(''), 'TAPE');
});
