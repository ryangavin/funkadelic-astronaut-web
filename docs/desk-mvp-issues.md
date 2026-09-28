# Desk MVP: reviewed issue drafts

Reviewed against commit `9698aea3570bfd7202fb2d2f3db2f5e43edde465` on September 20, 2026. Published as GitHub issues #2–#11 under the [MVP label](https://github.com/ryangavin/funkadelic-astronaut-web/issues?q=label%3AMVP). This review inspected source and existing Storybook findings; it did not run tests or certify current behavior.

## Product decisions

- The experience is a fictional festival promoter's desk, about to book Funkadelic Astronaut. Inhabiting the world, discovering things, and playing with devices matter; there is no required game or task to complete.
- Finish the desk before revisiting the wall poster or its transition. Poster work, free camera movement, a hidden game, and a bespoke portrait desk are deferred.
- The initial desk exposes music, live video, and the next few shows, with a closed dossier and a few approved toys. Dates must be readable and media actions recognizable without opening the dossier. Sticky notes can clarify actions.
- Ryan confirmed on September 21 that sitePlan, contract, pen, and LabelBro belong on the initial desk and remain available in the open arrangement.
- Opening the dossier rearranges the scene into an intentional, organized mess and spills out additional material. Reuse the existing sequence.
- `Room` owns shared perspective/framing. `PerspectiveDesk` owns the page composition. Reuse `ScaleBench` and `SizingBench` for calibration.
- Near-overhead is the camera starting point, not a final numeric setting. Preserve a useful safe area while letting extra room/desk fill wider or taller frames. Historic 16:9 and absolute physical-scale prescriptions are revisitable.
- A direct, text-only information page serves promoters and provides the MVP fallback for unsupported desk viewports. Exact routing and viewport threshold are implementation proposals to validate, not settled requirements.

## Review findings and dependencies

