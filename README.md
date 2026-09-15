# Funkadelic Astronaut EPK

Use `npm install`, then `npm run dev` to serve the existing site at http://127.0.0.1:4173/ with Vite hot reload. CSS updates appear in place; HTML and classic script changes reload automatically. Never use Python’s HTTP server for the development preview.

## React conversion

The incremental React conversion lives under `src/` while the current static site remains the default entry. Storybook is the workshop for it: http://localhost:6006/ runs it with accessibility, generated documentation, and the MCP addon at `/mcp`. Compositions are written as React and mirrored by stories; there is no in-browser page editor.

The first real React component is the complete pink Olive’s tour pass. Its editable event fields, portrait, and ticket state are documented in Storybook.

Layout blocks live alongside the content blocks. **Paper sheet** is the page container: the site's wheat stock inside a dark ink surround, with the torn-paper edging from `src/styles/torn-edge.css`, which any positioned element can reuse by adding the `torn-edge` class. An optional `imageSrc` prints a picture onto the stock underneath the content, multiplied like ink the way the festival sketch sits behind the home page hero; `imageSize`, `imagePosition`, `imageOpacity`, and `imageContrast` set the crop and fade (defaults match the hero treatment). **Ribbon** (`src/components/Ribbon/Ribbon.tsx`) is a block topped by one of the site's wavy seams: colour, paper and ink strokes along the same cosine wave app.js draws, with the block's own fill clipped to the wave so the paper above shows through the crests. Its defaults are the home page footer's purple ribbon; frequency, amplitude, tilt, and x/y shift use the same units as the old ribbon studio. **Pin** places whatever it wraps at x, y, width, and rotation values measured in sheet units, where the sheet is 1440 units wide, so a composition scales uniformly with the page instead of reflowing.

Typography is shared through `src/styles/fonts.css`: Balsamiq Sans is the body token, Modak is the display token, and Caveat is the handwritten token used by the tour pass. These locally bundled font faces are loaded by Storybook without importing the legacy homepage’s global CSS.

**Astronaut** (`src/components/Astronaut/Astronaut.tsx`) is the complete printed astronaut cutout, including its aged stock, torn silhouette, exposed fibers, and shadow. It composes `PaperSheet` with an optional `shape` (path, reference width/height, and paper margin); shaped sheets use their own aspect ratio and omit the rectangular surround. Size it through its parent or a `Pin`. Storybook’s **Illustrations / Astronaut** includes the original, tilted and white-stock variants, multiple sizes/instances, and a Paper Sheet composition. The homepage continues to use its existing rendering. The component has no automatic motion; its `rotation` prop tilts the whole cutout.

**Jitter** (`src/behaviors/Jitter/Jitter.tsx`) composes around visual components: `<Jitter preset="cutout"><Astronaut rotation={-6} /></Jitter>`. The `cutout` and `print` presets match the existing poster strengths; both default to 150 ms steps. Optional `x`/`y` overrides are maximum pixel displacement, `rotation` is maximum angular displacement, and `cadenceMs` controls the interval (lower is faster, minimum 16 ms). Use `activation="hover-focus"` for pointer hover or keyboard-visible focus on the wrapper or a descendant; otherwise motion is continuous. `enabled={false}` resets it. Put static positioning and tilt on the wrapper or child: the separate motion layer preserves them. Use a real link/button for interactive content; the wrapper does not add a tab stop by default. Motion stops and resets for reduced-motion preferences, hidden pages, inactive interactions, and unmounting. Each instance updates its own DOM layer without per-frame React renders. The underlying `attachJitter` also takes an array of layers and moves each one independently on the same cadence, which is how Wordmark jitters its letters. **Behaviors / Jitter** includes tunable labels, independent instances, and an Animated Astronaut story. This does not migrate the legacy site's motion.

**PaperStrip** (`src/components/PaperStrip/PaperStrip.tsx`) wraps arbitrary content in a pale paper scrap. It composes `PaperSheet`/`ShapedPaper`, measures the content to fit its backing, and exposes stock, horizontal/vertical padding, and static rotation. Text wraps within the available parent width. The `pale` stock uses the legacy scrap aging colors. The surface shares its torn edges, fibers, speckles, and shadow with the existing shaped paper implementation.

