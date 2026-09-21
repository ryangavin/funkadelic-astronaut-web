# D01 — Proposed MVP component roster

Selection gate for [GitHub issue #2](https://github.com/ryangavin/funkadelic-astronaut-web/issues/2). Ryan confirmed sitePlan, contract, pen, and LabelBro on the initial desk on September 21, 2026. Remaining roster choices are the working proposal. Based on existing components at `9698aea3570bfd7202fb2d2f3db2f5e43edde465`.

## Recommended initial desk

Four focal groups: **listen, watch, shows, open the dossier**. Supporting objects create the room without becoming four more competing destinations.

| ID | Existing component | Role and interaction | Content / remaining work |
| --- | --- | --- | --- |
| `walkman` | Walkman | Music; visible play action, inspect for transport controls | Real track needed; currently no source on desk. Add a short sticky-note invitation if controls alone are insufficient. |
| `handheld` | Handheld | Live video; performance still and obvious play action, inspect to enlarge | Required appearance pass, usable screen size, dependable pre-play image, media wiring. Existing live video is a candidate. |
| `tour-next-*` (new instance IDs) | TourPass | One visible pass per upcoming show, initially compose for up to three | Reuse the pass design; proposed maximum three needs composition validation. Show fewer when fewer exist, plus an honest no-shows state. Real data only. |
| `dossier` | DeskDossier / BandDossier / DossierCover | Band identity and invitation to discover; opens and rearranges the desk | Existing branded cover, stickers and note are reusable. Replace stale date-specific note and review open cue. |
| `lamp` | Room's DeskLamp | Room lighting and a tactile interaction | Already owned by Room; include in calibration even though it is outside DESK_OBJECTS. |
| `mug` | Mug | Lived-in character; existing movable coffee/stain behavior | Keep peripheral; compare physical body size rather than artwork bounding box. |
| `cradle` | NewtonsCradle | One immediately available toy | Small peripheral reward, not a large visual anchor. |

| `sitePlan` | SitePlan | Festival-world illustration to inspect | Confirmed initial desk; scenery, not upcoming-event information. |
| `contract` | Contract | Optional signing/stamping toy | Confirmed initial desk; no required game, real booking transaction, or locked content. |
| `pen` | Pen | Supporting prop next to the contract | Confirmed initial desk; no new writing system. |
| `labelBro` | LabelBro | Immediately available tactile gadget | Confirmed initial desk; stays available and rearranges on dossier open. |

StickyNote instances are cues attached to the focal groups rather than additional destinations. The ruler and neutral reference sheets remain calibration-only. The site plan, contract, pen, and LabelBro are present on arrival; composition must keep music, video, and dates evident alongside them. The set-times sheet and duplicate poster remain proposed deferrals.

All initial objects remain available in the open composition, in deliberate new positions. The date passes are not duplicated inside the dossier. Device playback should survive rearrangement.

## Proposed dossier reveal

Use the reveal for band information and additional discoveries. Papers emerge from the folder while existing desk objects, including the site plan, contract, pen, and LabelBro, rearrange around them.

| ID | Existing component | Proposal | Content / interaction |
| --- | --- | --- | --- |
| `dossier-print` | Polaroid using BAND_PACKET photo | Keep | Band photograph to pick up and inspect. |
| `dossier-ryan` | Packet | Keep | Ryan's photograph and member profile. |
| `dossier-kevin` | Packet | Keep | Kevin's photograph and member profile. |
| `dossier-sam` | Packet | Keep | Sam's photograph and member profile. |
| `dossier-oneSheet` | OneSheet | Keep | Folded band introduction and booking details. Confirm factual copy/contact. |
| `dossier-handbill` | Handbill | Keep one copy | Distinctive flip-over band artwork; replaces the separate top-level `poster` copy. |
| `dossier-zine` | MiniZine | Keep | A deeper discovery with page-turning; content review before shipping. |

Initial essentials plus this set create the richer second arrangement. The first open-state experiment should use these exact candidates before adding more novelty.

## Proposed deferrals and duplicate removal

These are scope proposals, not deletion instructions. Keep reusable components and standalone stories.

| Existing ID / component | Proposal | Reason |
| --- | --- | --- |
| `dossier-live` / video Polaroid | Omit from desk MVP roster | Handheld already owns live video; avoids two competing players of the same performance. Polaroid remains available for photos. |
| `dossier-pass` / TourPass | Move role to initial `tour-next-*` passes | Upcoming dates should already be visible. Do not maintain a second copy of the same show. |
| `dossier-ticket` / AdmissionTicket | Defer | Another event-shaped object risks confusing real show information with fictional props. Reconsider if it adds a specific discovery. |
| `poster` / top-level Handbill | Omit duplicate instance | Keep the dossier's single flip-over handbill. This is not the deferred wall-poster experience. |
| `setTimes` / RunSheet | Defer | Duplicates event/time information and currently mixes a real-intended date with fictional running-order details. The site plan and contract already establish the promoter setting. |
| `clock` / DeskClock | Defer initially | Adds visual movement/readouts without a clear introductory role. Easy alternative to the cradle if preferred. |
| `rolodex` / Rolodex | Defer initially | Excellent world-building candidate, but a second substantial discovery toy and another content-maintenance surface. Existing cards mix fictional contacts with real band/venue names. |
| `phone` / DeskPhone | Defer initially | Large footprint, competing controls, and current desk instance disables sound. Better saved for a purposeful later discovery. |
| AnsweringMachine, spare cassette, guitar pick, standalone label maker variants | Do not add by default | Existing availability is not sufficient reason to expand MVP scope. Can replace a selected toy if Ryan prefers. |

## Calibration handoff after approval

1. Use SizingBench for the populated comparison and individual objects; ScaleBench remains the room/ruler reference.
2. Include the lamp, cue notes, selected tour passes, and selected spilled contents. “Everything” currently only enumerates top-level DESK_OBJECTS, so D02 must cover these omissions.
3. Present the roster with neutral reference papers and the ruler, fixed camera and lighting, and enough separation to see silhouettes. This is a scale/appearance review, not final arrangement approval.
4. Record real-world baseline dimensions, artwork footprint caveats, and any deliberate composition scale separately. Start Handheld refinement using the same bench context.
5. Model the initial/reveal-only membership explicitly: PerspectiveDesk's static `only` filter does not itself make excluded props appear on dossier open.

## Quick selection gate

Working initial cast: **Walkman + Handheld + show passes + dossier + site plan + contract + pen + LabelBro**, with **lamp + mug + cradle** providing the room and another toy. Opening reveals the band papers and rearranges the initial objects.

The four requested additions are confirmed. Keep the remaining proposals available for visual review; LabelBro is not an optional cut. Scale, placement and exact appearance remain the next visual gates.

Status: roster updated with Ryan's initial-desk selections; remaining proposals await visual validation. No implementation or issue closure is implied by this proposal.
