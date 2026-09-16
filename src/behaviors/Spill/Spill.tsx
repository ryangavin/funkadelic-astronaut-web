import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import './Spill.css';

/** Where a thing lies: its top-left corner in the container's units, and its tilt. */
export type Placement = { x: number; y: number; rotation?: number };

/** How long one item's flight takes, in milliseconds. */
export const SPILL_FLIGHT_MS = 900;
/** The pause between one item leaving and the next, in milliseconds. */
export const SPILL_STAGGER_MS = 110;

export type SpillProps = {
  /** Whether the container is open. Opening sends the items out; closing draws them back. */
  open: boolean;
  /** Where the items lie packed, as the point their centres gather on. Defaults to the container's own centre. */
  from?: { x: number; y: number };
  /** How far, in units, the packed items are turned from their landed tilt: they come out at odd angles and settle. */
  scatter?: number;
  /** Length of one item's flight, in milliseconds. */
  duration?: number;
  /** Delay between one item and the next, in milliseconds. */
  stagger?: number;
  /** What one unit is. Defaults to the sheet unit, so items are placed like Pins. */
  unit?: string;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

type SpillContext = { open: boolean; stagger: number; scatter: number };
const Context = createContext<SpillContext>({ open: true, stagger: SPILL_STAGGER_MS, scatter: 12 });

/**
 * Loose things kept in a container that fall out onto the desk when it is
 * opened. Packed, every item lies at the `from` point, out of sight under
 * whatever closes over them; open, each one slides out to its own place,
 * lifting off the surface as it goes and dropping flat where it lands, one
 * after another. Closing draws them back the same way. The container is
 * positioned but takes no space: the items are absolute within it, placed in
 * the same units as a Pin, so it can sit inside a folder's well or anywhere
 * else on a sheet. Reduced motion places everything without a flight.
 */
export function Spill({ open, from, scatter = 12, duration = SPILL_FLIGHT_MS, stagger = SPILL_STAGGER_MS, unit, children, className = '', style }: SpillProps) {
  const vars = {
    '--spill-from-x': from ? `${from.x}` : undefined,
    '--spill-from-y': from ? `${from.y}` : undefined,
    '--spill-flight': `${duration}ms`,
    '--spill-unit': unit,
    ...style,
  } as CSSProperties;
  return (
    <Context.Provider value={{ open, stagger, scatter }}>
      <div className={`spill ${className}`} data-open={open ? 'true' : 'false'} data-from={from ? 'point' : 'centre'} style={vars}>
        {children}
      </div>
    </Context.Provider>
  );
}

export type SpilledProps = Placement & {
  /** Width in container units. 0 lets the child size itself. */
  width?: number;
  /** Where in the order it comes out. Later items leave later and land on top. */
  order?: number;
  /** Its own packed placement, if not at the pile's point. */
  from?: Placement;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/** One thing in the spill, and where it lands. */
export function Spilled({ x, y, rotation = 0, width = 0, order = 0, from, children, className = '', style }: SpilledProps) {
  const { stagger, scatter } = useContext(Context);
  /* Packed, each item lies turned a different way from its landed tilt, alternating sides, so the pile looks handled. */
  const turn = rotation + (order % 2 ? -1 : 1) * scatter * (1 + (order % 3) / 3);
  const vars = {
    '--spilled-x': x,
    '--spilled-y': y,
    '--spilled-rotation': `${rotation}deg`,
    '--spilled-width': width > 0 ? `calc(${width} * var(--spill-unit, var(--sheet-unit, 1px)))` : 'auto',
    '--spilled-delay': `${order * stagger}ms`,
    '--spilled-order': order,
    '--spilled-from-x': from ? `${from.x}` : undefined,
    '--spilled-from-y': from ? `${from.y}` : undefined,
    '--spilled-from-rotation': `${from?.rotation ?? turn}deg`,
    ...style,
  } as CSSProperties;
  return (
    <div className={`spilled ${className}`} data-from={from ? 'own' : 'pile'} style={vars}>
      <div className="spilled__lift">{children}</div>
    </div>
  );
}
