import { createContext, useContext, useRef, useState, type CSSProperties, type HTMLAttributes, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import './Movable.css';

/** Where a thing lies: its top-left corner in the surface's units, and its tilt. */
export type Place = { x: number; y: number; rotation?: number };

/** How far the pointer travels before a press becomes a drag, in screen pixels. */
export const MOVABLE_DRAG_THRESHOLD = 5;
/** How far an arrow key moves a thing, in units; with shift held, five times that. */
export const MOVABLE_KEY_STEP = 10;

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
    /** Called with where it has been moved to. Without it the thing lies where it is put. */
    onMove?: (place: { x: number; y: number }) => void;
    /** Called when it is picked up, by pointer or keyboard, so it can be brought to the top. */
    onGrab?: () => void;
    /** Called when it is put down. */
    onDrop?: () => void;
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
  };

/**
 * A thing lying on a surface that can be picked up and moved. It is placed by
 * its corner in the surface's units, like a Pin, and slides when its place
 * changes. With `onMove` it is movable: drag it by its body with the pointer,
 * and it lifts a little and follows; a press that starts on a control inside
 * it, a key or a link, is left to the control, and a drag never ends in a
 * click. From the keyboard, the thing itself takes focus and the arrow keys
 * move it. Whoever owns the place decides what it means: a desk keeps a map
 * of where everything is and hands each thing its own.
 */
export function Movable({ x, y, rotation = 0, width = 0, unit, z, label, grab = 'body', onMove, onGrab, onDrop, children, className = '', style, ...rest }: MovableProps) {
  const host = useRef<HTMLDivElement>(null);
  const scale = useContext(MovableScale);
  const press = useRef<{ id: number; px: number; py: number; x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!onMove || event.button !== 0 || (event.target as Element).closest(grab === 'anywhere' ? HELD_CONTROLS : CONTROLS)) return;
    press.current = { id: event.pointerId, px: event.clientX, py: event.clientY, x, y };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = press.current;
    if (!start || !onMove || event.pointerId !== start.id) return;
    const dx = event.clientX - start.px;
    const dy = event.clientY - start.py;
    if (!dragging) {
      if (Math.hypot(dx, dy) < MOVABLE_DRAG_THRESHOLD) return;
      setDragging(true);
      host.current?.setPointerCapture(start.id);
      onGrab?.();
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
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
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
    </div>
  );
}
