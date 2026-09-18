import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { Tallied } from '../../debug/DeskPerf/tally';
import { usePlaces } from './places';
import './Movable.css';

/** Where a thing lies: its top-left corner in the surface's units, its tilt, and how big it is drawn. */
export type Place = { x: number; y: number; rotation?: number; scale?: number };

/** Where a thing turns and grows about, as fractions of its own box. */
export type Pivot = { x: number; y: number };
const MIDDLE: Pivot = { x: 0.5, y: 0.5 };

/** How far the pointer travels before a press becomes a drag, in screen pixels. */
export const MOVABLE_DRAG_THRESHOLD = 5;
/** How far an arrow key moves a thing, in units; with shift held, five times that. */
export const MOVABLE_KEY_STEP = 10;
/** How far a bracket key turns a thing, in degrees; with shift held, five times that. */
export const MOVABLE_KEY_TURN = 1;
/** What a turn snaps to, in degrees, while shift is held. */
export const MOVABLE_SNAP_TURN = 15;
/** How much a key changes the size; with shift held, five times that. */
export const MOVABLE_KEY_SCALE = 0.02;
/** How small and how large a thing can be drawn. */
export const MOVABLE_MIN_SCALE = 0.25;
export const MOVABLE_MAX_SCALE = 4;

/** Presses that start on a control belong to it: the thing is picked up by its body. */
const CONTROLS = 'button, a, input, select, textarea, iframe, video, [role="slider"], [role="button"]';
/** Controls that must always be left alone: a slider is dragged, a frame has its own pointer. */
const HELD_CONTROLS = 'input, select, textarea, iframe, video, [role="slider"]';

/**
 * Screen pixels per unit, so the pointer's travel can be turned into units.
 * Set it once on the surface, from its rendered width over its design width;
 * a surface on a Stage is zoomed, so the two differ.
 */
export const MovableScale = createContext<() => number>(() => 1);

/**
 * Where a point on the screen falls on the surface, in its units. A surface
 * that is not flat to the screen sets this, and the pointer is mapped through
 * it instead of measured off by scale: a thing then follows the pointer across
 * the surface rather than across the screen.
 */
export const MovableProject = createContext<((clientX: number, clientY: number) => { x: number; y: number }) | null>(null);

/**
 * Whether a thing writes its own place while it is being dragged.
 *
 * This is an experiment and it is off everywhere but the bench. It exists
 * because a real hand says the desk lags the pointer by some seventy
 * milliseconds — four frames — while the same drag measured by a dispatched
 * event says nothing is wrong, and a hand counting pointer reports says exactly
 * one arrives a frame, so there is nothing to coalesce and nothing to skip. If
 * the stream is not outrunning us, the only thing left is how far each move has
 * to travel before it is drawn.
 *
 * As it stands that is: pointer event, this handler, `onMove`, the owner's
 * state, a render of the whole desk, and only then the place on this element.
 * Turned on, the place is written straight onto the element in the handler and
 * the owner is told once, when the thing is put down — which is what `onSettle`
 * was always for, and how every shadow on this desk already keeps up with the
 * lamp.
 *
 * What it costs while it is on: the shadow of the thing being dragged is drawn
 * from the place React knows, so it stays where the thing started until the
 * thing is put down. That is the honest reason this is not simply the way
 * Movable works — doing it properly means the place becoming a store that a
 * shadow can subscribe to, the way the light is. This is here to find out
 * whether that is worth doing, by hand, which is the only way this particular
 * question can be answered.
 */
export const MovableLive = createContext(false);

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

type Gesture = 'move' | 'turn' | 'size';
type Press = {
  id: number;
  gesture: Gesture;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  /** Where the pointer went down, on the screen. */
  px: number;
  py: number;
  /** The pivot on the screen, measured once, since the gesture is built to leave it where it is. */
  pivot: { cx: number; cy: number };
  /** Where the pointer stood about the pivot when it went down: an angle on the surface, and a reach. */
  angle: number;
  reach: number;
  /** Where the pivot stood on the surface: what a resize keeps it at. */
  anchor: { x: number; y: number };
  moved: boolean;
};

