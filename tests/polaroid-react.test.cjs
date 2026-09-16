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
  assert.match(component, /<figure className="polaroid__card" data-plain=/);
  assert.match(component, /video\?: string/);
  assert.match(component, /<video ref=\{clip\} className="polaroid__photo" src=\{video\} poster=\{src\} muted autoPlay loop playsInline/);
  assert.match(component, /element\.muted = true/);
  // A YouTube link embeds the player alone, sized to cover the window with its title bar and logo cropped away, taking the pointer.
  assert.match(component, /\{youTube \? \(\s+<div className="polaroid__embed">\s+<iframe\s+className="polaroid__player"\s+src=\{youTubePreview\(youTube\)\}/);
  assert.match(component, /src\?: string;/);
  assert.match(component, /allow="autoplay; encrypted-media; picture-in-picture"\s+allowFullScreen/);
  assert.doesNotMatch(component, /tabIndex=\{-1\}/);
  assert.match(css, /\.polaroid__embed \{\s+--polaroid-chrome: 80px;\s+--polaroid-player-scale: 0\.5;[\s\S]+?container-type: size/);
  // Laid out larger by the scale and scaled back down, so YouTube's fixed-pixel buttons shrink while the picture still covers.
  assert.match(css, /\.polaroid__player \{[\s\S]+?width: calc\(max\(100%, 100cqh \* 16 \/ 9\) \/ var\(--polaroid-player-scale\)\);\s+height: calc\(max\(100cqh, 100cqw \* 9 \/ 16\) \/ var\(--polaroid-player-scale\) \+ 2 \* var\(--polaroid-chrome\)\);\s+translate: -50% -50%;\s+scale: var\(--polaroid-player-scale\);/);
  assert.doesNotMatch(css, /\.polaroid__player \{[\s\S]+?pointer-events: none/, 'a click on the picture plays or pauses');
  assert.ok(!fs.existsSync(path.join(root, 'src/components/Polaroid/stream.ts')), 'the HLS player is gone: the live set is embedded from YouTube');
  assert.match(read('src/sections/BandDossier/bandMembers.tsx'), /LIVE_SET: LiveSet = \{\s+video: WHAT_TO_DO,/);
  assert.match(read('src/sections/BandDossier/bandMembers.tsx'), /WHAT_TO_DO = 'https:\/\/www\.youtube\.com\/watch\?v=iVZmXA27KfA'/);
  assert.match(component, /<img className="polaroid__photo" src=\{src\} alt=\{alt\} \/>/);
  assert.match(component, /<figcaption className="polaroid__caption">/);

  // Real pack proportions, in 720ths of the width.
  assert.match(css, /--polaroid-unit: calc\(100cqw \/ 720\)/);
  assert.match(css, /--polaroid-ratio: 720 \/ 875;/);
  assert.match(css, /--polaroid-pad-bottom: 180;/);
  assert.match(css, /\[data-format='wide'\] \{[\s\S]+?--polaroid-ratio: 720 \/ 573;/);
});

test('YouTube links resolve to a muted, looping, privacy-enhanced player', async () => {
  const { youTubeId, youTubePreview } = await import('../src/components/Polaroid/embed.ts');

  for (const url of [
    'https://www.youtube.com/watch?v=iVZmXA27KfA',
    'https://www.youtube.com/watch?v=iVZmXA27KfA&t=12s',
    'https://m.youtube.com/watch?feature=share&v=iVZmXA27KfA',
    'https://youtu.be/iVZmXA27KfA?si=abc',
    'https://www.youtube-nocookie.com/embed/iVZmXA27KfA',
    'https://www.youtube.com/shorts/iVZmXA27KfA',
  ]) {
    assert.equal(youTubeId(url), 'iVZmXA27KfA', url);
  }
  assert.equal(youTubeId('https://video.squarespace-cdn.com/content/v1/x/playlist.m3u8'), undefined);
  assert.equal(youTubeId('clip.mp4'), undefined);
  assert.equal(youTubeId('https://www.youtube.com/funkadelicastronaut'), undefined);

  const preview = new URL(youTubePreview('iVZmXA27KfA'));
  assert.equal(preview.origin + preview.pathname, 'https://www.youtube-nocookie.com/embed/iVZmXA27KfA');
  assert.deepEqual(Object.fromEntries(preview.searchParams), {
    autoplay: '1',
    mute: '1',
    loop: '1',
    playlist: 'iVZmXA27KfA',
    controls: '0',
    playsinline: '1',
    rel: '0',
    iv_load_policy: '3',
  });
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
