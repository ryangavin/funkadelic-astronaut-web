// Makes the site's icons and share image in public/ from the band's existing artwork. Rerun it when the artwork
// changes: `node scripts/generate-icons.mjs` (needs ImageMagick 7's `magick` on the PATH). The outputs are committed,
// so the build itself never needs ImageMagick.
//
// - The icon is the astronaut's helmet, cropped from assets/astronaut-transparent.png onto the site's background
//   colour: favicon.ico (16, 32, 48), favicon.svg (the same art inside a rounded square), apple-touch-icon.png (180),
//   icon-192.png and icon-512.png for site.webmanifest.
// - share.jpg is the 1200×630 Open Graph / X preview: assets/performance.jpg (the band on stage) cut to 1.91:1 from
//   the top, so the players' heads stay in when a platform shows it.
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const asset = name => resolve(root, 'assets', name);
const out = name => resolve(root, 'public', name);
const magick = (...args) => execFileSync('magick', args, { stdio: 'inherit' });

/** The site's background, as index.html's theme-color and body background give it. */
const BACKGROUND = '#121420';

/** The helmet and headphones in the 1024×1536 astronaut art, as a square: width x height + left + top. */
const HELMET = '900x900+40+40';

/** The helmet on the site's background, at `size` pixels square, written to `file`. */
const icon = (size, file) =>
  magick(asset('astronaut-transparent.png'), '-crop', HELMET, '+repage', '-background', BACKGROUND, '-flatten',
    '-resize', `${size}x${size}`, '-strip', file);

icon(180, out('apple-touch-icon.png'));
icon(192, out('icon-192.png'));
icon(512, out('icon-512.png'));

// favicon.ico carries the three sizes browsers ask for, all 32-bit, scaled from one large copy.
const icoArt = out('favicon-ico.tmp.png');
icon(256, icoArt);
magick(icoArt, '-define', 'icon:auto-resize=48,32,16', out('favicon.ico'));
rmSync(icoArt);

// favicon.svg: browsers that take an SVG icon get the art in a rounded square, which sits better in a tab strip.
const svgArt = out('favicon-svg.tmp.png');
icon(96, svgArt);
const art = readFileSync(svgArt).toString('base64');
rmSync(svgArt);
writeFileSync(out('favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <clipPath id="tile"><rect width="96" height="96" rx="20"/></clipPath>
  <image clip-path="url(#tile)" width="96" height="96" href="data:image/png;base64,${art}"/>
</svg>
`);

magick(asset('performance.jpg'), '-crop', '1920x1008+0+0', '+repage', '-resize', '1200x630!', '-strip',
  '-quality', '85', '-interlace', 'JPEG', out('share.jpg'));
