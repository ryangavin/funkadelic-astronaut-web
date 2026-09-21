# MVP scale calibration

Use **Debug → Sizing Bench → Mvp Initial Cast** and **Mvp Dossier Contents**.
These extend the existing bench; they are not proposed final desk compositions.

The initial cast includes the user-confirmed site plan, contract, pen and LabelBro,
alongside the dossier, Walkman, Handheld, sample tour passes, lamp, mug and cradle.
The second view uses the actual selected dossier drawings with their original sizes.
Both views use fixed near-overhead cameras. Initial Cast has the closer second-gate
framing below; Dossier Contents retains the earlier spacious calibration.
A ruler and 220 × 280 mm reference sheet support relative-size comparisons.
The provisional surfaces support scale comparison; neither establishes final
desk dimensions or camera. Production scene defaults are unchanged.

- Dates are explicitly marked layout samples, not announced shows.
- Devices use the refined heights below and unbound media; content wiring is a later issue.
- Handheld begins at 1.3× following Ryan’s scale feedback; the initial dossier is 1.15× and other object sizes begin at 1×. Drag a resize grip or focus it and use arrow keys.
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

First scale gate: Ryan found Handheld too small, Walkman too tall, and the desk too large. That comparison used a 30% larger Handheld, smaller calibration surface, and closer eye. Ryan clarified that Walkman thickness above the desk was too tall. That first correction reduced its shared case thickness to 18 mm from 30 mm; face dimensions are unchanged.


## Second scale gate — closer framing and quieter cover

`Mvp Initial Cast` now uses a 1200 × 780 mm surface, eye 1650 mm and
setback 470 mm, retaining the near-overhead 85° starting view. Objects are
repacked to use that surface; Handheld remains 1.3× and the dossier is 1.15×
to anchor band identity. Other face sizes and proportions remain unchanged.
`Mvp Previous Framing` retains the prior 1400 × 900 / 1800 / 570 camera and
placements with the corrected components. The immutable full prior baseline
is `a6b4765817df5a921d75b55e8fc80b7607c1c595`.

Walkman thickness is now an artistic 12 mm (previously 18); LabelBro uses
42 mm instead of the original 78 mm peak. Their shared height constants drive
studies, extrusion and cast shadows. No device face has been stretched.
The dossier measures its own cover width to scale wordmark ink, paper padding,
outline, print shadow and sticker geometry together. The open action has a
separate right-hand area; the stale date-specific note is removed. Links and
the existing opening/closing sequence are retained. This is still a calibration
comparison, not completed media wiring or the final open composition.

Taste gate: Is this close enough, and do the thinner devices and larger band
name feel right? Final landscape fitting and production media remain separate.
