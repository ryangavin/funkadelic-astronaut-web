# Desk settings — the production cabin and the coffee counter

A setting gate for the D01–D05 sequence: the same promoter's desk, in two other
places. Stories are `Pages/Desk Settings → Production Trailer` and
`→ Coffee Counter`; the settings themselves are prop bundles in
[`src/pages/Desk/settings.tsx`](../src/pages/Desk/settings.tsx).

Both carry the same nine objects — dossier, Walkman, Handheld, site plan, run
sheet, contract, pen, Label Bro, mug — at their own real sizes, because a gate
about *where* cannot be answered by two rooms holding different things.

## The rule these follow

A setting is not a backdrop. The room in this library is three real surfaces —
a floor in plan, a wall in elevation, and the surface the work is done on —
measured in millimetres and put in place by projection from one physical eye.
So a new setting is a different set of millimetres and a different set of
materials handed to the same `PerspectiveDesk`, and nothing else. In
particular:

- No painted flat behind the desk. If the wall is made of sheets, `Wall` is
  given sheets.
- No prop without a height. Everything on the surface is a `Solid` that stands
  on it and is thrown by the lamp, or it is not in the room.
- No signage. A label taped to the scene saying `01 / MUSIC` is an admission
  that the composition failed; the Walkman has to read as a Walkman.
- No chrome. No brief header, no footnote, no meta-commentary inside the
  artwork — Storybook is the frame.

## What each place is, in millimetres

| | Production cabin | Coffee counter |
| --- | --- | --- |
| Surface | 1220 × 760 folding trestle, top at 740, 26 mm steel channel | 1800 × 620 oak bar, top at 1050, 40 mm rolled edge |
| Top | printed woodgrain film (`deskSurface: 'laminate'`) | solid oak board (`deskSurface: 'timber'`) |
| Wall | melamine-faced sheet, 1220 wide, stack bond, 6 mm shadow gap (`wall: 'panel'`) | 200 × 100 glazed tile, running bond, 3 mm grout (`wall: 'glaze'`) |
| Floor | grey limed plank | dark boards |
| Eye | 1700 above the floor, 620 back, 76° down — standing | 1520 above the floor, 430 back, 80° down — perched on a stool |

The two differences that do the work are the top and the wall. A laminate is a
*picture* of wood: the same bands of tone as a board, with the figure taken out
and no pores under them, because there is nothing under the film to have any.
That evenness is why a folding table never reads as a desk, and it is the whole
character of a production office. A glazed tile is the opposite — a thin grout
line, a bevelled arris that takes a hard highlight, and a face with no tooth at
all, so what it has instead of texture is reflection.

## What this added to the shared vocabulary

Both are materials in the components that already own materials, not overrides
in a composition's stylesheet:

- `Desk` gains `surface`: `timber` or `laminate` (`DESK_SURFACES`). Laminate
  skips the turbulence filter entirely — the print repeats because a print
  repeats — drops the pores, and swaps the rolled timber edge for a folded
  steel channel. Threaded through `Room` and `PerspectiveDesk` as `deskSurface`.
- `Wall` gains `bond` (`running` or `stack`) and the finishes `panel` and
  `glaze`, plus `WALL_COURSING`: a finish now names the material, and the
  material says how big its unit is and how those units are laid. A tiled wall
  is `wall="glaze"` and gets tiles the size tiles are. Existing brick finishes
  keep their present coursing exactly.

`wallMaterialBricks` takes an optional stagger so stack bond lines its joints
up; running bond is still the default and unchanged.

## Selling the place from overhead

The camera stays near top-down (76°), so a setting has to be legible from
above. Two mechanisms carry it, both measured and projected, neither a flat:

- **Outlook** (`Room` `outlook`, see `Outlook` in `DeskRoom.tsx`). The wall is
  cut with a real opening and glazed, and what is outside is the room's own
  two kinds of surface further off: ground in plan continuing past the wall's
  foot, and a far facade in elevation. Looking steeply down through glass, the
  view is mostly ground — which is what sells it.
  - Café: a 3.4 m shopfront (`Shopfront`) over the counter onto a high street
    (`Street`, `StreetFacade`): narrow pavement, kerb, double yellows, a zebra,
    a cycle lane, shops opposite. `daylight` adds the window's cool wash across
    the counter.
  - Cabin: a uPVC slider (`CabinSlider`) onto backstage (`Backstage`,
    `MarqueeSide`): worn grass, trackway, a cable ramp, marquee pegs.
- **Floor props** (`FloorProps`, `FloorBox`, `CaseLid`, `CableCoil`,
  `TapeRoll`), handed to `Room` as `floorContent`. Boxes are drawn from their
  own outline stacked from floor to lid, each copy lifted through the room's eye — the Relief technique the Handheld uses — with the lid in plan on top, so a
  600 mm flight case stands at table height beside the trestle. The cabin has
  stencilled road cases against the wall either side, a guitar case, a slab of
  water, coils and gaffer.

The eye is far and the lens narrow (cabin: eye 4.5 m, 27°; café: 3.3 m,
46°), both at a 76° tilt, so the objects keep their shape instead of
splaying. The cabin table is a 1220 × 760 four-foot trestle, which is what
lets the frame close in on the cast.

Floor props are expected to be cropped. The table and cast are the safe area.
The cases either side are set dressing that a narrower or taller window cuts
into, which is one way to handle D04's window sizes without re-composing.

## Other honest limits

- The lamp is still the only thing that casts shadows. Café daylight is a
  wash, not a second light source.
- Outside is ground-level only: nothing tall stands on the street or the
  trackway, because anything with height there would need projecting like the
  floor props. Tables, bollards and people are the obvious next additions.
- The café window is a straight shopfront, not a projecting bay.
- `deliverables/desk-settings/*.png` predate this pass.
- Both arrangements are composition, not the approved D05 layout. The cast is
  the current `DESK_OBJECTS`, not the D01 roster — tour passes are not in it
  yet, and no dates, audio or video are wired.
- Framing follows the existing house habit: surface dominant, room as strips
  top and bottom. D04's safe-area work may change that, and both settings are
  parameters, so they move with it.
