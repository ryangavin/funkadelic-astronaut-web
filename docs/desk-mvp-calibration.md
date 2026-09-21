# MVP scale calibration

Use **Debug → Sizing Bench → Mvp Initial Cast** and **Mvp Dossier Contents**.
These extend the existing bench; they are not proposed final desk compositions.

The initial cast includes the user-confirmed site plan, contract, pen and LabelBro,
alongside the dossier, Walkman, Handheld, sample tour passes, lamp, mug and cradle.
The second view uses the actual selected dossier drawings with their original sizes.
Both views use the same fixed near-overhead camera, room dimensions, lamp and lighting.
A ruler and 220 × 280 mm reference sheet support relative-size comparisons.
The provisional 1800 × 1000 mm calibration surface creates separation; it does not
establish the final desk dimensions or camera. Production scene defaults are unchanged.

- Dates are explicitly marked layout samples, not announced shows.
- Devices retain their current appearance and unbound media; content wiring is a later issue.
- Object sizes begin at 1×. Drag a resize grip or focus it and use arrow keys.
- Base artwork millimetres, live scale, and screen bounding-box width are distinct.
  A closed dossier occupies only part of its artwork spread; mug artwork includes
  the handle. The lamp's listed 480 mm is its reference artwork width, not shade diameter.
- Use **Copy desk settings** to export the live placement/camera values as JSON.
  **Sync story controls** puts those values into Storybook args; save/update the story
  or retain the JSON for a reproducible comparison. Reload alone is not persistence.
- Existing Papers First, Everything At Life Size, As Composed and One Thing remain.
  One Thing now includes the selected dossier drawings, sample passes and reference note/sheet.

Implementation: `roster.tsx` owns the provisional calibration cast and placements.
Dossier drawings are exported once from `DeskDossier.tsx`; production retains the
same order, size, props, spill targets and sequence. Bench instances have separate
`calibration-*` placement IDs, so opening the real folder cannot move those copies.
Readout samples the scene's live placement store instead of stale input props.

Next taste gate: compare relative sizes/appearance first, particularly Handheld,
100 mm tour passes, full-size papers, and LabelBro. Final composition and production
readability are separate follow-ups; do not enlarge every object automatically.
