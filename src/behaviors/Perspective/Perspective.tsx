import { createContext, useCallback, useContext, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { MovableProject } from '../Movable/Movable';
import './Perspective.css';

/** Straight down: the angle every thing in this library is drawn at. */
export const PLAN_VIEW = 90;
/** Standing at a desk, looking down at it: the angle this behavior was built for. */
export const STANDING_VIEW = 60;
/** A little off overhead: keeps the original plan artwork almost round. */
export const GENTLE_VIEW = 84;
/** How far the eye is from the surface, in the surface's own units. Far enough that the convergence is gentle. */
export const PERSPECTIVE_DEPTH = 3200;
/** A distant eye keeps the gentle view almost parallel across the desk. */
export const GENTLE_DEPTH = 8000;
/** The design width of a surface, in units, matching a sheet and a desk. */
export const PERSPECTIVE_WIDTH = 1440;

export type PerspectiveProps = {
  /** Where the eye is, in degrees above the surface. 90 is straight down, the way everything is drawn; 60 is standing at a desk. */
  angle?: number;
  /** How far the eye is from the surface, in the surface's units: far away converges gently, near sharply. */
  depth?: number;
  /** The surface's design width in units, for turning the pointer's travel back into units. */
  width?: number;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/** A point on the surface, in its own units. */
export type SurfacePoint = { x: number; y: number };

/** The numbers the view is built from: how far the surface is tipped away, in radians, and how far off it the eye is. */
export type View = { tilt: number; depth: number; width: number };

/**
 * Where a point on the screen falls on the tilted surface, in the surface's
 * units. The near edge is the hinge: it neither moves nor foreshortens, so
 * the drawn box measures the surface for us, however the page is zoomed.
 */
export function unproject(plane: HTMLElement, { tilt, depth, width }: View, clientX: number, clientY: number): SurfacePoint {
  const box = plane.getBoundingClientRect();
  const perUnit = box.width / width || 1;
  const height = (width * plane.offsetHeight) / (plane.offsetWidth || 1);
  const across = (clientX - (box.left + box.width / 2)) / perUnit;
  const up = (clientY - box.bottom) / perUnit;
  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);
  /* How far back up the surface that point lies, from the hinge. Past the horizon there is no surface left to land on. */
  const denominator = depth * cos + up * sin;
  const back = denominator > 0 ? (up * depth) / denominator : -height;
  /* What is further back is drawn smaller; across the surface, give that back. */
  const shrink = depth / (depth - back * sin);
  return { x: width / 2 + across / shrink, y: height + back };
}

/** The view of the surface, for the things standing on it. The plane itself they find by looking up. */
const PerspectiveView = createContext<View | null>(null);

/**
 * How the surface is being looked at, for anything that has to work in both
 * spaces at once. With `unproject` it turns a point on the screen into a point
 * on the surface; off a Perspective there is no view, and the screen is the
 * surface.
 */
export function usePerspectiveView() {
  return useContext(PerspectiveView);
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

const FLAT: Stood = { rise: 0, splay: 0, turn: 0 };

/** Where a thing meets the surface within its own drawing, as fractions of the drawing's width. */
export type Foot = { x: number; y: number };
const ON_ITS_BOTTOM: Foot = { x: 0.5, y: 1 };

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

/**
 * How deep a surface has to be, in its units, to draw a given height on the
 * screen once it is tipped away. Depth foreshortens, so a desk that is to
 * fill its frame at a standing view must be deeper than the frame is tall.
 */
export function surfaceDepth(drawn: number, { angle = GENTLE_VIEW, depth = GENTLE_DEPTH }: { angle?: number; depth?: number } = {}) {
  const tilt = ((PLAN_VIEW - angle) * Math.PI) / 180;
  const room = depth * Math.cos(tilt) - drawn * Math.sin(tilt);
  return room > 0 ? Math.round((drawn * depth) / room) : Infinity;
}

/**
 * A surface seen from where someone stands rather than from straight
 * overhead. Everything in this library is drawn in plan, looking straight
 * down; wrap a surface in this and the whole plane tips away from the near
 * edge, so what lies on it foreshortens together and the far edge recedes.
 *
 * Nothing inside changes. A transform is not layout: the surface keeps its
 * width, so container units, Pins and every measurement in units mean what
 * they meant before, and the browser hit-tests through the tilt, so what was
 * clickable still is. What is dragged is mapped back through the projection,
 * so a thing follows the pointer across the plane rather than across the
 * screen.
 *
 * What stands up on the surface — a mug, a lamp, a clock — is still drawn
 * from above, and tipping the plane would lay it flat into the wood. There
 * are two answers. A drawing can give itself a side: `--perspective-tilt`
 * inherits to everything on the plane and is 0deg where there is no
 * Perspective, so a thing of height h lifts its top face by `h * tan(tilt)`
 * and grows its side into the gap, in its own units, costing nothing at all
 * seen from above — the Mug does this, and Perspective.css has the recipe.
 * Until a thing has one, wrap it in `Standing` and it comes back upright,
 * like a cutout stood on its foot.
 */
export function Perspective({ angle = GENTLE_VIEW, depth = GENTLE_DEPTH, width = PERSPECTIVE_WIDTH, children, className = '', style }: PerspectiveProps) {
  const plane = useRef<HTMLDivElement>(null);
  const tilt = ((PLAN_VIEW - angle) * Math.PI) / 180;
  const project = useCallback(
    (clientX: number, clientY: number): SurfacePoint => (plane.current ? unproject(plane.current, { tilt, depth, width }, clientX, clientY) : { x: clientX, y: clientY }),
    [tilt, depth, width],
  );
  const vars = { '--perspective-angle': angle, '--perspective-depth': depth, '--perspective-width': width, ...style } as CSSProperties;
  return (
    <div className={`perspective ${className}`} style={vars}>
      {/* The eye: its perspective is in surface units, which only a descendant of the container can measure. */}
      <div className="perspective__eye">
        <div className="perspective__plane" ref={plane}>
          <PerspectiveView.Provider value={{ tilt, depth, width }}>
            <MovableProject.Provider value={project}>{children}</MovableProject.Provider>
          </PerspectiveView.Provider>
        </div>
      </div>
    </div>
  );
}

export type SolidProps = {
  /** Keep rectangular artwork rotated with its object; express extrusion in its local axes. */
  localCoordinates?: boolean;
  /** How tall the thing is, as a multiple of the width of its own drawing. */
  height: number;
  /** Where it meets the surface within its own drawing, as fractions of the drawing's width. Defaults to the middle of its bottom edge. */
  foot?: Foot;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/**
 * A thing on the surface that has a height of its own, and a drawing of its
 * side to go with it. It works out where the thing's top face has to be drawn
 * for it to stand at its foot, and hands the drawing two numbers, each a
 * multiple of the thing's own width: `--solid-rise` and `--solid-splay`. The
 * drawing lifts its top face by them and grows its side into the gap; the foot
 * never moves, because that is where the thing is standing. See the Mug.
 *
 * This is an illusion, not a model: two flat layers, the way you would do it
 * with paper cutouts. The drawing's own plan view is the top layer, and it
 * carries a second layer drawn straight on — the side of the thing as if you
 * were looking at it face to face. Overhead there is nothing to see and the
 * bottom layer is hidden behind the top; as the view comes down it slides out
 * from under it, stretched into the gap between them. It is one affine
 * transform, so whatever the side was drawn with — its gradients, its shading,
 * its lip — comes through intact. It gives way at extreme angles, which is not
 * the view this is for.
 *
 * Whatever the thing has been turned to on the surface it is turned back out
 * of, so its side is always drawn the way the surface runs and its lift is
 * always straight up. That turn comes back as `--solid-turn` for the drawing
 * to put on whatever really does spin about the thing's upright — a mug's
 * handle goes round, its side does not.
 *
 * All of it is nothing at all off a tilted surface, so a drawing that reads
 * them is exactly what it was when seen from straight above.
 */
export function Solid({ localCoordinates = false, height, foot = ON_ITS_BOTTOM, children, className = '', style }: SolidProps) {
  const host = useRef<HTMLDivElement>(null);
  const stands = useRef<HTMLSpanElement>(null);
  const edge = useRef<HTMLSpanElement>(null);
  const view = useContext(PerspectiveView);
  /*
    Measuring is done after every render, because the thing moves: it is dragged
    about the desk, and the view of it can change. It is kept in a ref so the
    watch below can be set up once and still call the current one — a desk full
    of Solids that each built and tore down an observer every render spent more
    time in the observer than in the drawing.
  */
  const measurer = useRef<() => void>(() => {});
  useLayoutEffect(() => {
    const element = host.current;
    const mark = stands.current;
    const side = edge.current;
    if (!element || !mark || !side) return;
    /* The plane is found rather than handed down: a ref of an ancestor's is not attached yet when this runs. */
    const plane = element.closest<HTMLElement>('.perspective__plane');
    const measure = () => {
      const stood =
        plane && view && view.tilt > 0 ? stand(plane, view, mark.getBoundingClientRect(), side.getBoundingClientRect(), 1 - foot.x, height) : FLAT;
      if (localCoordinates) {
        const c = Math.cos(stood.turn), s = Math.sin(stood.turn);
        element.style.setProperty('--solid-rise', String(stood.splay * s + stood.rise * c));
        element.style.setProperty('--solid-splay', String(stood.splay * c - stood.rise * s));
        element.style.setProperty('--solid-turn', '0deg');
        return;
      }
      element.style.setProperty('--solid-rise', String(stood.rise));
      element.style.setProperty('--solid-splay', String(stood.splay));
      element.style.setProperty('--solid-turn', `${(stood.turn * 180) / Math.PI}deg`);
    };
    measurer.current = measure;
    measure();
  });

  /* The watch itself outlives the renders: the plane and the thing keep their
     boxes, and only what is measured off them changes. */
  useLayoutEffect(() => {
    const element = host.current;
    if (!element) return;
    const plane = element.closest<HTMLElement>('.perspective__plane');
    const observer = new ResizeObserver(() => measurer.current());
    if (plane) observer.observe(plane);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const vars = { '--solid-foot-x': foot.x, '--solid-foot-y': foot.y, ...style } as CSSProperties;
  return (
    <div ref={host} className={`solid ${className}`} style={vars}>
      {/* Where the thing stands, and its own right-hand edge: everything about it is worked out from these two. */}
      <span ref={stands} className="solid__stands" aria-hidden="true" />
      <span ref={edge} className="solid__edge" aria-hidden="true" />
      {/* Turned back out of however it was laid down, so what is inside is drawn the way the surface runs. */}
      <div className="solid__upright">{children}</div>
    </div>
  );
}

export type StandingProps = {
  /** How upright it stands, 0 to 1: 1 takes back all the foreshortening, 0 leaves it lying in the surface. */
  upright?: number;
  /** The shadow it casts where it meets the surface. `true` for the usual strength, a number for an opacity. */
  shadow?: boolean | number;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/**
 * A thing on a tilted surface that stands up off it. Its foot stays where it
 * was put and it rises from there, taking back exactly the foreshortening
 * the surface applied, so a drawing made in plan keeps its own proportions
 * and reads as an object standing on the desk. A drawing in plan is not a
 * drawing of a standing object, so this is a cutout stood on its foot, not a
 * three-quarter view: it is convincing for a mug or a clock at a glance, and
 * the honest fix for anything bigger is to draw it from the front.
 *
 * It scales rather than turning, so the surface stays flat to the screen and
 * everything laid on it keeps its stacking order. Put it inside whatever
 * places the thing, so its own tilt on the desk is not undone: a Standing
 * thing is turned about its upright, which a plan drawing cannot show.
 */
export function Standing({ upright = 1, shadow = true, children, className = '', style }: StandingProps) {
  const vars = { '--standing-upright': upright, '--standing-shadow': typeof shadow === 'number' ? shadow : undefined, ...style } as CSSProperties;
  return (
    <div className={`standing ${className}`} style={vars}>
      {shadow ? <span className="standing__shadow" aria-hidden="true" /> : null}
      <div className="standing__body">{children}</div>
    </div>
  );
}
