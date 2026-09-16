const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Handheld is a widescreen games console whose screen plays the disc through the embedded player', () => {
  const component = read('src/components/Handheld/Handheld.tsx');
  const css = read('src/components/Handheld/Handheld.css');

  assert.match(component, /HANDHELD_FINISHES = \['black', 'silver', 'white'\]/);
  assert.match(component, /HANDHELD_SEEK_SECONDS = 10/);
  assert.match(component, /HANDHELD_SKIP_SECONDS = 30/);
  // A YouTube link is the disc, wired for messages; the frame is the source of truth.
  assert.match(component, /src=\{youTubeDisc\(youTube, [^)]+\)\}/);
  assert.match(component, /onLoad=\{onFrameLoad\}/);
  assert.match(component, /if \(event\.origin !== YOUTUBE_ORIGIN \|\| !frame\.current \|\| event\.source !== frame\.current\.contentWindow\) return;/);
  assert.match(component, /if \(report\.playerState !== undefined\) setMode\(modeOf\(report\.playerState\)\)/);
  assert.match(component, /if \(report\.videoData\?\.title\) setHeard\(report\.videoData\.title\)/);
  // The console's keys, each named for what it does.
  for (const key of ['Home', 'Volume down', 'Volume up', 'Display brightness', 'Sound', 'Select: show readout', 'Triangle: show readout', 'Circle: stop', 'Square: repeat']) {
    assert.match(component, new RegExp(`aria-label="${key}"`), key);
  }
  assert.match(component, /aria-label=\{mode === 'play' \? 'Start: pause' : 'Start: play'\}/);
  assert.match(component, /aria-label=\{mode === 'play' \? 'Cross: pause' : 'Cross: play'\}/);
  assert.match(component, /aria-pressed=\{repeat\}/);
  assert.match(component, /aria-pressed=\{!muted\}/);
  assert.match(component, /role="status" aria-live="polite"/);
  // Home puts the wave back without unloading the disc.
  assert.match(component, /<div className="handheld__embed" hidden=\{home\}>/);

  // Measured in 720ths of the width, in the real thing's proportions: 170 by 74 millimetres.
  assert.match(css, /--handheld-unit: calc\(100cqw \/ 720\)/);
  assert.match(css, /aspect-ratio: 720 \/ 327/);
  assert.match(css, /\.handheld__plate \{[\s\S]+?width: calc\(500 \* var\(--handheld-unit\)\);\s+height: calc\(272 \* var\(--handheld-unit\)\)/);
  assert.match(css, /\.handheld__screen \{[\s\S]+?width: calc\(403 \* var\(--handheld-unit\)\);\s+height: calc\(227 \* var\(--handheld-unit\)\)/);
  assert.match(css, /\.handheld__screen \{[\s\S]+?overflow: hidden/);
  assert.match(css, /filter: brightness\(var\(--handheld-brightness\)\)/);
  // The player is cropped like the Polaroid's, and the plate's reflection crosses it.
  assert.match(css, /\.handheld__embed \.handheld__player \{\s+--handheld-chrome: 80px;\s+--handheld-player-scale: 0\.5;/);
  assert.match(css, /\.handheld__plate::after \{[\s\S]+?112deg/);
  assert.match(css, /\.handheld\[data-finish='silver'\] \{/);
  assert.match(css, /prefers-reduced-motion: reduce\) \{\s+\.handheld__wave-band \{\s+animation: none/);
});

test('Player wire: the disc address, the messages, the clock and the volume steps', async () => {
  const { YOUTUBE_ORIGIN, clock, command, discTitle, listening, modeOf, parseMessage, stepVolume, youTubeDisc } = await import(
    '../src/components/Handheld/player.ts'
  );

  const disc = new URL(youTubeDisc('iVZmXA27KfA', 'http://localhost:6006'));
  assert.equal(disc.origin, YOUTUBE_ORIGIN);
  assert.equal(disc.pathname, '/embed/iVZmXA27KfA');
  assert.equal(disc.searchParams.get('enablejsapi'), '1');
  assert.equal(disc.searchParams.get('origin'), 'http://localhost:6006');
  assert.equal(disc.searchParams.get('mute'), '1');
  assert.equal(disc.searchParams.get('playlist'), 'iVZmXA27KfA');
  assert.equal(new URL(youTubeDisc('iVZmXA27KfA', '', { muted: false, loop: false })).searchParams.get('mute'), '0');

  assert.deepEqual(listening('1'), { event: 'listening', id: '1', channel: 'widget' });
  assert.deepEqual(command('seekTo', [30, true], '1'), { event: 'command', func: 'seekTo', args: [30, true], id: '1', channel: 'widget' });

  assert.equal(modeOf(1), 'play');
  assert.equal(modeOf(3), 'play');
  assert.equal(modeOf(2), 'pause');
  assert.equal(modeOf(5), 'pause');
  assert.equal(modeOf(-1), 'pause');
  assert.equal(modeOf(0), 'end');

  assert.deepEqual(parseMessage('{"event":"onStateChange","info":1}'), { event: 'onStateChange', info: 1 });
  assert.equal(parseMessage('{"nope":true}'), undefined);
  assert.equal(parseMessage('not json'), undefined);
  assert.equal(parseMessage({ event: 'x' }), undefined);

  assert.equal(clock(undefined), '-:--');
  assert.equal(clock(Number.NaN), '-:--');
  assert.equal(clock(0), '0:00');
  assert.equal(clock(61.9), '1:01');
  assert.equal(clock(523), '8:43');
  assert.equal(clock(3725), '1:02:05');

  assert.equal(stepVolume(0.8, 1), 0.9);
  assert.equal(stepVolume(0.95, 1), 1);
  assert.equal(stepVolume(0.05, -1), 0);
  assert.equal(stepVolume(0.7, -1), 0.6);

  assert.equal(discTitle('/assets/video/live_set-one.mp4'), 'live set one');
  assert.equal(discTitle('https://cdn.example/What%20to%20Do.webm?x=1'), 'What to Do');
  assert.equal(discTitle(''), 'DISC');
});
