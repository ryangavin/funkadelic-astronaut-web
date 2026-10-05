# The legacy poster

The original vanilla-JS poster site lives in `legacy/`: `classic.html`, `press-kit.html`, its runtime scripts (`app.js`, `living-video.js`, `performance-print.js`, `layout-studio.js`, `typography-debug.js` and the rest), `style.css`, `styles/`, `scripts/generate-ambient-sources.cjs` and its tests in `tests/` (`npm run test:legacy`, also run by `npm test`). It is kept for reference but not deployed and not served by `npm run dev`; `/classic.html` and `/press-kit.html` on the public site are noindex redirect stubs to `/` (`public/classic.html`, `public/press-kit.html`). Its React port is **Experience / Poster** (`src/experience/Poster/`, see [experience.md](experience.md)). Unless noted, the paths below are inside `legacy/`.

## Behavior

`app.js` derives clip paths and all seam bands from the same Bézier geometry on resize. Media is overscanned and translated from -32 to +32px on desktop / -14 to +14px on mobile according to each section's position in the viewport; below center is positive, above center negative. Reduced-motion disables translation and smooth scrolling. Text, section boundaries and controls do not translate.

The full performance uses one inline video element and one HLS attachment. When the Listen scene approaches the viewport, it may load the stream and autoplay it muted as source frames for the printed ambient canvas. Explicit Play reuses that attachment, seeks to the beginning, disables looping, unmutes, and reveals the unfiltered native playback path with custom controls. The official-site fallback remains visible if the external stream is unavailable.

The home-page tuning panel was **Ribbons · D**, which replaced typography controls while preserving accepted typography. Hero → Video defaults in `app.js`: frequency 1.38, amplitude 27.4, rotation 0, horizontal offset 0.5, vertical offset 6.3. The typography notes below document the earlier studio workflow.

## Tour

Tour is presented as a sparse festival-day timetable: two bookings make a two-day board, three make a three-day board, and cards stack on phones. The current three-card design preview clearly labels the Olive's and bowling-alley records as sample/fictional data; the September 26, 2026 Nyack Neighborhood Music & Arts Festival entry is user-verified and links to the organizer's Instagram schedule. Keep the reusable empty-state template when no real dates exist, and never present placeholder details as announced shows.

## Gallery and print treatment

Learn contains a manual overview/member gallery. Its verified member content and photo mappings live in `app.js`; image decoding, request versioning, live announcements and keyboard controls keep selection consistent. There is no auto-rotation. Footer profiles are the Instagram, YouTube and Facebook links from the official band homepage.

Band and Tour continue the header's festival illustration with independent crops from the same asset: upper stages/camp behind Band, and the lower pond/bassist/astronaut scene behind Tour. The Band overview is illustration-only; each member selection places its existing press-kit portrait in a responsive, warm-paper Polaroid above that world. The Polaroid frame and individual biography both use the hero's shared `PaperCutout` scrap treatment for displaced torn edges, exposed fibers, aged stock, flecks and print wear. The photo window retains its faded gloss and inset depth, while the thicker lower margin carries the member's name and role. Biography copy is plain Comic Sans-style ink on a gently rotated scrap; the overview copy remains directly on the illustrated field. Polaroids slide fully across the paper with a brief lift and settle; compact biography copy follows more quietly and leaves room for larger edge navigation.

The inline `printed-ink` SVG filter textures only display lettering. The repeating paper SVG is decorative and cannot intercept input. `overflow:clip` prevents overscanned media from becoming an internally scrollable focus container. The poster's behaviour is covered by the Node tests in `legacy/tests/` (`npm run test:legacy`).

All design-critical typography is served locally: Modak for poster display type, Balsamiq Sans as the open-licensed Comic Sans-style body face, and Pacifico, Caveat and Sacramento for the three live-text member signatures. See [fonts.md](fonts.md) for file provenance and licenses.

## Typography studio

Press **D** or click **Type · D** to open the tuning panel on either page. Escape closes it; hotkeys ignore text fields and select menus. Select a text group and an all-screens, desktop (761px+), or mobile (up to 760px) scope. Tune font family, size, tracking, line height, color, offsets, rotation and width/height; section headings also expose individual glyph width and margins, while the SVG title exposes text length. The whole wordmark group controls its position and scale. Modak has a single font weight.

Drafts persist locally per page. Blank values inherit the site or all-screens adjustment. Preview on/off compares with the original; reset buttons clear a field, group/scope, or the entire draft. **Export JSON** downloads `funkadelic-typography.json`; **Copy JSON** offers clipboard or manual copying. Send this JSON back to implement defaults. It contains the viewport, scoped adjustments, exact CSS selectors/declarations and SVG attribute overrides. Font sizes are explicit pixels (SVG units for SVG text), so choose a responsive scope when needed. Position/scale adjustments compose with existing transforms. Include `typography-debug.js` when publishing.

The panel title is a drag handle; focus it and use arrow keys for keyboard movement. Panel opacity is adjustable, with position and opacity saved separately from exported typography. Global font groups apply to all text, display lettering, or reading text, and individual text groups can override them. Additional Google Fonts load only when selected; font stylesheet URLs are included in the export. Locally installed font options use their listed fallbacks when unavailable.

The September 12 typography export is now the default: Modak for display lettering and wordmark translate (-15px, -56px), rotation -2deg, and scale (1.04, 1.35) at every viewport size. Other font families tried in the studio are not preloaded. Existing drafts still override defaults; Preview off or Reset reveals the adopted styling.

See also [layout-studio.md](layout-studio.md).

## Style organization

`style.css` imports ordered layers from `styles/`: `base.css` holds baseline layout, `poster.css` holds the established poster treatment, `sections.css` holds the current section compositions, and `cutout.css` owns the shared cutout typography. Asset URLs in these sheets are relative to `styles/`. `cutout-type.js` supplies the same glyph structure to headings and dynamic labels. Keep visual cutout changes in the shared layer; section rules should control size and placement.

The HTML is directly served static markup, and behavior is split into focused JavaScript files.

### Section composition references

About and Tour use a shared `--composition-unit`: a 1440px larger-screen reference and a 390px compact reference, switching at 760px. Their heights, copy, gutters, gallery controls, and Tour footer scale together. Gallery changes do not resize the section. Ribbon height tracks page width, and gallery image focal positioning tracks section height. Intentional wave cropping remains part of the composition.

### Ambient video tuning

The landing scene samples the original 522-second performance at 10 displayed fps from the same muted media element used by explicit playback. A browser-native SVG levels pass renders those frames in restrained black and white. Explicit Play stops the ambient cadence, seeks the same stream to zero, and fades into unfiltered playback with audio. Open **Layout studio → Ambient video treatment** to tune brightness, contrast, black/white points, grain and cadence, or select a local clip discovered from `assets/ambient/` after refresh. Defaults stay baked in the poster's code. See [the ambient treatment guide](performance-print.md) for adding clips, static publishing, draft behavior and QA.