**Wordmark** (`src/components/Wordmark/Wordmark.tsx`) prints arbitrary `children` on one PaperStrip. Use plain text, composed markup, or supplied SVG content; control the ink color, font size, letter spacing, outline, shadow, paper stock, padding, and static tilt. Content is real accessible markup, and naturally wraps within its parent. HTML lettering uses adjusted Modak ascent/descent metrics and compensates for the downward ink shadow so the visible letters sit centrally on the paper; supplied SVG artwork keeps its own explicit baseline and original font metrics. For example: `<Wordmark inkColor="#639ec8">LIVE TONIGHT</Wordmark>`. Motion of the whole strip stays outside: `<Jitter preset="print"><Wordmark>GOOD MUSIC</Wordmark></Jitter>`. Motion of the individual letters is the `jitter` prop: `true` uses the `print` preset, or pass Jitter options (`preset`, `x`, `y`, `rotation`, `cadenceMs`, `activation`, `enabled`). Every character, including text inside supplied markup, becomes its own glyph displaced independently on one shared cadence, like misregistered print; words never break between letters, each text run keeps a visually hidden copy so assistive technology reads it as words rather than letters, and supplied `svg`/`img` artwork moves as one print rather than splitting. Hover/focus activation watches the whole strip, so a link or button inside the content works. Jittered letters are inline blocks, which drops font kerning between them while the prop is on. The reusable component contains no band name or two-line layout. **Brand / Wordmark → Hero Reference** composes two generic instances to reproduce FUNKADELIC / ASTRONAUT; the words, custom SVG lettering geometry, and arrangement live only in that story. Other stories demonstrate editable text, mixed icon/text content, multiple widths/instances, and jittered letters, continuous and on hover/focus of a link inside the strip.

**AdmissionTicket** (`src/components/AdmissionTicket/AdmissionTicket.tsx`) is the hand-cut general-admission ticket from the live section heading. Every printed field is a prop (presenter, title, subtitle, season, location, detail, stub section/stamp/serial, rail copy, price and price serial), plus `rotation` and a `color` for the rail, stamp and price ink. The stock, fibers, age wash and worn-ink filter are scoped per instance so many tickets can share a page. **Components / Admission Ticket** covers the site heading, a single-show variant, tilt, small size, inks and a fanned stack.

**SocialIcon** (`src/components/SocialIcon/SocialIcon.tsx`) is a platform mark printed like the wordmark: a black silhouette underneath, the glyph in ink on top with a black stroke tucked under its fill, a hard offset shadow, and the worn-ink texture. Marks live in `platforms.ts` (Instagram, Facebook, Bandsintown, Apple Music, Spotify, YouTube, Deezer, Bandcamp). Props are `platform`, `ink` (named site ink or any colour), `size`, `worn` and `label`.

**Polaroid** (`src/components/Polaroid/Polaroid.tsx`) is an instant print: a smooth coated card with a recessed photo window and the thick bottom border you write on, in the classic square pack or the wide landscape pack. The photo is cropped to a `focus`, and `fade` sets how far the chemistry has gone, from true blacks to lifted, vignetted, cyan-shadowed dye. `caption` and `note` are marker handwriting on the border, `tape` adds a masking-tape strip, and `rotation` tilts the print. **Components / Polaroid** covers the member print, the wide pack, fresh and faded prints, the three members fanned, and a print pinned over the festival sketch.

Foundations sit under `src/foundations` and Storybook's **Foundations** section. **Cutout Ink** (`src/styles/cutout-ink.css`) is the wordmark's fill-stroke-shadow treatment as one stylesheet with `--cutout-ink`, `--cutout-shadow-x/y` and `--cutout-stroke`; `.cutout-ink--text` applies it to type and `.cutout-ink--svg` with `.cutout-ink__base`/`.cutout-ink__fill` applies it to artwork. **Distressed** (`src/foundations/Distressed/Distressed.tsx`) is the ink-on-paper texture: wrap anything in `<Distressed>` for the worn letterpress finish, or use the exported `PrintInkFilter` inside an SVG's defs.

