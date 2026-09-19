# Room measurements and experimental controls

`Room` and `PerspectiveDesk` accept the same physical setup. All physical dimensions are millimetres; `mmToUnits` remains a fixed **1.2 desk units per millimetre**, independent of browser size, framing, or object placement. Defaults remain a 1200 × 800 mm desktop at 750 mm above the floor, with a 10 mm drawn edge.

`cameraMode="legacy"` is the default and retains its angle/depth props and front-edge projection. Physical mode requires `eyeHeightMm` above the floor and `viewerSetbackMm`, the horizontal eye distance **from the wall**.

`headTiltDegrees` is the absolute downward pitch from horizontal: 90° looks straight down; angles above 90° look toward increasing wall distance. The stable default is 74.47588900324574°. Eye position and gaze come directly from these three props. Changing desk height or depth never turns the camera toward tabletop center or any other tracked point.

For clearance H = eyeHeightMm − deskHeightMm and pitch α = headTiltDegrees, the CSS representation uses the gaze/desk-plane intersection `viewerSetbackMm − H / tan(α)` and projection depth `H / sin(α)`. This intersection is a derived coordinate, not a camera target input, and may lie outside the tabletop. This surface renderer supports downward pitches strictly between 0° and 180°; invalid directions produce a recoverable diagnostic rather than a silent clamp. Previously copied offset-based settings must be converted to their desired absolute pitch; explicit zero is invalid.

The principal point sits at frame center with `roomLip` as a fixed upward screen offset, with or without the room background. Floor and wall landmarks remain fixed when desk dimensions change at fixed eye, pitch and lens; the tabletop moves through that view. Legacy keeps its front-edge/bottom framing.

Physical mode retains a fixed lens calibrated to the previous 1200 mm desk and 900/650 mm reference triangle. `deskShare` is reference framing, never automatic fit-to-desk zoom. Doubling clearance at the same pitch halves the projected width at the gaze/desk intersection. Widening a desk does not shrink existing objects. `roomLip` and `deskShare` remain explicit framing choices.

`horizontalFieldOfViewDegrees` controls the physical lens independently of eye position and head tilt. Larger horizontal angles show more of the room; smaller angles narrow the shot. It must be finite and strictly between 0° and 180°; the sidebar offers 20–110° as a convenient range. Very wide views may exceed room material capacity and retain the previous scene. When omitted, each scene preserves its existing `deskShare` reference lens exactly (about 68.08° at share 0.8). Once specified, FOV sets focal length as frame width / (2 tan(FOV / 2)); `deskShare` only contributes to the existing `roomLip` principal-point offset. The lens is shared by objects, floor, wall, shadows, coverage preflight and pointer inversion, including scenes without a room background. Saved PerspectiveDesk settings include this prop.

Eye height must exceed tabletop height. Desk dimensions and projection depth must be positive and finite; edge thickness and wall distance may be zero. Invalid edits retain the last valid scene, object placements and lamp pose. Physical dimensions update desk units, floor drop, wall location, lighting surfaces and shadow viewBoxes. Automatic background coverage uses the same target and framing; views exceeding material capacity retain the previous scene. Explicit room extents may deliberately expose boundaries.

Both **Foundations / Room / Physical Setup** and **Pages / Perspective Desk / Physical Setup** contain objects, labeled sliders and unrestricted numeric inputs. Physical readouts show millimetres plus inches (`mm / 25.4`); inches are display-only. Slider windows are convenient suggestions, not scene limits: typing a value outside the window preserves that value and parks the slider at the nearest endpoint. Inline fields update Storybook args directly, so Save Story retains their values. External controls and Reset Controls update the same values. Every advanced light-shaping value has its own labeled numeric Storybook control. Existing scenes retain their old defaults. PerspectiveDesk's saved settings include physical inputs, camera mode, and the light-tuning object.

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

Supported views also have a material-rendering resource bound: at most 128
filtered floor courses and 10,000 estimated floor/brick cells. The shared extent
resolver checks this before material arrays are created, including for explicit
extent overrides. A near-table overhead view can be geometrically valid yet
exceed this budget. Room shows an explicit capacity alert and retains its last
supported scene and arrangement; the entered controls remain visible and are not
silently clamped. Adjust the camera, reduce explicit extents, or disable
the room background to recover. Direct DeskRoom usage shows the capacity alert
instead of allocating the oversized materials. This is a renderer limit rather
than an aesthetic camera-angle restriction.

The shared controls sidebar includes an optional **Show FPS overlay** checkbox. It is off by default and mounts the existing animation-frame timing overlay only while enabled. The physical camera status appears beneath the scene; recoverable setup errors remain above it. Scale Bench opens directly into the shared controls and preview.

The wall window stays horizontally centered over the desk. `windowHeightMm` changes the opening height; `windowSillHeightMm` sets its bottom above the floor. Width stays 1100 mm. Both sidebar fields write real Storybook args. The SVG joinery and open casements are layered illustrations on the existing wall plane, with no mesh or extra camera.
