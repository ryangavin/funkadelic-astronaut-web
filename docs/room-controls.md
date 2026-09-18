# Room measurements and experimental controls

`Room` and `PerspectiveDesk` accept the same physical setup. All physical dimensions are millimetres; `mmToUnits` remains a fixed **1.2 desk units per millimetre**, independent of browser size, framing, or object placement. Defaults remain a 1200 × 800 mm desktop at 750 mm above the floor, with a 10 mm drawn edge.

`cameraMode="legacy"` is the default and uses existing `angle` and `depth` props. In `cameraMode="physical"`, supply both `eyeHeightMm` (above the floor) and `viewerSetbackMm` (horizontal distance back from the front edge). These override angle/depth. The target is the front edge midpoint:

- angle = atan2(eyeHeightMm − deskHeightMm, viewerSetbackMm)
- camera distance = hypot(eyeHeightMm − deskHeightMm, viewerSetbackMm) × 1.2

Zero setback is overhead. Eye height must exceed tabletop height; desk dimensions and camera distance must be positive and finite. Edge and setback can be zero. Invalid numeric edits display a recoverable diagnostic while retaining the last valid scene, including placements, lamp pose and switch state. Changing physical dimensions updates desk units, floor drop, wall position, lighting surfaces, and object-shadow viewBoxes. Objects retain their physical units: a wider desk fitted into the same viewport makes them smaller on screen, not larger in millimetres.

`deskShare` and `roomLip` remain **framing**, not physical camera distance or field of view. Numeric framing controls have no aesthetic maximum. `roomSpanMm`, `floorFrontMm`, and `wallHeightMm` control how much room geometry exists; increase them if experimentation exposes its boundaries.

Both **Foundations / Room / Physical Setup** and **Pages / Perspective Desk / Physical Setup** contain objects, labeled sliders and unrestricted numeric inputs. Physical readouts show millimetres plus inches (`mm / 25.4`); inches are display-only. Slider windows are convenient suggestions, not scene limits: typing a value outside the window preserves that value and parks the slider at the nearest endpoint. The inline fields maintain local experimental edits. Changing the Storybook controls resets those inline edits to the new external settings. Every advanced light-shaping value has its own labeled numeric Storybook control. Existing scenes retain their old defaults. PerspectiveDesk's saved settings include physical inputs, camera mode, and the light-tuning object.

## Light

`lampIntensity` is relative emitted pool brightness, not an opacity: zero emits no light, one preserves the original, and values above one brighten pool colors. Zero also removes lamp-driven shadows while retaining contact cues. The switch is independent. `shadowStrength` and `roomDim` are normalized alpha-like values and remain between zero and one.

`lightTuning` accepts these named artistic controls (defaults in parentheses):

| Property | Meaning |
| --- | --- |
| `poolSpread` (1.4) | Desk light-pool diameter / bulb height |
| `floorPoolSpread` (1.1) | Floor light-pool radius / bulb height above floor |
| `poolFalloff` (1.6) | Lamp shadow mask radius / bulb height |
| `shadowReach` (1440) | Lamp and legacy point-shadow reach cap, in desk units |
| `shadowScaleLimit` (4) | Object silhouette and lamp shadow radius scale cap |
| `shadowAttenuation` (1000) | Distance in desk units where object shadow alpha halves |
| `floorShadowLimit` (3) | Cap on tabletop-height / bulb-clearance ratio |
| `floorShadowTemper` (0.42) | Floor shadow throw multiplier |

These are visual shaping controls, not claimed physically based lighting. Numerical values have no aesthetic upper bound. Scale limit must be at least one; attenuation must be positive; other shaping values are nonnegative. Remaining legacy approximations include a one-unit minimum bulb/occluder clearance, a separate three-times-size cap in the older point-shadow helper, fixed shadow slice/ring counts and softness, and fixed drawn material highlights. `poolFalloff` shapes the lamp-shadow mask; the desk pool's painted radial gradient remains fixed. Extremely bright colors eventually saturate the browser's color range.

## Representation limits

The room surfaces use perspective, while objects are 2.5D artwork. This is not a free-flight 3D renderer. Near-horizontal views can expose cutout/extrusion artifacts; no aesthetic angle clamp hides them. Elevated artwork planes at or above the camera eye clearance cannot be represented by projection back onto the tabletop. They are explicitly hidden with zero scale rather than producing infinity or inverted drawings. Physical mode displays its eye clearance and this rule. Only machine-precision tolerance is used at equality. Lowering an object or raising the eye restores the layer. Some independently drawn Solid objects use an approximate extrusion rather than this elevated-layer rule.

Stores and imperative subscriptions remain responsible for dragging and lighting. Physical camera changes refresh pointer-projection measurements; ordinary light changes retain the camera object's identity.

The Physical Setup interaction checks run only in test mode. Ordinary Storybook browsing leaves the initial dimensions, lighting and placements untouched; it does not replay the resizing/dragging stress test.

## Preview performance check (2026-09-18)

Before the test-mode guard, opening either Physical Setup story replayed its interaction test in the normal preview: desk size ended at 1600 × 1000 mm, light intensity at 3, pool spread at 2.8, and the lamp was moved and aimed. Those were unintended test settings, not the scene defaults. Normal browsing now retains 1200 × 800 mm, intensity 1, spread 1.4 and the supplied lamp placement.

A local headless Chromium comparison used the existing DeskPerf `dragCost`, `dragLag`, `frameSeries` and `attribute` probes. Both stories were set to angle 78°, camera distance 5700, a 1200 × 800 mm desk, identical four-object placements (cradle, mug, handheld, pen), lamp position 396/17 and pose, intensity 1, spread 1.4, and an 1100 × 618.75 px room frame. Experimental controls were hidden during measurement. Three 32-move samples per interaction produced:

| Story | Lamp drag median frame (samples) | Lamp aim median frame (samples) | Synthetic input-to-style commit, drag / aim |
| --- | --- | --- | --- |
| Foundations / Room / Physical Setup | 27.9 / 28.1 / 28.0 ms | 27.5 / 27.0 / 27.1 ms | 0.5 / 1.7 ms |
| Pages / Perspective Desk / Desk | 26.2 / 26.2 / 26.1 ms | 25.5 / 25.6 / 25.6 ms | 0.4 / 1.7 ms |

The chronological frame probe agreed with these medians. On the matched Desk scene, removing the room reduced the frame median by 9.4 ms (36%); removing the desk's floor shadow reduced it by 7.1 ms (27%). These are overlapping attribution experiments, not additive savings. The measured cost is predominantly shared rendering; the small residual does not establish a distinct React/input regression. No renderer change or experimental range clamp was justified by this comparison.

These are local synthetic/headless measurements, not a hardware-independent frame-rate promise. Input-to-style timing excludes browser input-queue delay; attribution hides layers and is diagnostic only. Original full physical settings, larger light pools, and other machines can have different drawing costs.

Room backgrounds automatically extend the floor and wall to cover the 16:9 frame
when their extent props are omitted. Coverage is derived from the same camera,
desk size and framing as the objects, so changing eye height or desk width does
not expose the sides of a finite background. Board and brick sizes, the shared
floor/wall seam, and the lamp's floor coordinates remain in physical units.

`roomSpanMm`, `floorFrontMm` and `wallHeightMm` remain exact overrides. Setting
one deliberately disables automatic coverage for that dimension; clear it to
restore automatic coverage. This may expose an edge when exploring finite room
sizes. The automatic calculation adds a small bleed for antialiasing/blur and
retains the existing minimum room dimensions rather than allocating an enormous
fixed backdrop. It assumes Room's standard 16:9 crop.