Run `npm run build` to type-check and produce the application bundle, `npm run build-storybook` to verify the component library, and `npm test` for the existing behavior suite.

## Content and assets

- Official biography / photos: https://www.funkadelicastronaut.com/band
- Booking email: https://www.funkadelicastronaut.com/
- Current trio confirmed by https://funkadelicastronaut.bandcamp.com/
- Performance: official homepage Squarespace-hosted HLS video, duration 522 seconds. The stable playlist URL is requested on play; expiring segment URLs are never persisted. HLS.js (Apache 2.0, license in assets) loads only on demand, with native HLS as the fallback when Media Source Extensions are unavailable.
- Tour is presented as a sparse festival-day timetable: two bookings make a two-day board, three make a three-day board, and cards stack on phones. The current three-card design preview clearly labels the Olive’s and bowling-alley records as sample/fictional data; the September 26, 2026 Nyack Neighborhood Music & Arts Festival entry is user-verified and links to the organizer’s Instagram schedule. Keep the reusable empty-state template when no real dates exist, and never present placeholder details as announced shows.
- Photos are genuine band media reused from the official site; no generated people. Photographer credits and high-resolution press downloads were not published with these assets. Contact the band for those materials.
- Modak is served through the Google Fonts CDN under the SIL Open Font License. Font specimens comparing Chicle, Modak and Shrikhand are preserved in `output/font-specimens.html`.
- Astronaut generated using built-in imagegen, then a transparency edit. See `output/astronaut-prompt.md`. Final web asset: `assets/astronaut.webp`.
- The approved concepts remain untouched in `output/epk-directions`. None are rendered by the website.

## Behavior

`app.js` derives clip paths and all seam bands from the same Bézier geometry on resize. Media is overscanned and translated from -32 to +32px on desktop / -14 to +14px on mobile according to each section's position in the viewport; below center is positive, above center negative. Reduced-motion disables translation and smooth scrolling. Text, section boundaries and controls do not translate.

The full performance uses one inline video element and one HLS attachment. When the Listen scene approaches the viewport, it may load the stream and autoplay it muted as source frames for the printed ambient canvas. Explicit Play reuses that attachment, seeks to the beginning, disables looping, unmutes, and reveals the unfiltered native playback path with custom controls. The official-site fallback remains visible if the external stream is unavailable.

## Publishing

Repository: https://github.com/ryangavin/funkadelic-astronaut-web

Public site: https://ryangavin.github.io/funkadelic-astronaut-web/

Pushes to `main` run the full Node test suite and deploy through `.github/workflows/pages.yml`. No production build is required. The workflow stages both HTML pages, CSS, runtime JavaScript (including the ribbon studio, living video and poster motion), and `assets/`. All local asset paths are relative so the site works under the repository subpath. Dependencies, secrets, deployment staging, and local `output/` design/QA references are excluded from Git; only runtime files are included in the Pages artifact.

The current home-page tuning panel is **Ribbons · D**, which replaces typography controls while preserving accepted typography. Hero → Video defaults in `app.js`: frequency 1.38, amplitude 27.4, rotation 0, horizontal offset 0.5, vertical offset 6.3. The typography notes below document the earlier studio workflow.

## Gallery and print treatment

Learn contains a manual overview/member gallery. Its verified member content and photo mappings live in `app.js`; image decoding, request versioning, live announcements and keyboard controls keep selection consistent. There is no auto-rotation. Footer profiles are the Instagram, YouTube and Facebook links from the official band homepage.

