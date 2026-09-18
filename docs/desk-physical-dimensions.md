# Perspective desk physical baseline

One millimetre is 1.2 desk units (`src/geometry/physicalScale.ts`). The desktop is
1200 × 800 mm, 750 mm above the floor. Camera distance and placements use desk
units; viewport fitting and preview zoom do not change physical dimensions.
Object base widths in `DeskObjects.tsx` are millimetres, converted once. A saved
`placement.scale` is a deliberate uniform size override, with default 1.

Dimensions below are width × depth × height, in millimetres. Existing art remains
in its own coordinates. A box containing whitespace is not a physical footprint.

| Item | Baseline | Interpretation and evidence |
| --- | --- | --- |
| Site plan | 220 × 280 × 0.2 | User-approved rounded paper size; thickness estimated. |
| Poster / handbill | 220 × 280 × 0.2 | User-approved full-size sheet, rather than the original quarter-sheet prop. |
| Set times | 220 × 280 × 0.2 | User-approved rounded paper size; thickness estimated. |
| Contract | 220 × 280 × 0.2 | User-approved rounded paper size; thickness estimated. |
| Dossier | Artwork 482 × 321.33; closed cover 241 × 306.29, plus tab; thickness 1 | Retains the existing documented 482 mm spread reference from PromoterDesk. The drawing has two 720-unit leaves, each 915 tall, and a 45-unit tab region. Estimated letter-folder analogue; the closed cover occupies only the right half of the spread. Contents and decorative side tab can extend outside these bounds. |
| Clock | Artwork 90 × 70 × 15 | Existing compact desktop-clock estimate; case occupies most of artwork. |
| Newton’s cradle | Artwork 120 × 100; rail centre 90 high, base top 8 | Existing small generic cradle estimate. Base outline is about 113 × 90; rail caps extend slightly above 90. |
| Mug | Body about 82 diameter × 95 tall; artwork 140 × 140 | Generic coffee-mug estimate. Body diameter is 140/240 of artwork width. Restores earlier ordinary-mug height instead of the stylized 70 mm height. |
| Rolodex | Tray 114.3 × 165.1 × 107.95; artwork with knobs 137.05 × 165.1 | Existing inch-scaled V-file drawing: 4½ × 6½ inch tray, 4¼ inch height; includes knobs, excludes loose card in desk mode. Retained drawing-derived dimensions, not independently manufacturer-verified. |
| Handheld | Artwork 170 × 77.21 × 23 | Sony PSP-1000 reference is 170 × 74 × 23. Existing stylized outline has extra vertical bounds; preserve its 720:327 art ratio rather than distort it. Removes previous 1.2× width exaggeration. |
| Label Bro | 183 × 193 × 78 | Existing quarter-millimetre desktop-labeler drawing: 732 × 772 plan and 312 elevation. Retained as a reasonable generic desktop-labeler estimate; no exact manufacturer model asserted. Printed tape may extend beyond the body. |
| Pen | Artwork 149 × 12.42; estimated body height 7 | Existing 149 mm length; artwork includes clip and empty space. Uses a typical 7 mm barrel-height estimate instead of 3.5 mm half-height. |
| Walkman | Artwork 112 × 91.78 × 30 | Existing compact cassette-player width and estimated thickness. Generic stylized player, not asserted to match a particular Sony model. Rounded case is inside artwork bounds. |
| Desk phone | Housing 221 × 229 × 137 overall; artwork 320 × 300 | Existing model-500-inspired dimensions. Only the 68.5 mm moulding is extruded/casts the simplified body shadow; handset is drawn on that face. Cord occupies the extra artwork bounds. No claim that this 2.5D approximation models full handset elevation. |
| Lamp | Artwork 480 × 400; base diameter about 146.7; bulb height 350 | Existing generic articulated lamp estimate. Base top 25, elbow 230, shade top 400. Articulation changes plan bounds. Default width 576 desk units gives the same physical lamp in desk and object previews. |

## References and limits

- [Sony PSP announcement](https://sonyinteractive.com/uploads/sites/5/2023/02/040512a.pdf): 170 × 74 × 23 mm reference; our prop is a stylized analogue.
- [Smead standard letter folders](https://www.smead.com/collections/top-tab-file-folders/products/standard-file-folders-1-5-cut-tab): 11⅝ × 9½ inches overall, 9-inch body. This checks the general size class; our existing slightly larger portrait folder geometry remains an estimate, not an exact Smead replica.
- Internal dimension notes: `PromoterDesk.tsx`, `DeskPhone.tsx`, `Rolodex.tsx`, `LabelBro/keyboard.ts`, and `Folder.css`.

## Overrides changed for the actual-size baseline

The former global object multiplier 0.6 compensated for a 2-units/mm conversion;
it is removed, not reapplied as an object override. Previous cradle 1.2× and
phone 0.8× defaults are now 1×. The phone preview's separate 0.75× reduction is
also removed. The handheld's built-in 204 mm width is restored to 170 mm. The
folder's 600 mm spread is reduced to its documented 482 mm reference. All other
widths remain their existing physical baseline except the four approved papers.
Saved user scale overrides continue to apply explicitly. Positions and rotations
are unchanged; physical size changes can therefore change overlap. No layout
redesign or original-art coordinate rewrite is included.

The old flat PromoterDesk composition keeps its legacy independent art layout;
perspective studies no longer import its 2-units/mm helper. The shared physical
conversion governs PerspectiveDesk, its room, and individual perspective previews.
