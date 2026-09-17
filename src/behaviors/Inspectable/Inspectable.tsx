import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { unproject, usePerspectiveView } from '../Perspective/Perspective';
import './Inspectable.css';

/** How much of the stage a thing held up fills, across and down. */
export const INSPECT_FILL = 0.82;
/** How large a thing may be drawn when held up, as a multiple of its size on the surface. */
export const INSPECT_MAX_SCALE = 14;

/** Presses that belong to whatever they landed on: picking a thing up is never also working it. */
const INSPECT_CONTROLS = 'button, a, input, select, textarea, iframe, video, [role="slider"], [role="button"], [role="switch"]';
/** Controls that must always be left alone, even on a thing that is picked up by its whole face. */
const HELD_CONTROLS = 'input, select, textarea, iframe, video, [role="slider"]';

type Inspection = {
  /** Which thing is being held up, if any. */
  held?: string;
  /** Pick a thing up to look at it. */
  inspect: (id: string) => void;
  /** Put it back down. */
  release: () => void;
  /** The frame a held thing is brought to the middle of. */
  stage: { current: HTMLElement | null };
};

const InspectorContext = createContext<Inspection | null>(null);

/**
 * Whether anything is being looked at, and how to pick a thing up or put it
 * down. Whoever owns the stacking on the surface reads this: a thing held up
 * has to be drawn above everything else on it, and only the composition knows
 * what else is there.
 */
export function useInspection() {
  return useContext(InspectorContext);
}

export type InspectorProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** Which thing is held, when the composition owns that. Leave it out and the Inspector keeps it itself. */
  held?: string;
  /** Called when a thing is picked up or put down. */
  onInspect?: (held: string | undefined) => void;
  children?: ReactNode;
};

/**
 * The frame things are held up in front of. It is the stage: a thing picked
 * up off the surface is brought to the middle of this box and grown until it
 * nearly fills it, so whatever is wrapped in this is what a held thing is
 * measured against. Escape puts down whatever is being held.
 */
