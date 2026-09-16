const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Stage lays a page out at 1440 design pixels and zooms it as one piece', () => {
  const component = read('src/components/Stage/Stage.tsx');
  const css = read('src/components/Stage/Stage.css');

  assert.match(component, /export const STAGE_WIDTH = 1440;/);
  assert.match(component, /new ResizeObserver\(measure\)/);
  assert.match(component, /Math\.min\(maxScale, Math\.max\(minScale, element\.clientWidth \/ width\)\)/);
  assert.match(component, /'--stage-scale': scale/);
  assert.match(component, /'--stage-height': height \? `\$\{height\}px` : 'auto'/);
  assert.match(css, /\.stage__sheet \{[\s\S]+?width: var\(--stage-width\);[\s\S]+?zoom: var\(--stage-scale\);/);
  assert.match(css, /\.stage \{[\s\S]+?overflow-x: auto;/);
});

test('Home is one 11 x 17 poster on a Stage: the festival map edge to edge, everything pinned on it', () => {
  const page = read('src/pages/Home/Home.tsx');
  const stories = read('src/pages/Home/Home.stories.tsx');

  assert.match(page, /export const HOME_RATIO = 17 \/ 11;/);
  assert.match(page, /export const HOME_HEIGHT = Math\.round\(HOME_WIDTH \* HOME_RATIO\);/);
  assert.match(page, /<Stage className=\{`home \$\{className\}`\} style=\{style\} height=\{HOME_HEIGHT\}/);
  assert.match(page, /<PaperSheet height=\{HOME_HEIGHT\} surround=\{0\} imageSrc=\{festivalMap\} imageSize="cover" imagePosition="center"/);
  assert.match(page, /<h1 className="home__title">/);
  assert.match(page, /export const HOME_LAYOUT = \{[\s\S]+?astronautX: 1112,[\s\S]+?saturnWidth: 400,\n\};/);
  for (const piece of ['pressKit', 'band', 'tour', 'booking', 'funk', 'astro', 'listen']) for (const axis of ['X', 'Y', 'Rotation', 'Scale']) assert.match(page, new RegExp(`  ${piece}${axis}: -?[\\d.]+,`));
  for (const piece of ['astronaut', 'dossier', 'ticket', 'olives', 'nyack', 'saturn']) for (const axis of ['X', 'Y', 'Rotation', 'Width']) assert.match(page, new RegExp(`  ${piece}${axis}: -?[\\d.]+,`));
  assert.match(page, /<PaperStrip paddingX=\{22\} paddingY=\{12\}>\s+<div className="home__stamps home__stamps--hero">/);
  assert.match(page, /export const TOUR_DATES: \(TourPassProps & \{ color: TourPassColor \}\)\[\] = \[\s+\{ \.\.\.OLIVES_TOUR_PASS_PROPS, color: 'red' \}/);
  assert.match(page, /<AdmissionTicket \{\.\.\.TOUR_ADMISSION_TICKET_PROPS\} rotation=\{0\} \/>/);
  assert.match(page, /<TourPass \{\.\.\.pass\} color=\{color\} rotation=\{0\} \/>/);
  assert.match(page, /<Pin x=\{at\.astronautX\} y=\{at\.astronautY\} width=\{at\.astronautWidth\} rotation=\{at\.astronautRotation\}>\s+<Astronaut \/>/);
  assert.match(read('src/pages/Home/Home.stories.tsx'), /args: \{ \.\.\.HOME_LAYOUT, mapOpacity: 1 \}/);
  assert.match(page, /<Pin x=\{at\.dossierX\} y=\{at\.dossierY\} width=\{at\.dossierWidth\}>/);
  assert.match(page, /<BandDossier rotation=\{at\.dossierRotation\} \/>/);
  assert.match(page, /<Pin x=\{0\} y=\{HOME_HEIGHT - HOME_FOOTER_HEIGHT\} width=\{HOME_WIDTH\}>\s+<footer[^>]*>\s+<Ribbon>/);
  assert.match(page, /LISTEN_INKS: Partial<Record<SocialPlatform, string>> = \{ applemusic: 'red', spotify: 'green', youtube: 'red', deezer: 'purple' \}/);
  assert.match(page, /export const LISTEN_LINKS: HomeLink\[\] = \[/);
  assert.ok(fs.existsSync(path.join(root, 'assets', 'festival-map.webp')));
  assert.match(stories, /title: 'Pages\/Home'/);
  for (const name of ['laptop', 'design', 'wide', 'tablet', 'phone']) assert.match(stories, new RegExp(`${name}: \\{ name: '`));
});