Band and Tour continue the header's festival illustration with independent crops from the same asset: upper stages/camp behind Band, and the lower pond/bassist/astronaut scene behind Tour. The Band overview is illustration-only; each member selection places its existing press-kit portrait in a responsive, warm-paper Polaroid above that world. The Polaroid frame and individual biography both use the hero's shared `PaperCutout` scrap treatment for displaced torn edges, exposed fibers, aged stock, flecks and print wear. The photo window retains its faded gloss and inset depth, while the thicker lower margin carries the member's name and role. Biography copy is plain Comic Sans-style ink on a gently rotated scrap; the overview copy remains directly on the illustrated field. Polaroids slide fully across the paper with a brief lift and settle; compact biography copy follows more quietly and leaves room for larger edge navigation.

The inline `printed-ink` SVG filter textures only display lettering. The repeating paper SVG is decorative and cannot intercept input. `overflow:clip` prevents overscanned media from becoming an internally scrollable focus container. Run the six focused checks with `node --test tests/*.test.cjs`.

All design-critical typography is served locally: Modak for poster display type, Balsamiq Sans as the open-licensed Comic Sans-style body face, and Pacifico, Caveat and Sacramento for the three live-text member signatures. See `docs/fonts.md` for file provenance and licenses.

## Typography studio

Press **D** or click **Type · D** to open the tuning panel on either page. Escape closes it; hotkeys ignore text fields and select menus. Select a text group and an all-screens, desktop (761px+), or mobile (up to 760px) scope. Tune font family, size, tracking, line height, color, offsets, rotation and width/height; section headings also expose individual glyph width and margins, while the SVG title exposes text length. The whole wordmark group controls its position and scale. Modak has a single font weight.

Drafts persist locally per page. Blank values inherit the site or all-screens adjustment. Preview on/off compares with the original; reset buttons clear a field, group/scope, or the entire draft. **Export JSON** downloads `funkadelic-typography.json`; **Copy JSON** offers clipboard or manual copying. Send this JSON back to implement defaults. It contains the viewport, scoped adjustments, exact CSS selectors/declarations and SVG attribute overrides. Font sizes are explicit pixels (SVG units for SVG text), so choose a responsive scope when needed. Position/scale adjustments compose with existing transforms. Include `typography-debug.js` when publishing.

The panel title is a drag handle; focus it and use arrow keys for keyboard movement. Panel opacity is adjustable, with position and opacity saved separately from exported typography. Global font groups apply to all text, display lettering, or reading text, and individual text groups can override them. Additional Google Fonts load only when selected; font stylesheet URLs are included in the export. Locally installed font options use their listed fallbacks when unavailable.

The September 12 typography export is now the default: Modak for display lettering and wordmark translate (-15px, -56px), rotation -2deg, and scale (1.04, 1.35) at every viewport size. Other font families tried in the studio are not preloaded. Existing drafts still override defaults; Preview off or Reset reveals the adopted styling.


## Style organization

`style.css` imports ordered layers from `styles/`: `base.css` holds baseline layout, `poster.css` holds the established poster treatment, `sections.css` holds the current section compositions, and `cutout.css` owns the shared cutout typography. Asset URLs in these sheets are relative to `styles/`. `cutout-type.js` supplies the same glyph structure to headings and dynamic labels. Keep visual cutout changes in the shared layer; section rules should control size and placement.

The HTML remains directly served static markup, and behavior is split into focused JavaScript files. Publishing is currently on hold.

### Section composition references

About and Tour use a shared `--composition-unit`: a 1440px larger-screen reference and a 390px compact reference, switching at 760px. Their heights, copy, gutters, gallery controls, and Tour footer scale together. Gallery changes do not resize the section. Ribbon height tracks page width, and gallery image focal positioning tracks section height. Intentional wave cropping remains part of the composition.

### Ambient video tuning

The landing scene samples the original 522-second performance at 10 displayed fps from the same muted media element used by explicit playback. A browser-native SVG levels pass renders those frames in restrained black and white. Explicit Play stops the ambient cadence, seeks the same stream to zero, and fades into unfiltered playback with audio. Open **Layout studio → Ambient video treatment** to tune brightness, contrast, black/white points, grain and cadence, or select a local clip discovered from `assets/ambient/` after refresh. Defaults stay baked in site code. See [the ambient treatment guide](docs/performance-print.md) for adding clips, static publishing, draft behavior and QA.
