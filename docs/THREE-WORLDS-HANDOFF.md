# Three Worlds handoff — 2026-10-11

## Stop state

User requested: commit, make a handoff, stop development servers immediately. Do not restart previews or continue implementation until requested.

Implementation is committed as `2c8474efd6457a976a2b03198c795d061c28d183` on `codex/museum-repo-journey` in `/Users/ryan/.codex/worktrees/museum-repo-journey/funkadelic-astronaut-web`.

Coordinator is clean at `6cd939b3f0bb6508a39ff1a894e077b666e369be` on `codex/tree-museum-coordinator` in `/Users/ryan/.codex/worktrees/tree-museum-coordinator/funkadelic-astronaut-web`. Implementation is NOT integrated. Source base `69b84755f2267bc1c17248a7f3f7819653411bb5` has the same tree as coordinator base. No push or deployment occurred.

Both unified previews were stopped. Confirmed no listeners on4186,6026,4188,6028. Coordinator session82520 and source session78564 are no longer previews to rely on. Preserve worktrees and branches.

## User direction

User moved away from the single waveform spine/tree. They want three switchable running concepts, starting with Resonance Garden, with clicks and drawing entering the actual visualizer. Preset choice remains independent and highly customizable. This is an exploration of source lines driving MilkDrop, not a pixel-perfect reproduction of generated mockups. Sensitivity means preset response, not waveform squiggliness.

## Implemented

- Resonance Garden: distributed resonators, expanding rings, click-triggered waves and delayed node responses.
- Living Ink: broad animated ribbons plus pointer strokes.
- Orrery: three separated orbital instruments and user-created paths.
- Mode selector independent of the1755-preset catalogue; previous/next/random retained.
- Autonomous-source toggle, Clear marks, pause, existing response/background controls and custom-preset speed/persistence controls.
- Pointer input uses normalized screen coordinates, pointer capture and cancel handling; controls/dialogs reject paint starts; paused input ignored.
- All effect lines deposit in Butterchurn's native feedback stage. Foreground contains sparse project/source markers, not a duplicate drawn effect.
-12 strokes,128 samples each,12-second simulation lifetime,8192 native vertex cap. Independent GL_LINES batched by order to reduce draw calls. Circles compensate display aspect ratio.

Key files: `src/experience/TreeMuseum/worlds.ts`, `native-spine.ts`, `renderer.ts`, `main.tsx`, `gentle-preset.ts`, `museum.css`, copy catalogue, and `docs/tree-museum.md`.

## Evidence and remaining checks

Source owner ran final `npm run build:museum` and diff whitespace check successfully. No automated tests run, per user instruction.

Parent manually exercised clicks/drags in all three modes, mode switching, clearing/autonomous isolation, and a library preset change while retaining Orrery. These produced visible native feedback. Initial distributed version slowed down; after native batching and removing full SVG trace updates, source browser showed60fps, high quality1024 native feedback, CPU submission1.79ms/p952.70ms. This is a local observation, not a device-wide guarantee.

Pause was toggled and a paused drag attempted, but final end-to-end pause/resume verification was interrupted. Final immutable review was requested but completion was not yet received when writing this handoff. Integration/build/browser verification in coordinator remain outstanding. Do not claim integrated or deployed completion.

## Resume when authorized

1. Check current Git status/owners and any late review report; preserve existing work.
2. Finish immutable review of2c8474 against69b84755. Address material findings in source.
3. Integrate2c8474 into coordinator6cd939b (not saved main); build and verify browser there.
4. Only if requested, launch unified preview with `PREVIEW_LABEL="Three Worlds" PREVIEW_PORT=4186 STORYBOOK_PORT=6026 npm run dev`.
5. Open `/museum/?mode=garden&preset=gentle-current` (add `perf=1` for diagnostics). Other modes: `ink`, `orrery`.

Publishing needs explicit user approval. Earlier automatic approval review rejected publication. Do not push origin: it belongs to the unrelated original band site. Intended portfolio destination, if approved, is `https://github.com/satoramoto/web.git`, branch `codex/tree-museum-coordinator`.
