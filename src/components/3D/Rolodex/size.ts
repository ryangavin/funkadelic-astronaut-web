/** The Rolodex's physical size, derived from its inch-scaled drawing (624 deep
 * by 518 across, its cards 408 tall). Plain TypeScript so the Node tests can read it. */
/** How wide it is, in millimetres. */
export const ROLODEX_WIDTH_MM = 137.05;
/** How deep its plan is against its width. */
export const ROLODEX_RATIO = 624 / 518;
/** How tall it stands, in millimetres. */
export const ROLODEX_TALL = 107.95;
/** How it stands in a Solid: its height as a fraction of its drawing's width, and where it meets the desk. */
export const ROLODEX_SOLID = { localCoordinates: true, height: 408 / 518, foot: { x: 0.5, y: 312 / 518 } };