| Issue | Work item | Dependency / current blocker |
| --- | --- | --- |
| [D01](https://github.com/ryangavin/funkadelic-astronaut-web/issues/2) | Approve the component roster and content roles | Ready for proposal; Ryan chooses toys and optional contents |
| [D02](https://github.com/ryangavin/funkadelic-astronaut-web/issues/3) | Make existing benches cover the approved roster reliably | D01; no external blocker |
| [D03](https://github.com/ryangavin/funkadelic-astronaut-web/issues/4) | Finalize object appearance and relative scale, especially Handheld | D02; iterative visual approval, not a prerequisite questionnaire |
| [D04](https://github.com/ryangavin/funkadelic-astronaut-web/issues/5) | Fit Room around a safe area across supported landscape windows | D03 baseline; deliver provisional framing, validate final bounds in D05–D06 |
| [D05](https://github.com/ryangavin/funkadelic-astronaut-web/issues/6) | Compose the essential closed-dossier desk | D01, D03, D04 framing mechanism; representative content can unblock layout |
| [D06](https://github.com/ryangavin/funkadelic-astronaut-web/issues/7) | Refine the open desk and dossier rearrangement | D05; reuse existing state machine; review hidden media lifecycle |
| [D07](https://github.com/ryangavin/funkadelic-astronaut-web/issues/8) | Connect production media and maintainable upcoming dates | D01; real audio and confirmed event/contact data needed for completion |
| [D08](https://github.com/ryangavin/funkadelic-astronaut-web/issues/9) | Finish visitor interactions and recovery behavior | D05–D07; can test individual components earlier |
| [D09](https://github.com/ryangavin/funkadelic-astronaut-web/issues/10) | Deliver the text-only promoter and viewport fallback page | Shared content contract from D07; final facts needed for completion |
| [D10](https://github.com/ryangavin/funkadelic-astronaut-web/issues/11) | Ship the React desk as a built site and validate the integrated MVP | D04–D09; publishing is a separate authorized action |

Visual sequence: **roster → calibration → object approval → camera/safe area → closed desk → open desk → interaction polish**. D07 content preparation and D09 can progress alongside visual work. Do not hold composition experiments for missing production audio or dates; label fixtures clearly and keep them out of production data.

At each taste gate show one recommended version and at most two alternatives, using the same viewport/content for fair comparisons. Let Ryan answer with a short reaction. Record the chosen story/settings, immutable revision, what was liked, requested changes, and open decisions. Reopen accepted choices only for a specific regression or new constraint. Technical correctness checks belong to the implementer, not Ryan's taste gate.

## D01 — Approve the desk's component roster and content roles

**Problem.** The existing scene renders 14 top-level objects regardless of their importance. Several essentials are hidden in the dossier; the current presence of an object is not approval to ship it.

**Evidence / reuse.** `src/pages/Desk/DeskObjects.tsx` defines the top-level objects. `DeskDossier.tsx` separately defines ten spilled items. Tour passes, StickyNote, Walkman, Handheld, and dossier cues already exist. `Room` owns the lamp separately.

**Scope.** Produce a roster with stable object IDs, existing component, purpose, initial/open visibility, real versus fictional content, interaction, and known appearance work. Propose Handheld for live video, Walkman for music, existing TourPass components for dates, and the dossier. Distinguish lamp/room scenery from optional toys. List every candidate dossier item and flag duplicate handbill, pass, and live-video presentations for a keep/remove decision. Proposed initial toys should be few; do not treat all existing gadgets as required.

**Acceptance.**

- Every retained item has an explicit role in the closed and open arrangements; deferred items are listed.
- Tour-date count/layout handles fewer than the preferred number of real shows; no requirement to invent dates to fill the desk.
- Site plan, contract, pen, and LabelBro are confirmed initial objects; compose them around the essential content. Other paperwork may be reserved for the reveal.
- Objects intentionally absent while closed cannot receive focus or intercept clicks.
- Optional toys are selected from existing components; creating a new game is out of scope.

**Taste gate.** “Anything missing? Anything we don't need? Which toys earn a place?”

**Blocker.** Final roster needs this short selection gate. Other work may investigate mechanisms before approval, but must not polish unselected props.

## D02 — Extend the existing calibration benches to cover the selected objects

**Problem.** Current SizingBench enumerates only `DESK_OBJECTS`; dossier contents and prospective tour-pass objects are absent. Its reported scale reads input placements while measured pixels follow live resizing, so the numbers can diverge. The paper metric is the widest rotated bounding box, not a readability guarantee.

**Evidence / reuse.** `src/debug/ScaleBench/`, `src/debug/SizingBench/SizingBench.tsx`, `src/geometry/physicalScale.ts`, and `DeskDossier.tsx`. Dossier sizes currently come from legacy `PromoterDesk.SIZES` multiplied by `0.6`.

**Scope.** Extend the current benches, not a third calibration tool. Supply a clearly spaced roster view and individual-object views with the existing ruler and reference papers. Make selected spilled items measurable without requiring a cluttered final arrangement. Use consistent dimension metadata or a narrow adapter where necessary; avoid a general scene-editor rewrite.

**Acceptance.**

- All approved objects, including date components and dossier contents, can be judged beside the same ruler/papers under the same fixed camera and lighting.
- Nominal dimensions, deliberate composition scale, and actual screen measurements are distinguished. Live resize updates the readout accurately.
- Artwork bounds versus physical footprint are identified where relevant (folder spread, phone cord, mug handle, etc.). A bounding box is not mislabeled as true width/readability.
- Capturing and reloading settings reproduces selected dimensions, placements, and camera; no reliance on unrecorded local browser state.
- Calibration guides can be removed without changing object sizes. Existing useful bench stories remain available.

**Validation.** A focused browser check resizes a selected object, confirms the live readout, reloads its captured settings, and measures a known ruler/paper relationship. Repeat live scale readout and capture/reload for a resized selected spilled item, whose legacy sizing path differs from the main objects.

**Taste gate.** “Can we judge these fairly together? What looks out of scale or visually unfinished?”

## D03 — Finalize object appearance and relative scale, with Handheld first

**Problem.** Physical reference dimensions exist, but that does not establish a visually coherent or usable cast. Ryan specifically identifies the Handheld as unfinished. Choosing the camera around an unfinished object risks compensating with arbitrary global scaling.

**Evidence / reuse.** `src/components/3D/Handheld/`, `src/behaviors/Perspective/HandheldPerspective.*`, `DeskObjects.tsx`, `physicalScale.ts`, and `docs/desk-physical-dimensions.md`. Handheld already supports YouTube and file playback and has a declared 170 mm width; this is a baseline, not a newly imposed invariant. It does not currently expose a poster-image prop, so a dependable performance still before playback needs an explicit rendering choice; a lazy embed alone does not establish the required first impression.

**Scope.** Show Handheld close-up and beside the selected cast with representative footage/still imagery. Propose specific changes to its screen/body balance, proportions, depth, controls, and finish based on the review. Record bounded appearance fixes for other retained objects; defer unrelated toy elaboration. Keep drawing corrections, nominal dimensions, and artistic scale overrides distinct.

**Acceptance.**

- During review, each retained object is marked approved, needs a named correction, or deferred. D03 closes only when retained MVP objects are approved; any separately tracked unresolved correction remains an explicit blocker to calling that object's appearance final.
- Handheld is recognizable as the live-video object; its screen and primary play affordance work at desk size and when inspected.
- Rendering changes stay consistent across flat component, perspective preview, desk, silhouette, and shadow geometry.
- Physical dimensions remain coherent; deliberate exaggerations have an explicit recorded reason. No global unit conversion change just to repair one object's proportions.
- The approved scale baseline is captured as repeatable settings. Its screen usability is rechecked after final camera selection in D04–D05.

**Validation.** Visual comparisons in the bench plus Handheld media/control checks affected by edits. If geometry changes, run the relevant physical-scale/perspective checks. Do not add implementation-mirroring tests for purely cosmetic changes.

**Taste gate.** “Does it look right close up and on the desk? Too big, too small, too chunky, or too visually loud?”

**Blocker.** The exact Handheld redesign is deliberately unresolved; the first comparison discovers it. This is a bounded visual iteration, not permission to redesign every component.

## D04 — Make Room fit the essential safe area without a fixed 16:9 frame

**Problem.** A variable frame cannot be achieved by removing CSS aspect-ratio alone. Room coverage and floor projection also encode the old frame ratio. Merely shrinking the whole scene can technically contain essentials while making them unusable.

**Evidence / reuse.** `src/foundations/Room/Room.css`, `Room.tsx`, `RoomFloorSurface.tsx`, `RoomFloorGeometry.tsx`, `floorGeometry.ts`, `src/geometry/roomCoverage.ts`, and existing room/floor/coverage tests. Fixed assumptions include a 1440×810 overlay and a (720,405) projection center. `PerspectiveDesk.css` adds its own window margin.

**Scope.** Keep camera and frame fitting in Room/shared geometry; let the desk composition supply its essential region. Compare a small number of fixed, near-overhead views with identical content. Model actual frame dimensions consistently in rendering, coverage, lighting and inspection rather than stretching a fixed image. No visitor free-camera controls.

**Acceptance.**

- Define safe-area membership concretely: essential date text/actions, media recognition/play controls, and dossier entry. Decide in D06 whether the open view needs different bounds or fitting; do not assume every decorative object must fit.
- The selected camera preserves believable object projection. Growing horizontal/vertical space reveals coherent room/desk scenery, without gaps or distorted materials. Preserve the existing finite material-allocation safeguards rather than expanding surfaces without limits.
- Propose and review landscape checks at 1280×720, 1440×900, 1920×1080, and 2560×1080 CSS pixels. These are validation targets, not a new rigid aspect rule.
- Establish provisional readable minimum sizes and essential hit areas using representative content; finalize them with D05's accepted composition and D06's open view. Containment alone does not pass. Below the supported envelope, use D09's fallback rather than endlessly shrinking.
- Debug safe-area overlays and camera controls are available in Storybook and absent from the visitor experience.
- Existing physical scale remains independent of viewport fitting. Resize does not randomly reset placements or device state.

**Validation.** Geometry checks with non-16:9 frames; browser review of coverage, essential bounds, inspection, shadows, and material continuity at the approved sizes. Update obsolete ratio assertions while preserving meaningful geometry checks.

**Taste gate.** “Which view feels best? Too flat, too far away, or too much room? Does the extra space feel intentional?”

**Composition dependency.** Start from D01's essential roster and a provisional arrangement at the D03 scale. D04 establishes the framing mechanism and candidate camera; D05 then validates the final semantic safe-area bounds with the actual composition. Iterate those bounds together rather than claiming the camera can be finalized without any composition.

## D05 — Compose the closed-dossier desk around the three essentials

**Problem.** The current main story centers paperwork, leaves substantial empty foreground, and crops props near the back. The visible media devices are unbound, and dates are not foregrounded. The user should not need to discover the dossier to understand the band.

**Evidence / reuse.** `PerspectiveDesk.stories.tsx`, `DeskObjects.tsx`, `DossierCover.tsx`, existing StickyNote/TourPass components. Use the D01 roster and D03 scale baseline.

**Scope.** Create the actual initial desk arrangement with music, live video, upcoming dates, closed dossier, and approved toys. Use sticky-note invitations and existing object styling before inventing an overlay navigation system. Keep the confirmed site plan, contract, pen, and LabelBro on arrival; move only unselected initial paperwork behind the reveal where appropriate.

**Acceptance.**

- Band identity, visible dates/venues, recognizable video image with a play action, and an identifiable music action are available before dossier interaction.
- Primary actions are clickable directly where expected; tiny device controls do not require discovering a hidden inspection gesture to begin playback.
- Overlap does not obscure essential copy/actions or the dossier invitation at supported viewport sizes.
- Calibration ruler/papers are removed unless explicitly selected as final props. Editing/settings chrome is absent in the visitor variant.
- The arrangement and content assumptions are reproducible in a named Storybook story; use clearly identified fixtures while D07 production content is pending.

**Validation.** Screenshot comparison at D04 sizes, link/control click checks, keyboard reachability, and long venue/date content examples.

**Taste gate.** “Are all three essentials obvious? Where does your eye go first? Too busy, too empty, or too staged?”

## D06 — Refine the dossier reveal into a second intentional desk composition

**Problem.** The reveal already exists, but its object membership and saved targets reflect the older populated desk. Moving nonessentials behind the reveal changes mounting, visibility, stacking, and return behavior. An attractive still image alone does not validate the sequence.

**Evidence / reuse.** `DeskDossier.tsx` already has preparing/opening/spilling/open/returning/closing phases, captures the prior arrangement, moves objects through `useRoomArrangement`, and handles reduced motion. `Spill` and `DOSSIER_OPEN_TARGETS` should be adapted, not replaced without evidence. Most open targets omit `scale`; the arrangement helper treats omitted scale as 1, so opening can discard approved size overrides. Fully closing unmounts the contents; their internal state survives movement/interrupted closing, but not a complete close/reopen. Existing dossier stories already cover return, tab reachability, cover occlusion, aligned motion, and reduced motion; extend that coverage.

**Scope.** Compose the open arrangement and update the existing sequence for the approved roster. Keep the feel of discovery without a required game. Avoid simultaneous duplicated live players if D01 removes the existing video Polaroid in favor of Handheld.

**Acceptance.**

- Closed-only/open-only visibility matches the roster; additional papers and selected discoveries emerge at the right stage and remain reachable.
- The open view is deliberately messy but readable through appropriate inspection, with a discoverable close action and usable essentials.
- Newly revealed objects have approved scale; growing the dossier does not unexpectedly resize its entire contents or reset device state. Retain approved scale overrides explicitly through open/close targets and interrupted arrangements.
- Proposed default: closing restores the pre-open positions, rotations, and scales of initial objects; a fresh opening uses the curated spill targets. Preserve existing semantics where possible and record any chosen exception for visitor-moved objects.
- Rapid open/close/reopen, opening after moving the folder, closing while inspecting, dragging an object during flight, resizing the viewport mid-transition, and changing reduced-motion preferences cannot strand objects or controls. Preserve individual drag takeover and current device/dossier state through viewport changes.
- Visible music/video does not restart merely because its object moves. Define hidden dossier-media behavior explicitly; closing must not leave surprising invisible audio playing. Default to resetting packed-content internal state after a full close, consistent with current unmounting, unless the review selects specific state worth retaining. Do not promise cross-close persistence implicitly.

**Validation.** Exercise the sequence and interruption cases in Storybook, not just snapshots. Check state preservation, layering, hidden focus targets, and restoration across all supported viewports.

**Taste gate.** “Satisfying reveal or too much movement? Inviting mess or clutter? Does closing feel natural?”

## D07 — Connect real music, live video, and upcoming-show data

**Problem.** `DeskObjects` instantiates Walkman without `src` and Handheld without `video`. `DEMO_TAPE` is a synthetic placeholder. Tour data mixes dated static entries with an explicitly fictional show; it is not a reliable upcoming list.

**Evidence / reuse.** `src/sections/BandDossier/bandMembers.tsx`, `src/components/2D/TourPass/TourPass.data.ts`, `TourPass.tsx`, `src/components/3D/Walkman/`, and `src/components/3D/Handheld/`. Existing live footage is a candidate, not verified as externally playable in this review.

**Scope.** Establish one modest shared source for real media metadata, shows, and contact links used by desk and text page. Keep fictional world props separate from factual event listings. Manual checked-in data is sufficient for MVP; an external CMS or live API is not required.

**Acceptance.**

- Approved real audio and video are wired to the devices, with useful titles/stills, working playback, loading/failure feedback, and a direct external video link if the embed cannot play.
- Sound begins with an intentional action. Proposed default: starting one audible primary player pauses the other; validate and share this policy with any retained dossier media.
- Events sort chronologically and exclude past shows according to a documented local-date/timezone policy. Zero, one, and several upcoming shows have deliberate presentations.
- Ticket/event links are verified individually before release. No fictional venue, sample ticket, invented time, or synthetic demo appears as a real forthcoming show or band recording.
- Dates and contact information agree between desk and text page. Instructions explain how to update them without editing component layout.
- Development fixtures remain available for layout extremes and error states, separately from shipping data.

**Validation.** Deterministic date-boundary checks plus playback/blocked-media/error checks with a local fixture; separately verify selected real external links/media before release. A successful iframe load alone is not proof of playable video.

**External inputs needed.** Ryan supplies or approves the music source, preferred video, real upcoming shows/URLs, and booking contact. Existing values are candidates. These block final content approval, not visual experimentation.

## D08 — Finish interaction rules, accessibility, and desk recovery

**Problem.** Moving, resizing, inspecting, pressing device controls, and opening objects coexist. Existing behaviors cover much of this, but the integrated roster and transitions may expose conflicts. A visitor must be able to recover after moving an essential object away.

**Evidence / reuse.** `src/behaviors/Movable/`, `Inspectable/`, `Spill/`, `DeskObjects.tsx`, and device story tests. Inspector preserves mounted content and supports Escape; verify the final combination rather than rebuilding inspection.

**Scope.** Validate and fix the interaction contract for selected objects. Recommend keeping calibration resizing/rotation handles out of the visitor UI while retaining intended playful dragging; present any visible handling change for a quick gate. Supply a simple reset/recovery path if dragging remains enabled.

**Acceptance.**

- Clicking a control performs that action once; dragging does not inadvertently play, navigate, flip, sign, or open an object.
- Inspect/release and dossier transitions preserve appropriate playback and object state; focus enters and returns predictably. Escape/close actions remain available.
- Keyboard users can reach all essential content/actions; hidden packed items are not focusable. Inspection does not leave focus interacting invisibly behind the held object.
- Reduced motion avoids large fly/zoom sequences while preserving the same end states and access to content.
- Reset restores an understood arrangement without reloading the site; specify whether media keeps playing. Offscreen essential objects are recoverable.
- Hints remain subtle and useful; no mandatory tutorial or game progress gates access to content. Any first-use cue has a defined dismissal/replay policy.

**Validation.** Mouse, keyboard, and touch-capable landscape checks; long text/zoom checks where supported; targeted interaction story tests. Capture a final performance baseline and fix observable sustained jank in dragging/playback/reveal, rather than adding speculative infrastructure.

**Taste gate.** “Anything confusing, fiddly, slow, or over-explained? Are the toys fun without getting in the way?”

## D09 — Provide a direct text-only promoter page and portrait fallback

**Problem.** `press-kit.html` is a useful starting point, but it includes photographs, global styling/debug scripts, and a video link back to the old homepage. It does not yet provide all essentials independently of the immersive site.

**Scope.** Adapt the existing page into a straightforward text-first information route, with band summary, upcoming dates, direct music/video links, booking contact, and text links to any retained press downloads. No poster port, mandatory imagery, or interactive room is required.

**Acceptance.**

- Useful content renders without running the desk or completing an interaction. Reading and navigation work on portrait phones, keyboard, and browser zoom.
- Links do not depend on a legacy homepage anchor. Real content agrees with D07; shared content can be rendered at build time to preserve a simple static page.
- The desk offers an obvious direct link. Propose the minimum viewport envelope from D04 measurements and route/show this page below it, with a clear optional route back where appropriate; avoid forcing device rotation.
- Resizing or rotating a device does not create redirect loops, erase an in-progress visit unexpectedly, or leave music playing invisibly. Specify and test the transition policy before wiring automatic fallback.
- Debug editors and scene dependencies are absent. Retained press assets are linked as text rather than required visual content.

**Validation.** Direct URL and refresh, narrow portrait and zoomed views, valid media/contact links, and no-JavaScript reading if delivered as the proposed static page.

**Gate.** “Does this give a real promoter everything needed immediately?” Content completeness gate; no elaborate visual exploration needed.

## D10 — Integrate the React desk into the production build and verify the MVP

**Problem.** The current production inputs are static `index.html` and `press-kit.html`; React page compositions are explored through Storybook. Completing a story does not make the desk the actual website.

**Evidence / reuse.** `vite.config.mts`, `index.html`, `press-kit.html`, `scripts/copy-static-build.cjs`, and `package.json`. Preserve the project's unified development launcher and existing unrelated previews.

**Scope.** Add the production React entry and make the accepted desk the intended landing experience, without implementing the deferred wall poster. Preserve the legacy poster source for later work. Include the text route, metadata, and the approved viewport fallback; do not bundle development controls into the visitor surface.

**Acceptance.**

- A production build loads the desk and direct text page without Storybook, development middleware, or missing fonts/media/assets. Refresh and direct links work at the intended hosting base path.
- Dossier, media, upcoming dates, reset, inspection, and fallback behave consistently with the approved stories.
- Debug/performance/camera/settings chrome is disabled in the shipping entry. Only approved objects/content appear.
- Review the integrated immutable revision against the accepted story/settings references. Report local file checks, automated tests, browser checks, and any remote CI separately.
- Run `npm run build`, relevant node tests, affected Storybook interaction tests, and `npm run build-storybook` where story/build changes warrant it. Test actual production output as well as the development preview. Do not claim existing source-string tests prove visual correctness.
- Confirm representative desktop browsers (including Chromium and Safari/WebKit where available), supported viewport sizes, reduced motion, and the portrait text path. Record unavailable checks and remaining release risks explicitly.
- No outstanding launch-blocking placeholder content, broken primary action, unreachable information, or unresolved required taste gate remains.

**Final gate.** Ryan takes one uninterrupted pass through arrival → music/video/dates → dossier reveal → inspect/toy → close/reset → text page, and flags only remaining experience issues.

**Authorization boundary.** These issues authorize planning only at this stage. Future implementation follows the project's isolated worktree/owner rules. Tracker publication was explicitly authorized and completed. Remote pushes, PR creation, main updates, and deployment remain separate actions requiring the authorization appropriate to a subsequent task.

## How to begin

Start D01 with a concrete roster proposal, then D02 using the existing benches. Do not ask Ryan to settle camera numbers or an unspecified Handheld redesign in advance. Prepare the comparison and ask for a quick visual reaction. Request D07's real content inputs early so they do not become a late release surprise.
