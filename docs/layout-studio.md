# Layout studio

Press **D** or use the bottom-right launcher. This temporary studio lets the user communicate a final design pass. It does not adopt drafts into the production layout or make production styles consume exported JSON.

Select a target or activate **Pick on page** and click it. Wordmark, individual words, astronaut, header streaming group/icons, footer social/music groups/icons, band heading, introduction role/biography, each member's name/role/biography, and four ribbons have separate identities. Selecting a member waits for its photo and text to commit before enabling editing. Carousel arrows also synchronize the selected member target.

Sliders and precise number fields update live. One continuous field gesture is one undo step. Arrow buttons nudge the target by one unit (Shift: ten); focus **Show target** for keyboard arrows. Drag the panel title, or focus it and use arrow keys, to move the panel. Opacity and panel position persist independently. D toggles the panel; Escape cancels picking or closes it.

Shared drafts inherit into Desktop (above 760px) and Mobile (760px and below). A viewport-specific field replaces that shared field. The panel identifies the active viewport; editing an inactive scope intentionally does not affect the current view. Reset removes the selected target's overrides in the selected scope, exposing shared/site values. Undo also reverses resets and imports. Closing the panel keeps drafts applied; **Preview actual site defaults** removes all temporary CSS, legacy typography/text-length effects, and ribbon drafts, and disables editing until unchecked.

## Persistence and handoff

One browser key per page, `fa-layout-studio-v1:<pathname>`, contains the versioned handoff. Original `fa-typography-v1:<pathname>` and `fa-ribbons-v1` keys are never written or removed. Mapped legacy controls migrate into the unified draft; remaining validated legacy typography is emitted by the same stylesheet. Source drafts are retained in `archive`. An unrecognized older studio handoff is also retained there for recovery, rather than treated as trusted CSS or silently discarded.

Copy or export produces the same `funkadelic-layout-handoff` version 1 data: target/member identities, selectors, field units, all three scopes, legacy/source archives, current viewport and visible bounds, and per-target/scope measurements recorded during edits. Context for an inactive scope is labeled with the viewport actually shown. Import accepts this format on the same page, validates numeric limits, and creates an undo step. Nothing is uploaded. Storage errors leave an exportable in-memory draft.

The adjustments are temporary communication aids. When tuning finishes, use the handoff and viewport context to implement the intended appearance in real site markup/styles; review the result and remove the temporary overrides. Do not turn this handoff into a production configuration engine.

## Implementation boundary

- `layout-studio-core.js`: bounded target catalog, scope inheritance, legacy migration, handoff parsing and undo history.
- `layout-studio.js`: one stylesheet, ribbon preview calls, panel and persistence. SVG word groups let original and jitter-painted letters share the same temporary transform. The astronaut's existing print jitter remains independent.
- `typography-debug.js`: validation/rule provider only; no stylesheet or persistence writes of its own.
- `app.js`: ephemeral ribbon preview and existing carousel selection bridge.
- `poster-motion.js`: rebuilds painted glyphs when temporary typography changes, including defaults preview.

Remove the studio scripts and the typography provider when this tuning pass is adopted; `app.js` no longer reads browser ribbon drafts for production layout. The old ribbon panel file remains on disk for history, but neither page loads it.

## Verification

`npm test`: 27 tests pass, including existing gallery, performance, motion and ribbon coverage plus scope/member isolation, handoff validation, legacy preservation and undo/reset data behavior.

Real browser verification against this worktree's coordinator-owned Vite preview covered 1280px desktop and 390px mobile; all four introduction roles; separate member name/biography transforms; biography metrics; shared/mobile inheritance; defaults/reset/undo; reload persistence; word and astronaut jitter composition; group/individual icon sizing; exact ribbon path restoration; copy and file import; picker, highlight, pointer drag, opacity and keyboard nudges. QA draft writes used the separate `localhost` origin, preserving the user's `127.0.0.1` drafts. Native screenshots were inspected in the browser. No final design settings were adopted or published.
