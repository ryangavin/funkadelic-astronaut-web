// Makes the press-kit site's lighter media in assets/ from the band's originals. Rerun it when an original changes:
// `node scripts/generate-media.mjs` (needs ffmpeg with libx264 and ImageMagick 7's `magick` on the PATH). The outputs
// are committed, so the build itself never needs either tool.
//
// - assets/epk/live-loop.mp4 (tablets and desktops, 960×540) and live-loop-640.mp4 (phones, 640×360): the hero loop,
//   0:26 to 0:44 of assets/epk/nyack-set.mp4 with no audio. The cut starts and ends on the same frames as before, so it
//   still loops seamlessly. H.264 High, yuv420p, 30 fps, x264 veryslow at CRF 30, moov atom first so it starts playing
//   while it downloads.
// - assets/epk/<id>-portrait-450.webp and <id>-portrait-675.webp: the band portraits at 450×300 and 675×450 for phones
//   (a 412 px phone at DPR 1.75 draws them ~380 CSS px wide, ~665 device px). The 900×600 copies beside them are
//   assets/<id>-portrait.webp (1800×1199) squeezed to 900×600 at webp quality 80; the smaller sizes are made the same
//   way, so every size shows exactly the same picture. The 900s are left as they are.
// - assets/festival-map-1010.webp and festival-map-505.webp: the page background, from assets/festival-map.png. It sits
//   under a dark veil and is upscaled to cover the page, so quality 70 reads the same as the original 92. Phones see
//   only thin gutters of it, upscaled about 4×, so their 505 copy goes down to quality 20.
// - assets/epk/live-poster.webp: the live video's poster (the frame at 0:30), re-encoded at quality 43 from its master,
//   assets/epk/live-poster-master.webp (the poster as first made): 31% smaller, SSIM 0.98 against it.
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const asset = name => resolve(root, 'assets', name);
const run = (tool, ...args) => execFileSync(tool, args, { stdio: ['ignore', 'ignore', 'inherit'] });
const report = file => console.log(`${relative(root, file)}: ${statSync(file).size.toLocaleString('en')} bytes`);

/** The hero loop's place in the full set: start and length in seconds. */
const LOOP_START = '26';
const LOOP_LENGTH = '18';

/** The hero loop at `width`×`height`, written to `file`. */
const loop = (width, height, file) => {
  run('ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-ss', LOOP_START, '-t', LOOP_LENGTH,
    '-i', asset('epk/nyack-set.mp4'), '-an', '-vf', `scale=${width}:${height}`, '-r', '30',
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'veryslow', '-crf', '30', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', file);
  report(file);
};

loop(960, 540, asset('epk/live-loop.mp4'));
loop(640, 360, asset('epk/live-loop-640.mp4'));

for (const id of ['ryan', 'kevin', 'sam']) {
  for (const [width, height] of [[450, 300], [675, 450]]) {
    const file = asset(`epk/${id}-portrait-${width}.webp`);
    run('magick', asset(`${id}-portrait.webp`), '-resize', `${width}x${height}!`, '-quality', '80', file);
    report(file);
  }
}

/** The festival map at `size` (or its own 1010×1558 when none) and webp `quality`, written to `file`. */
const map = (size, quality, file) => {
  run('magick', asset('festival-map.png'), ...(size ? ['-resize', `${size}!`] : []),
    '-quality', quality, '-define', 'webp:method=6', file);
  report(file);
};

map(null, '70', asset('festival-map-1010.webp'));
map('505x779', '20', asset('festival-map-505.webp'));

// The poster's master is the original 1280×720 frame, kept as assets/epk/live-poster-master.webp (never published:
// the site imports only live-poster.webp).
const poster = asset('epk/live-poster.webp');
run('magick', asset('epk/live-poster-master.webp'), '-quality', '43', '-define', 'webp:method=6', poster);
report(poster);