export type MovableProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'className' | 'style' | 'onDrop'> &
  Place & {
    /** Width in units, before `scale`. 0 lets the child size itself. */
    width?: number;
    /** What one unit is. Defaults to the sheet unit, so things are placed like Pins. */
    unit?: string;
    /** Stacking on the surface: higher lies on top. */
    z?: number;
    /** Accessible name of the thing, for the group the keyboard moves. */
    label?: string;
    /**
     * What it is called in the surface's places, if the surface keeps any. Given
     * one, this is where its place lives: a drag writes straight here and to the
     * store, and whoever owns the surface is told when it is put down. Without
     * one the place is a prop and every step goes round the owner, which is a
     * render of the whole surface each time the pointer moves.
     */
    id?: string;
    /** What it turns and grows about, as fractions of its own box. Defaults to the middle of it.
        A drawing whose weight sits off the middle of its own box — a phone with room beside it for
        the cord — should say where it really stands, or it swings about a point that is not there. */
    pivot?: Pivot;
    /** Whether it can be resized: with a width of its own, a size handle shows beside the turn handle. */
    resizable?: boolean;
    /** Where it can be picked up: by its `body`, clear of any control, or `anywhere`, for a sheet whose whole face is a
        button to turn it: a press that moves becomes a drag and the control never sees a click, a press that stays is its click. */
    grab?: 'body' | 'anywhere';
    /** Called with where it has been moved to, and, when it has been turned or resized, its new tilt and size. */
    onMove?: (place: Place) => void;
    /** Called when it is picked up, by pointer or keyboard, so it can be brought to the top. */
    onGrab?: () => void;
    /** Called when it is put down. */
    onDrop?: () => void;
    /**
     * Called with where it has finally come to rest: once, when the pointer lets
     * go after a drag, and once per key that moves it. `onMove` is every step of
     * a gesture and is what draws the thing; this is the one worth writing down,
     * so whoever owns the place can leave their own state alone until the thing
     * has stopped moving instead of re-rendering the scene under the drag.
     */
    onSettle?: (place: Place) => void;
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
  };

/**
 * A thing lying on a surface that can be picked up, moved, turned and resized.
 * It is placed by its corner in the surface's units, like a Pin, and slides
 * when its place changes.
 *
 * With an `id` on a surface that keeps places, or with `onMove`, it is movable:
 * drag it by its body with the pointer, and it
 * lifts a little and follows. Two handles show at its corner while it is under
 * the pointer or has focus. The first turns it: the thing follows the pointer
 * round its pivot, so wherever you take the handle is where that side of the
 * thing ends up, and holding shift snaps the turn to fifteen degrees. Alt and a
 * drag on the body do the same. The second resizes it: take it out from the
 * pivot and the thing grows, in toward it and it shrinks, and the pivot stays
 * where it is throughout, so a thing grows where it stands instead of sliding
 * off its own footprint. Both are worked out on the surface rather than on the
 * screen, so on a plane seen at an angle a turn is a turn on the desk.
 *
 * A press that starts on a control inside it, a key or a link, is left to the
 * control, and a drag never ends in a click. From the keyboard, the thing
 * itself takes focus, the arrow keys move it, the bracket keys turn it and the
 * minus and plus keys resize it; each handle takes the arrow keys for its own
 * job. Whoever owns the place decides what it means: a desk keeps a map of
 * where everything is and hands each thing its own.
 */
