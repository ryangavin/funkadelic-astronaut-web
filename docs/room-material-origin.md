# Stable room materials

Room coverage is a crop of a fixed material grid. Its origin is the midpoint of the wall-floor junction: floor coordinates run right and forward from that seam, while wall coordinates run right and downward (visible wall rows therefore have negative y coordinates).

`DeskRoom` passes `materialOrigin` to `Floor` and `Wall`. This is the world coordinate of the crop's top-left corner, in the existing desk units. Expanding the centered span changes its left coordinate; extending the wall upward changes its top coordinate. Neither operation changes board joints, brick bond, or the finish assigned to existing world cells. Floor rows and wall bricks use signed indices, so partial cells at negative crop edges retain their identities.

The room floor uses fixed 720-unit grain tiles, filtered inside each tile, rather than filtering a crop-sized gradient. Course tone, pores, wall bond masks, brushwork, and grit also have fixed material coordinates. This avoids re-seeding, stretching, or rephasing textures when automatic coverage changes. Floor and wall lighting/shadows remain separate from material coordinates. Standalone components without `materialOrigin` retain their existing drawing.

The existing room material budget still runs before either material is allocated. Anchoring does not create an oversized backing surface: only intersecting rows/cells are generated. For the room's floor origin (y=0) and wall origin (y=−height), the existing course and cell bounds continue to cover the allocation.

Run `node --test tests/material-coordinates.test.cjs tests/room-coverage.test.cjs` for signed coordinate and capacity checks. With a unified preview running, run `PREVIEW_URL=http://127.0.0.1:4175 node tests/room-material-origin.browser.mjs` for world-landmark, pixel, and camera/viewport checks. **Debug / Room Materials / Stable Coverage** provides a fixed-camera crop toggle for visual comparison.
