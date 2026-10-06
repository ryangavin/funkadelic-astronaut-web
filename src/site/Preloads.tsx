import { preload } from 'react-dom';
import paperDarkFlecks from '../../assets/paper-dark-flecks.svg';
import archivo from '../../assets/fonts/archivo/Archivo-site.woff2';
import bowlbyOne from '../../assets/fonts/bowlby-one/BowlbyOne-site.woff2';
import newsreader from '../../assets/fonts/newsreader/Newsreader-site.woff2';
import { NYACK_SET } from '../content/liveSet';

/**
 * Asks the browser early for what the first screen paints: the nameplate's
 * face (Bowlby One), the faces of the headline bar and the lede (Archivo and
 * Newsreader: arriving before the first paint, they don't reflow the page
 * under the reader), the paper's flecks (Weathered.css; the largest thing a
 * phone paints first) and the live set's poster. The stylesheet is inline
 * (scripts/prerender.mjs), so without these the browser would find the fonts
 * only once it lays the page out. React emits these as `<link rel="preload">`
 * in the pre-rendered HTML (scripts/prerender.mjs moves them into the head).
 * Renders nothing.
 *
 * Only the build's server render asks (`import.meta.env.SSR`): in the browser
 * the files are already coming, and the client build writes their URLs
 * absolute where the HTML has them relative, so React would not recognise its
 * own tags and would ask again. A preload is not part of the rendered tree, so
 * skipping it can't make hydration mismatch. The e2e tests check the head.
 */
export function Preloads() {
  if (!import.meta.env.SSR) return null;
  for (const font of [bowlbyOne, archivo, newsreader]) preload(font, { as: 'font', type: 'font/woff2', crossOrigin: '' });
  preload(paperDarkFlecks, { as: 'image', fetchPriority: 'high' });
  // Early, but not ahead of the fonts and the flecks: a video's poster isn't found by the browser's preload scanner.
  preload(NYACK_SET.poster, { as: 'image' });
  return null;
}
