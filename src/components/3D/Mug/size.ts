/** The mug's physical size. Plain TypeScript so the Node tests can read it. */
/** How wide the mug's drawing is, in millimetres: room round the body for its shadow. */
export const MUG_DRAWING_MM = 140;
/** How tall a mug is, in millimetres. */
export const MUG_TALL = 95;
/** Estimated ordinary coffee-mug height relative to its 140 mm artwork box.
 * The visible body occupies 140/240 of that box: about 82 mm diameter. */
export const MUG_HEIGHT = MUG_TALL / MUG_DRAWING_MM;
/** Where it stands within that drawing: the middle of it, now that nothing stands beside it. */
export const MUG_FOOT = { x: 0.5, y: 0.5 };