export function Movable({ x, y, rotation = 0, scale = 1, width = 0, unit, z, label, id, pivot = MIDDLE, resizable = false, grab = 'body', onMove, onGrab, onDrop, onSettle, children, className = '', style, ...rest }: MovableProps) {
  const host = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLSpanElement>(null);
  const surfaceScale = useContext(MovableScale);
  const project = useContext(MovableProject);
  const places = usePlaces();
  /* A place of its own in the surface's store is the real thing; the context is the bench's A/B. */
  const kept = id && places ? id : undefined;
  const live = useContext(MovableLive) || !!kept;
  /* Where the thing has got to while the owner is not being told. */
  const latest = useRef<Place | null>(null);
  /* What the surface says it is at, which outranks the props once it has a place of its own. */
  /* A thing is movable if anyone is listening — either the owner, or the store it
     keeps its place in. Without one or the other it is a drawing, not a thing. */
  const movable = !!onMove || !!kept;
  const here = (kept && places?.get(kept)) || { x, y, rotation, scale };
  const currentPlace = () => {
    const at = (kept && places?.get(kept)) || { x, y, rotation, scale };
    return { atX: at.x, atY: at.y, atRotation: at.rotation ?? 0, atScale: at.scale ?? 1 };
  };
  const press = useRef<Press | null>(null);
  const [dragging, setDragging] = useState<Gesture | null>(null);
  const [gripDismissed, setGripDismissed] = useState(false);
  const leftSinceRelease = useRef(false);
  const sizeable = resizable && width > 0;

  /* Where a point on the screen falls on the surface. Off a projected surface the
     screen is the surface, which is all an angle and a reach need. */
  const onSurface = (clientX: number, clientY: number) => (project ? project(clientX, clientY) : { x: clientX, y: clientY });

  /* The pivot, found from a marker that sits at it and is not turned with the
     thing: on a tilted plane the box's own corners are no guide to where the
     middle of it is drawn. */
  const pivotOnScreen = () => {
    const box = anchor.current?.getBoundingClientRect();
    if (box) return { cx: box.x + box.width / 2, cy: box.y + box.height / 2 };
    const fallback = host.current?.getBoundingClientRect();
    if (!fallback) return { cx: 0, cy: 0 };
    return { cx: fallback.x + fallback.width * pivot.x, cy: fallback.y + fallback.height * pivot.y };
  };

  /*
    A press that is released off the thing, or over something that swallows the
    release, would otherwise leave the thing hanging on the pointer: the window
    is watched for the end of every press, whether or not the thing has capture.
  */
  const [watching, setWatching] = useState(false);
  /* The end of a press has to settle the thing where it stands now, not where it
     stood when the watch was set up; the latest is kept in a ref so the watch
     itself only comes and goes with the press, instead of with every render of a
     desk full of things. */
  const ending = useRef<(start: Press) => void>(() => {});
  ending.current = finish;
  useEffect(() => {
    if (!watching) return;
    const end = (event: globalThis.PointerEvent) => {
      if (press.current && event.pointerId === press.current.id) ending.current(press.current);
    };
    const away = () => {
      if (press.current) ending.current(press.current);
    };
    window.addEventListener('pointerup', end, true);
    window.addEventListener('pointercancel', end, true);
    /* The window's own blur, and not an element's: a press moves focus, and a
       capturing listener would take every blur in the tree for the end of it. */
    window.addEventListener('blur', away);
    return () => {
      window.removeEventListener('pointerup', end, true);
      window.removeEventListener('pointercancel', end, true);
      window.removeEventListener('blur', away);
    };
  }, [watching]);

  function finish(start: Press) {
    const { atX, atY, atRotation, atScale } = currentPlace();
    press.current = null;
    setWatching(false);
    /* Written straight to the element while the drag ran, so this is the first
       the owner hears of any of it. Told before anything below reads `settled`. */
    const carried = latest.current;
    latest.current = null;
    if (carried && onMove) onMove(carried);
    let settled: Place = carried ?? { x: atX, y: atY, rotation: atRotation, scale: atScale };
    /* A resize keeps its pivot by measuring where the pivot has got to, which
       trails the size it is answering by a frame; on the last of them there is
       no next frame, so it is settled here instead. */
    if (start.gesture === 'size' && start.moved && movable) {
      const on = pivotOnScreen();
      const stands = onSurface(on.cx, on.cy);
      const dx = start.anchor.x - stands.x;
      const dy = start.anchor.y - stands.y;
      if (Math.abs(dx) >= 0.5 || Math.abs(dy) >= 0.5) {
        settled = { x: Math.round(atX + dx), y: Math.round(atY + dy), rotation: atRotation, scale: atScale };
        carry(settled);
      }
    }
    if (start.gesture !== 'move') {
      setGripDismissed(true);
      leftSinceRelease.current = false;
    }
    setDragging(null);
    const element = host.current;
    if (element) {
      if (element.hasPointerCapture(start.id)) element.releasePointerCapture(start.id);
      if (start.moved) {
        // The click that follows the release is the end of a drag, not a press on whatever is under the pointer.
        const swallow = (click: Event) => {
          click.stopPropagation();
          click.preventDefault();
        };
        element.addEventListener('click', swallow, { capture: true, once: true });
        window.setTimeout(() => element.removeEventListener('click', swallow, { capture: true }), 0);
      }
    }
    if (start.moved) {
      onDrop?.();
      onSettle?.(settled);
    }
  }

  const begin = (event: PointerEvent<HTMLDivElement>, gesture: Gesture) => {
    const { atX, atY, atRotation, atScale } = currentPlace();
    const on = pivotOnScreen();
    const at = onSurface(on.cx, on.cy);
    const here = onSurface(event.clientX, event.clientY);
    press.current = {
      id: event.pointerId,
      gesture,
      x: atX,
      y: atY,
      rotation: atRotation,
      scale: atScale,
      px: event.clientX,
      py: event.clientY,
      pivot: on,
      anchor: at,
      angle: Math.atan2(here.y - at.y, here.x - at.x),
      reach: Math.max(Math.hypot(here.x - at.x, here.y - at.y), 1e-6),
      moved: false,
    };
    setWatching(true);
    if (gesture !== 'move') {
      try { host.current?.setPointerCapture(event.pointerId); } catch { /* Synthetic pointer. */ }
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!movable || event.button !== 0) return;
    const target = event.target as Element;
    /* Each handle has its own job; so does the body with Alt held. Anything else on a control is the control's. */
    if (target.closest('.movable__grip[data-grip="size"]')) {
      event.preventDefault();
      begin(event, 'size');
      return;
    }
    if (target.closest('.movable__grip')) {
      event.preventDefault();
      begin(event, 'turn');
      return;
    }
    if (target.closest(grab === 'anywhere' ? HELD_CONTROLS : CONTROLS)) return;
    begin(event, event.altKey ? 'turn' : 'move');
  };

  /* What the element is drawn at, written by hand so no render is needed for it. */
  const draw = (next: Place) => {
    const element = host.current;
    if (!element) return;
    element.style.setProperty('--movable-x', String(next.x));
    element.style.setProperty('--movable-y', String(next.y));
    element.style.setProperty('--movable-rotation', `${next.rotation ?? 0}deg`);
    if (width > 0) element.style.setProperty('--movable-width', `calc(${width * (next.scale ?? 1)} * var(--movable-unit))`);
  };

  /* External resets and arrangements update the same DOM path as carrying.
     The callback never writes to the store, so notifications cannot recurse. */
  const redraw = useRef(draw);
  redraw.current = draw;
  useLayoutEffect(() => {
    if (!kept || !places) return;
    const update = () => {
      const next = places.get(kept);
      if (next) redraw.current(next);
    };
    update();
    return places.subscribe(kept, update);
  }, [kept, places]);

  /* Where the thing has got to. With a place of its own that is the store's, and
     the store is told first so anything drawing from the place — a shadow, the
     light a lamp carries — is working from the same frame. */
  const carry = (next: Place) => {
    if (kept) {
      latest.current = next;
      places?.set(kept, next);
      return;
    }
    /* The bench's A/B has no store behind it, so the props it would work a turn
       or a resize out from go stale. Only a plain move is diverted there. */
    if (live && press.current?.gesture === 'move') {
      latest.current = next;
      draw(next);
      return;
    }
    onMove?.(next);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = press.current;
    if (!start || !movable || event.pointerId !== start.id) return;
    const dx = event.clientX - start.px;
    const dy = event.clientY - start.py;
    if (!start.moved) {
      if (Math.hypot(dx, dy) < MOVABLE_DRAG_THRESHOLD) return;
      start.moved = true;
      setDragging(start.gesture);
      try {
        host.current?.setPointerCapture(start.id);
      } catch {
        /* A pointer the browser no longer knows, such as one made up by a test: the drag goes on without capture. */
      }
      onGrab?.();
    }
    if (start.gesture === 'turn' || start.gesture === 'size') {
      const at = onSurface(start.pivot.cx, start.pivot.cy);
      const here = onSurface(event.clientX, event.clientY);
      const away = Math.hypot(here.x - at.x, here.y - at.y);
      if (start.gesture === 'turn') {
        /* The thing follows the pointer round the pivot: the side you took is the side that ends up where you point. */
        const swept = (Math.atan2(here.y - at.y, here.x - at.x) - start.angle) * 180 / Math.PI;
        const turned = start.rotation + swept;
        carry({ x: start.x, y: start.y, scale: start.scale, rotation: event.shiftKey ? Math.round(turned / MOVABLE_SNAP_TURN) * MOVABLE_SNAP_TURN : Math.round(turned * 2) / 2 });
        return;
      }
      /* Out from the pivot is bigger, in toward it smaller — and the pivot itself does not move.
         Where the pivot has drifted to is measured rather than assumed, so a child that
         does not take its height from its width is kept on its spot all the same. */
      const now = pivotOnScreen();
      const stands = onSurface(now.cx, now.cy);
      const drift = { x: start.anchor.x - stands.x, y: start.anchor.y - stands.y };
      const grown = resized(start.scale * away / start.reach);
      carry({ x: Math.round(grown.x + drift.x), y: Math.round(grown.y + drift.y), scale: grown.scale, rotation: start.rotation });
      return;
    }
    if (project) {
      /* On a tilted surface the pointer's travel is worth more near the eye than far from it: map both ends of it onto the surface. */
      const from = project(start.px, start.py);
      const to = project(event.clientX, event.clientY);
      carry({ x: Math.round(start.x + to.x - from.x), y: Math.round(start.y + to.y - from.y), rotation: start.rotation, scale: start.scale });
      return;
    }
    const perUnit = surfaceScale() || 1;
    carry({ x: Math.round(start.x + dx / perUnit), y: Math.round(start.y + dy / perUnit), rotation: start.rotation, scale: start.scale });
  };

  /* A thing grows from its corner, so growing it alone would walk it off the spot
     it stands on. Give back what the corner gains and the pivot stays put. The box
     is measured as it is now rather than taken from the drawing, since what a child
     does with the width it is given is the child's business. */
  const resized = (next: number) => {
    const { atX, atY, atRotation, atScale } = currentPlace();
    const size = Math.round(clamp(next, MOVABLE_MIN_SCALE, MOVABLE_MAX_SCALE) * 100) / 100;
    const was = width * atScale;
    const now = width * size;
    const box = host.current;
    const perUnit = box && box.offsetWidth ? box.offsetWidth / was : 0;
    const tall = box && perUnit ? box.offsetHeight / perUnit : 0;
    return {
      x: atX + pivot.x * (was - now),
      y: atY + pivot.y * tall * (1 - now / was),
      scale: size,
    };
  };

  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const start = press.current;
    if (!start || event.pointerId !== start.id) return;
    finish(start);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const { atX, atY, atRotation, atScale } = currentPlace();
    const grip = (event.target as Element).closest('.movable__grip');
    const onSize = grip?.getAttribute('data-grip') === 'size';
    if (!movable || (event.target !== event.currentTarget && !grip)) return;
    const step = event.shiftKey ? MOVABLE_KEY_STEP * 5 : MOVABLE_KEY_STEP;
    const turn = event.shiftKey ? MOVABLE_KEY_TURN * 5 : MOVABLE_KEY_TURN;
    const grow = event.shiftKey ? MOVABLE_KEY_SCALE * 5 : MOVABLE_KEY_SCALE;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const turns: Record<string, number> = { '[': -turn, '{': -turn, ']': turn, '}': turn };
    const sizes: Record<string, number> = { '-': -grow, _: -grow, '=': grow, '+': grow };
    /* A key is a whole gesture: the thing moves and is at rest again. */
    const put = (next: Place) => {
      carry(next);
      onSettle?.(next);
    };
    const resize = (by: number) => {
      setGripDismissed(false);
      const grown = resized(atScale + by);
      put({ x: Math.round(grown.x), y: Math.round(grown.y), scale: grown.scale, rotation: atRotation });
    };
    if (onSize && event.key in moves) {
      event.preventDefault();
      resize(event.key === 'ArrowRight' || event.key === 'ArrowUp' ? grow : -grow);
      return;
    }
    if (grip && !onSize && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      setGripDismissed(false);
      put({ x: atX, y: atY, scale: atScale, rotation: atRotation + (event.key === 'ArrowLeft' ? -turn : turn) });
      return;
    }
    if (event.key in turns) {
      event.preventDefault();
      setGripDismissed(false);
      put({ x: atX, y: atY, scale: atScale, rotation: atRotation + turns[event.key] });
      return;
    }
    if (sizeable && event.key in sizes) {
      event.preventDefault();
      resize(sizes[event.key]);
      return;
    }
    if (grip) return;
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    put({ x: atX + move[0], y: atY + move[1], rotation: atRotation, scale: atScale });
  };

  const vars = {
    '--movable-x': here.x,
    '--movable-y': here.y,
    '--movable-rotation': `${here.rotation ?? 0}deg`,
    '--movable-pivot-x': pivot.x,
    '--movable-pivot-y': pivot.y,
    '--movable-width': width > 0 ? `calc(${width * (here.scale ?? 1)} * var(--movable-unit))` : 'auto',
    '--movable-unit': unit,
    '--movable-z': z,
    ...style,
  } as CSSProperties;

  /* Counted by name when a bench is counting, and not wrapped in anything at all
     when none is: a thing on a desk is the unit anyone actually asks about. */
  return (
    <Tallied id={label ?? 'unnamed thing'}>
    <div
      {...rest}
      ref={host}
      className={`movable ${className}`}
      data-movable={movable ? '' : undefined}
      data-dragging={dragging ? '' : undefined}
      data-grip-dismissed={gripDismissed ? '' : undefined}
      data-turning={dragging === 'turn' ? '' : undefined}
      data-sizing={dragging === 'size' ? '' : undefined}
      role={movable ? 'group' : rest.role}
      aria-label={movable ? label : rest['aria-label']}
      aria-roledescription={movable ? 'movable' : undefined}
      tabIndex={movable ? 0 : undefined}
      style={vars}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onLostPointerCapture={onPointerEnd}
      onPointerLeave={(event) => {
        if (!press.current) leftSinceRelease.current = true;
        rest.onPointerLeave?.(event);
      }}
      onPointerEnter={(event) => {
        if (!press.current && leftSinceRelease.current) setGripDismissed(false);
        rest.onPointerEnter?.(event);
      }}
      onKeyDown={onKeyDown}
      onFocus={(event) => {
        if (event.target === event.currentTarget || (event.target as Element).closest('.movable__grip')) {
          setGripDismissed(false);
          onGrab?.();
        }
      }}
      onDragStart={(event) => event.preventDefault()}
    >
      {/* Where it turns and grows about. It is not turned with the thing, so it says where the pivot is drawn however the thing lies. */}
      <span ref={anchor} className="movable__pivot" aria-hidden="true" />
      <div className="movable__lift">{children}</div>
      {movable && (
        <button type="button" className="movable__grip" data-grip="turn" aria-label={`Rotate ${label ?? 'object'}`} title="Drag round the object to turn it; hold Shift to snap. Arrow keys turn it when focused." onClick={(event) => event.stopPropagation()}>
          <svg viewBox="0 0 20 20" focusable="false">
            <path d="M4.5 10a5.5 5.5 0 1 0 1.6-3.9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M4 3.5v3.5h3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      {movable && sizeable && (
        <button type="button" className="movable__grip" data-grip="size" aria-label={`Resize ${label ?? 'object'}`} title="Drag away from the object to enlarge it, toward it to shrink. Arrow keys resize it when focused; minus and plus work anywhere on it." onClick={(event) => event.stopPropagation()}>
          <svg viewBox="0 0 20 20" focusable="false">
            <path d="M4 16 16 4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M11 4h5v5M9 16H4v-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
    </Tallied>
  );
}
