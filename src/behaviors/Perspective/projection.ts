/** A point on the surface, in its own units. */
export type SurfacePoint = { x: number; y: number };

/** The numbers the view is built from: how far the surface is tipped away, in radians, and how far off it the eye is. */
export type View = { tilt: number; depth: number; width: number; targetY?: number };

/**
 * Where a point on the screen falls on the tilted surface, in the surface's
 * units. The near edge is the hinge: it neither moves nor foreshortens, so
 * the drawn box measures the surface for us, however the page is zoomed.
 */
export function unproject(plane: HTMLElement, view: View, clientX: number, clientY: number): SurfacePoint {
  return unprojectFrom(measurePlane(plane), view, clientX, clientY);
}

/**
 * Everything `unproject` needs to know about the plane: where its near edge is
 * on the screen, how wide it is drawn, and how deep it is drawn for that width.
 *
 * Kept apart from the projection itself because taking it is the expensive
 * half — three reads off the DOM, and mid-gesture they are forced ones, since
 * the thing being dragged has just been written to. None of them change while
 * something is dragged across the plane: the plane neither moves nor resizes
 * for that. So it is measured when it really changes and held in between.
 */
export type PlaneMetrics = { left: number; bottom: number; across: number; ratio: number };

export function measurePlane(plane: HTMLElement): PlaneMetrics {
  // Measure the untransformed eye wrapper. A center hinge or negative tilt can
  // make either projected edge wider; that bounding box is not the unit scale.
  const layout = plane.parentElement?.classList.contains('perspective__eye') ? plane.parentElement : plane;
  const box = layout.getBoundingClientRect();
  return { left: box.left, bottom: box.bottom, across: box.width, ratio: box.height / (box.width || 1) };
}

/** `unproject`, off a plane already measured. */
export function unprojectFrom(plane: PlaneMetrics, { tilt, depth, width, targetY }: View, clientX: number, clientY: number): SurfacePoint {
  const perUnit = plane.across / width || 1;
  const height = width * plane.ratio;
  const across = (clientX - (plane.left + plane.across / 2)) / perUnit;
  const target = targetY ?? height;
  const up = (clientY - plane.bottom) / perUnit + height - target;
  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);
  /* How far back up the surface that point lies, from the hinge. Past the horizon there is no surface left to land on. */
  const denominator = depth * cos + up * sin;
  const back = denominator > 0 ? (up * depth) / denominator : -height;
  /* What is further back is drawn smaller; across the surface, give that back. */
  const shrink = depth / (depth - back * sin);
  return { x: width / 2 + across / shrink, y: target + back };
}

/** Where a thing's top face has to be drawn for it to stand on the surface. */
export type Stood = {
  /** How far up the surface the top face goes, as a multiple of the thing's own width. */
  rise: number;
  /** How far across, the same way: away from the eye's line, so a thing to the left of it shows its left side. */
  splay: number;
  /** Which way the thing has been laid on the surface, in radians: what it has to be turned back by to stand up straight. */
  turn: number;
};

export const FLAT: Stood = { rise: 0, splay: 0, turn: 0 };

/**
 * Where the top of a thing of this height, standing at this foot, has to be
 * drawn in the surface for it to land where the eye would see it.
 *
 * A point raised off the surface is nearer the eye than its own footprint, so
 * it is not simply drawn higher: it is thrown outward from the eye's line,
 * larger, and higher than the tilt alone would put it. How much of each
 * depends on where the thing is standing, which is why this is measured and
 * not a constant. Every screen point is somewhere on the surface, so all of it
 * comes back as a place in the surface for the top face to be drawn at, and
 * the plane's own projection does the rest.
 */
export function stand(plane: HTMLElement, view: View, foot: { left: number; top: number }, edge: { left: number; top: number }, reach: number, height: number): Stood {
  const { tilt, depth, width } = view;
  /* Where the thing stands, and where its own right-hand edge is, both on the surface. */
  const at = unproject(plane, view, foot.left, foot.top);
  const side = unproject(plane, view, edge.left, edge.top);
  /* Its own width, in the surface's units, and which way it has been laid on the surface. */
  const across = Math.hypot(side.x - at.x, side.y - at.y) / (reach || 1);
  const turn = Math.atan2(side.y - at.y, side.x - at.x);
  const h = height * across;
  if (!(across > 0) || !(h > 0)) return { ...FLAT, turn };
  /*
    How much of the surface a height of h is worth. The surface foreshortens
    depth by cos, so h * tan of it draws as h * sin — which is what a height of
    h looks like from this far above. That is the whole of the rise: the eye's
    own distance does not come into it, because it scales the thing and the
    surface it stands on alike.
  */
  const rise = h * Math.tan(tilt);
  /*
    And the lean. Standing up brings the top nearer the eye, which throws it out
    from the eye's line by this much of however far off that line it stands: a
    thing to the left shows its left side. It is small, and meant to be — it is
    what says you are standing to one side of the thing rather than over it.
  */
  const splay = ((h * Math.cos(tilt)) / depth) * (at.x - width / 2);
  return { rise: rise / across, splay: splay / across, turn };
}
