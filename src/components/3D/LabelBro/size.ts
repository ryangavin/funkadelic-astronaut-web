/** The Label Bro's physical size. Plain TypeScript so the Node tests can read it.
 * Its drawing is counted in quarter-millimetres (see ./keyboard.ts). */
import { BODY } from './keyboard.ts';

/** How wide the machine is, in millimetres: 183. */
export const LABEL_BRO_WIDTH_MM = BODY.w / 4;
/** How deep its plan is against its width. */
export const LABEL_BRO_RATIO = BODY.h / BODY.w;
/** How thick it is, in millimetres. */
export const LABEL_BRO_TALL = 78;
/** How thick the machine is, as a multiple of the width of its drawing: 78 mm against 183. */
export const LABEL_BRO_HEIGHT = 312 / BODY.w;
/** Where it meets the desk within its own drawing: the middle of its footprint, since it sits flat on all of it. */
export const LABEL_BRO_FOOT = { x: 0.5, y: 0.5 };
