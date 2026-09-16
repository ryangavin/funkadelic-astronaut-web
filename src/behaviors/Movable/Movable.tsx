import { createContext, useContext, useRef, useState, type CSSProperties, type HTMLAttributes, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import './Movable.css';

/** Where a thing lies: its top-left corner in the surface's units, and its tilt. */
export type Place = { x: number; y: number; rotation?: number };

/** How far the pointer travels before a press becomes a drag, in screen pixels. */
export const MOVABLE_DRAG_THRESHOLD = 5;
/** How far an arrow key moves a thing, in units; with shift held, five times that. */
export const MOVABLE_KEY_STEP = 10;
/** How far a bracket key turns a thing, in degrees; with shift held, five times that. */
export const MOVABLE_KEY_TURN = 1;

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

export type MovableProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'className' | 'style' | 'onDrop'> &
  Place & {
    /** Width in units. 0 lets the child size itself. */
    width?: number;
    /** What one unit is. Defaults to the sheet unit, so things are placed like Pins. */
    unit?: string;
    /** Stacking on the surface: higher lies on top. */
    z?: number;
    /** Accessible name of the thing, for the group the keyboard moves. */
    label?: string;
    /** Where it can be picked up: by its `body`, clear of any control, or `anywhere`, for a sheet whose whole face is a
        button to turn it: a press that moves becomes a drag and the control never sees a click, a press that stays is its click. */
    grab?: 'body' | 'anywhere';
    /** Called with where it has been moved to, and, when it has been turned, its new tilt. Without it the thing lies where it is put. */
    onMove?: (place: { x: number; y: number; rotation?: number }) => void;
    /** Called when it is picked up, by pointer or keyboard, so it can be brought to the top. */
    onGrab?: () => void;
    /** Called when it is put down. */
    onDrop?: () => void;
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
  };

/**
 * A thing lying on a surface that can be picked up, moved and turned. It is
 * placed by its corner in the surface's units, like a Pin, and slides when
 * its place changes. With `onMove` it is movable: drag it by its body with
 * the pointer, and it lifts a little and follows; drag with Alt held, or by
 * the grip that shows at its corner, and it turns about its centre to face
 * the pointer. A press that starts on a control inside it, a key or a link,
 * is left to the control, and a drag never ends in a click. From the
 * keyboard, the thing itself takes focus, the arrow keys move it and the
 * bracket keys turn it. Whoever owns the place decides what it means: a desk
 * keeps a map of where everything is and hands each thing its own. On a surface seen at an
 * angle, the drag is mapped back through the projection, so the thing follows
 * the pointer across the surface and not across the screen.
 */
export function Movable({ x, y, rotation = 0, width = 0, unit, z, label, grab = 'body', onMove, onGrab, onDrop, children, className = '', style, ...rest }: MovableProps) {
  const host = useRef<HTMLDivElement>(null);
  const scale = useContext(MovableScale);
  const project = useContext(MovableProject);
  /* A press remembers where it began, what it began on, and, for a turn, the bearing from the centre it began at. */
  const press = useRef<{ id: number; px: number; py: number; x: number; y: number; rotation: number; turn: boolean; from: number; cx: number; cy: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const bearing = (clientX: number, clientY: number, cx: number, cy: number) => (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;

  const begin = (event: PointerEvent<HTMLDivElement>, turn: boolean) => {
    const box = host.current?.getBoundingClientRect();
    const cx = box ? box.left + box.width / 2 : event.clientX;
    const cy = box ? box.top + box.height / 2 : event.clientY;
    press.current = { id: event.pointerId, px: event.clientX, py: event.clientY, x, y, rotation, turn, from: bearing(event.clientX, event.clientY, cx, cy), cx, cy };
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!onMove || event.button !== 0) return;
    const target = event.target as Element;
    /* The grip turns; so does the body with Alt held. Anything else on a control is the control's. */
    if (target.closest('.movable__grip')) {
      event.preventDefault();
      begin(event, true);
      return;
    }
    if (target.closest(grab === 'anywhere' ? HELD_CONTROLS : CONTROLS)) return;
    begin(event, event.altKey);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = press.current;
    if (!start || !onMove || event.pointerId !== start.id) return;
    const dx = event.clientX - start.px;
    const dy = event.clientY - start.py;
    if (!dragging) {
      if (Math.hypot(dx, dy) < MOVABLE_DRAG_THRESHOLD) return;
      setDragging(true);
      try {
        host.current?.setPointerCapture(start.id);
      } catch {
        /* A pointer the browser no longer knows, such as one made up by a test: the drag goes on without capture. */
      }
      onGrab?.();
    }
    if (start.turn) {
      /* Turned to face the pointer: the bearing from the centre now, less the bearing it was picked up at. */
      const turned = bearing(event.clientX, event.clientY, start.cx, start.cy) - start.from;
      onMove({ x: start.x, y: start.y, rotation: Math.round((start.rotation + turned) * 2) / 2 });
      return;
    }
    if (project) {
      /* On a tilted surface the pointer's travel is worth more near the eye than far from it: map both ends of it onto the surface. */
      const from = project(start.px, start.py);
      const to = project(event.clientX, event.clientY);
      onMove({ x: Math.round(start.x + to.x - from.x), y: Math.round(start.y + to.y - from.y) });
      return;
    }
    const perUnit = scale() || 1;
    onMove({ x: Math.round(start.x + dx / perUnit), y: Math.round(start.y + dy / perUnit) });
  };

  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const start = press.current;
    if (!start || event.pointerId !== start.id) return;
    press.current = null;
    if (!dragging) return;
    setDragging(false);
    const element = host.current;
    if (element) {
      if (element.hasPointerCapture(start.id)) element.releasePointerCapture(start.id);
      // The click that follows the release is the end of a drag, not a press on whatever is under the pointer.
      const swallow = (click: Event) => {
        click.stopPropagation();
        click.preventDefault();
      };
      element.addEventListener('click', swallow, { capture: true, once: true });
      window.setTimeout(() => element.removeEventListener('click', swallow, { capture: true }), 0);
    }
    onDrop?.();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onMove || event.target !== event.currentTarget) return;
    const step = event.shiftKey ? MOVABLE_KEY_STEP * 5 : MOVABLE_KEY_STEP;
    const turn = event.shiftKey ? MOVABLE_KEY_TURN * 5 : MOVABLE_KEY_TURN;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const turns: Record<string, number> = { '[': -turn, '{': -turn, ']': turn, '}': turn };
    if (event.key in turns) {
      event.preventDefault();
      onMove({ x, y, rotation: rotation + turns[event.key] });
      return;
    }
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    onMove({ x: x + move[0], y: y + move[1] });
  };

  const vars = {
    '--movable-x': x,
    '--movable-y': y,
    '--movable-rotation': `${rotation}deg`,
    '--movable-width': width > 0 ? `calc(${width} * var(--movable-unit))` : 'auto',
    '--movable-unit': unit,
    '--movable-z': z,
    ...style,
  } as CSSProperties;

  return (
    <div
      {...rest}
      ref={host}
      className={`movable ${className}`}
      data-movable={onMove ? '' : undefined}
      data-dragging={dragging ? '' : undefined}
      data-turning={dragging && press.current?.turn ? '' : undefined}
      role={onMove ? 'group' : rest.role}
      aria-label={onMove ? label : rest['aria-label']}
      aria-roledescription={onMove ? 'movable' : undefined}
      tabIndex={onMove ? 0 : undefined}
      style={vars}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={onKeyDown}
      onFocus={(event) => {
        if (event.target === event.currentTarget) onGrab?.();
      }}
      onDragStart={(event) => event.preventDefault()}
    >
      <div className="movable__lift">{children}</div>
      {onMove && (
        <span className="movable__grip" aria-hidden="true" title="Drag to turn">
          <svg viewBox="0 0 20 20" focusable="false">
            <path d="M4.5 10a5.5 5.5 0 1 0 1.6-3.9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M4 3.5v3.5h3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </div>
  );
}
