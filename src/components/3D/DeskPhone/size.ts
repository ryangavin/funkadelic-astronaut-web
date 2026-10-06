/** Independent rotary desk phone. Measurements are millimetres; the artwork
 * includes room beside the housing for the handset cord. Plain TypeScript so
 * the Node tests can read it. */
/** How wide the whole arrangement is, in millimetres. */
export const DESK_PHONE_WIDTH = 320;
/** How deep, in millimetres. */
export const DESK_PHONE_DEPTH = 300;
/** The 500's housing: 221 millimetres across the front. */
export const SET_WIDTH = 221;
/** And 229 from front to back. */
export const SET_DEPTH = 229;
/** The moulding on its own, up to the rim of the cradle: what actually stands
 * up off the desk. The 500 stands 137 millimetres with the handset on it; the
 * handset lying in the saddle makes up the rest, and it is drawn on the top
 * face rather than extruded, so standing the whole plan at 137 would read as a
 * block rather than a phone. */
export const SET_BODY_HEIGHT = 68.5;
/** Where the set's footprint begins in the plan: 72 from the left edge, 36 from the back. */
const SET_AT = { x: 72, y: 36 };
/** Height relative to this phone-only drawing: the body, not the handset. */
export const DESK_PHONE_HEIGHT = SET_BODY_HEIGHT / DESK_PHONE_WIDTH;
export const DESK_PHONE_FOOT = {
  x: (SET_AT.x + SET_WIDTH / 2) / DESK_PHONE_WIDTH,
  y: (SET_AT.y + SET_DEPTH / 2) / DESK_PHONE_WIDTH,
};
