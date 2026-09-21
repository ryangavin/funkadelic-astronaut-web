# Café window counter — setting taste gate

Independent comparison, not a production scene replacement. All changes are local
here; PerspectiveDesk, Room, the approved calibration roster and sample-pass
content are reused. No shared drawing, scale, dossier or runtime code was edited.

## Ownership / reproducibility

- Owner: café task 01a0c51b-7189-7d22-a4d4-d6e0aa291bd8.
- Branch: `codex/cafe-counter-01a0c51b`.
- Base: `a6b4765817df5a921d75b55e8fc80b7607c1c595`.
- Implementation revision: `5f996dcb06621ef1df98bfe62ad5b5f47a5b1db7`.
- Worktree: `/Users/ryan/.codex/worktrees/b0a3/funkadelic-astronaut-web`.
- Preview: http://127.0.0.1:4187/storybook/iframe.html?id=experiments-cafe-counter--window-counter&viewMode=story
- Unified launcher: `PREVIEW_LABEL='Café window counter · setting study' PREVIEW_PORT=4187 STORYBOOK_PORT=6017 npm run dev`.
- Live launcher: exec session `40338`, PID `33198`; children Storybook `33205`, Vite `33522`.
- Keep this preview/worktree until integration/preservation is coordinated. No push, PR or deployment.

## Evidence

- `npm run build`: passed; existing classic-script bundling warnings remain.
- `npx tsc --noEmit`: passed.
- Focused `npm run test:stories -- src/experiments/CafeCounter/CafeCounter.stories.tsx`: 1 passed. Checks sample passes/tin, Handheld readout interaction and persistence across dossier open/close, and return to the open affordance.
- HTTP readiness: 200 from the exact story URL; registered on the session status post.
- Background browser: visually checked closed and open states; clicked open/close successfully at actual DOM viewport 1422 × 800. The browser viewport override did not produce the requested DOM dimensions, so no 1280 × 720 certification is claimed.

## Taste gate and limitations

Does this feel like the right place to discover/book the band? The local booking
card gives band identity more space while the dossier remains unchanged. Oak,
dark mullions, muted street silhouettes, receipt, mug and decorative Zyn-style tin
suggest a personal café window patch. No shopping links or product claims.

Devices are unbound (No tape / No disc); visible music/live-video cues are layout
roles, not finished playback. Dates are calibration samples, not announcements.
The existing dossier sequence works, but its inherited open targets cover the
booking card and push lower props/papers toward the counter edge. A counter-specific
open composition is the next issue if this setting is selected. Portrait remains
deferred; below 800 px the study scrolls horizontally.

The independent scaling task's final dossier/Handheld/Walkman refinements are not
included. Incorporate the reviewed shared changes later, then recheck overlap,
readability and open/close at laptop/desktop sizes. Do not close MVP issues based
on this atmosphere prototype.