export function Inspector({ className = '', children, ...rest }: InspectorProps) {
  const { held: controlled, onInspect, ...attributes } = rest;
  const stage = useRef<HTMLDivElement>(null);
  const [own, setOwn] = useState<string>();
  /* Saying which thing is held is what makes it the composition's to decide, whether or not anything is held just now. */
  const held = 'held' in rest ? controlled : own;
  const change = useCallback((next: string | undefined) => {
    setOwn(next);
    onInspect?.(next);
  }, [onInspect]);
  const inspect = useCallback((id: string) => change(id), [change]);
  const release = useCallback(() => change(undefined), [change]);

  useEffect(() => {
    if (!held) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        release();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [held, release]);

  const inspection = useMemo(() => ({ held, inspect, release, stage }), [held, inspect, release]);

  return (
    <div {...attributes} ref={stage} className={`inspector ${className}`} data-inspecting={held ? '' : undefined}>
      <InspectorContext.Provider value={inspection}>{children}</InspectorContext.Provider>
    </div>
  );
}

/**
 * What lies between the surface and the thing held up off it. It is drawn on
 * the surface itself, so it takes the surface's own perspective, and it throws
 * everything painted beneath it out of focus — the wood, the light, the other
 * things lying on it. Put it on the surface, wherever the things on it are
 * drawn; it is nothing at all until something is picked up.
 */
export function InspectorVeil({ className = '' }: { className?: string }) {
  const inspection = useInspection();
  if (!inspection) return null;
  return (
    <button
      type="button"
      className={`inspector__veil ${className}`}
      data-held={inspection.held ? '' : undefined}
      tabIndex={inspection.held ? 0 : -1}
      aria-hidden={inspection.held ? undefined : true}
      aria-label="Put it back down"
      onClick={() => inspection.release()}
    />
  );
}

export type InspectableProps = {
  /** What this thing is called in the inspection: the same name the surface stacks it by. */
  id: string;
  /** How much of the stage it fills when held up, 0 to 1. */
  fill?: number;
  /** The largest it may be drawn, as a multiple of its size on the surface. */
  maxScale?: number;
  /** Whether it straightens as it comes up. A sheet lying askew is easier to read square on; a thing that is
      meant to be seen the way it lies — a cassette in a machine — keeps its tilt. */
  upright?: boolean;
  /** What part of the drawing the thing actually is, as a selector within it. A drawing is often the thing plus
      whatever room it needed beside it — a closed folder is drawn on half of a spread — and it is the thing, not
      the room round it, that is brought to the middle of the frame and filled out to it. Defaults to the whole drawing. */
  subject?: string;
  /** Where it can be picked up: by its `body`, clear of anything that works, or `anywhere`, for a sheet whose whole
      face is a button to turn it. Picked up anywhere, the first press takes it off the desk and never reaches the
      face; once it is up, every press on it is the face's again, so a handbill is turned over while it is being read. */
  grab?: 'body' | 'anywhere';
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/**
 * A thing on a surface that can be picked up and looked at. Click it and it
 * comes off the surface to the middle of the Inspector's frame, growing until
 * it nearly fills it, while everything behind it goes soft. Click away, or
 * press Escape, and it settles back exactly where it was lying.
 *
 * It never leaves the surface it is drawn on, which is the whole trick: the
 * plane's own perspective still applies to it, so a thing brought up close is
 * seen from the same place the desk is, at the same angle, rather than turning
 * flat to the screen. It is the same elements throughout — nothing is
 * remounted — so a video goes on playing, a machine keeps whatever it was
 * showing, and every button on it still works while it is up.
 *
 * Wrap it round whatever a Movable holds. While a thing is held up it is not
 * lying on the desk any more, so presses on it no longer reach the Movable and
 * it cannot be dragged, turned or resized until it is put back down.
 */
export function Inspectable({ id, fill = INSPECT_FILL, maxScale = INSPECT_MAX_SCALE, upright = true, grab = 'body', subject, children, className = '', style }: InspectableProps) {
  const host = useRef<HTMLDivElement>(null);
  const inspection = useInspection();
  const view = usePerspectiveView();
  const held = inspection?.held === id;
  const [remeasure, setRemeasure] = useState(0);

  /*
    Where the thing has to be drawn to land in the middle of the stage, and how
    much bigger. Both are measured rather than worked out from the drawing: what
    a thing is in units says nothing about how big it comes out on the screen
    once the plane it lies on has foreshortened it.

    It is measured by standing the thing in its held pose and looking at where
    that puts it, which is why the measuring is done with the transition off:
    all of it happens before anything is painted, and the last thing done is to
    put the transition back and let the hold run from nothing to all of it.
  */
  useLayoutEffect(() => {
    const element = host.current;
    const stage = inspection?.stage.current;
    if (!element) return;
    if (!held) {
      element.style.setProperty('--inspect-hold', '0');
      return;
    }
    if (!stage) return;
    const plane = element.closest<HTMLElement>('.perspective__plane');
    const frame = stage.getBoundingClientRect();
    const target = { x: frame.left + frame.width / 2, y: frame.top + frame.height / 2 };

    /* Where a point on the screen falls on the plane, and what a unit of the plane is worth in its own pixels. */
    const onPlane = (x: number, y: number) => (plane && view ? unproject(plane, view, x, y) : { x, y });
    const perUnit = plane && view ? plane.offsetWidth / view.width : stage.getBoundingClientRect().width / (stage.offsetWidth || 1);

    const set = (name: string, value: string) => element.style.setProperty(name, value);
    /* What is measured is the thing itself, which is not always the whole of the drawing it is in. */
    const drawn = () => (subject ? element.querySelector(subject) ?? element : element).getBoundingClientRect();
    element.dataset.measuring = '';
    set('--inspect-hold', '1');
    set('--inspect-dx', '0px');
    set('--inspect-dy', '0px');

    /* Held square on and still its own size: what there is to fit into the frame. */
    set('--inspect-scale', '1');
    const rest = drawn();
    let scale = Math.min((frame.width * fill) / (rest.width || 1), (frame.height * fill) / (rest.height || 1));
    scale = Math.min(Math.max(scale, 1), maxScale);

    /* Grown, and then carried to the middle of the frame across the plane rather than across the screen. */
    let dx = 0;
    let dy = 0;
    for (let pass = 0; pass < 2; pass += 1) {
      set('--inspect-scale', String(scale));
      set('--inspect-dx', `${dx}px`);
      set('--inspect-dy', `${dy}px`);
      const box = drawn();
      const to = onPlane(target.x, target.y);
      const from = onPlane(box.left + box.width / 2, box.top + box.height / 2);
      dx += (to.x - from.x) * perUnit;
      dy += (to.y - from.y) * perUnit;
      /* Carrying it forward brings it nearer the eye, which draws it larger: take that back out of the size. */
      const fits = Math.min((frame.width * fill) / (box.width || 1), (frame.height * fill) / (box.height || 1));
      scale = Math.min(Math.max(scale * fits, 1), maxScale);
    }
    set('--inspect-scale', String(scale));
    set('--inspect-dx', `${dx}px`);
    set('--inspect-dy', `${dy}px`);

    /* Back down where it was lying, committed, and then let go: the hold is the only thing that moves. */
    set('--inspect-hold', '0');
    void element.getBoundingClientRect();
    delete element.dataset.measuring;
    set('--inspect-hold', '1');
  }, [held, fill, maxScale, subject, inspection?.stage, view, remeasure]);

  /* The frame can change under a thing that is already up — the window is resized, the desk reflows. */
  useEffect(() => {
    const stage = inspection?.stage.current;
    if (!held || !stage) return;
    const again = () => setRemeasure(count => count + 1);
    const observer = new ResizeObserver(again);
    observer.observe(stage);
    window.addEventListener('resize', again);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', again);
    };
  }, [held, inspection?.stage]);

  /* Held up, it takes focus, so Escape and every key on it are the held thing's. */
  useEffect(() => {
    if (held) host.current?.focus({ preventScroll: true });
  }, [held]);

  /*
    From the keyboard, the thing itself is what has focus — a Movable puts it on
    its own box, and what it holds is never in the tab order while it is lying
    down. So the key is bound there, on whatever is holding this: Enter on a
    thing that can be looked at picks it up, which is the click again. The
    Movable knows nothing of it, and a thing nothing is holding has no key.
  */
  useEffect(() => {
    const holder = host.current?.closest<HTMLElement>('.movable');
    if (!holder || held || !inspection) return;
    const key = (event: KeyboardEvent) => {
      if (event.target !== holder || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      inspection.inspect(id);
    };
    holder.addEventListener('keydown', key);
    return () => holder.removeEventListener('keydown', key);
  }, [held, id, inspection]);

  if (!inspection) return <>{children}</>;

  return (
    <div
      ref={host}
      className={`inspectable ${className}`}
      data-held={held ? '' : undefined}
      data-upright={upright ? '' : undefined}
      tabIndex={held ? -1 : undefined}
      style={style}
      /* A thing picked up by its whole face is taken before its face ever hears the press, so turning a
         handbill over is something that happens while it is being read rather than on the way up. */
      onClickCapture={event => {
        if (held || grab !== 'anywhere' || (event.target as Element).closest(HELD_CONTROLS)) return;
        event.stopPropagation();
        event.preventDefault();
        inspection.inspect(id);
      }}
      onClick={event => {
        /* A drag ends in a swallowed click, so what is left here is a press that stayed put. A press on
           something that works — a key on the label printer, a button on the handheld — is that thing's
           own, whether the thing is up in the air or lying on the desk. */
        if (held || grab === 'anywhere' || (event.target as Element).closest(INSPECT_CONTROLS)) return;
        event.stopPropagation();
        inspection.inspect(id);
      }}
      /* Up in the air it is not lying on the desk any more: presses on it never reach the Movable under it. */
      onPointerDown={event => {
        if (held) event.stopPropagation();
      }}
    >
      {children}
    </div>
  );
}
