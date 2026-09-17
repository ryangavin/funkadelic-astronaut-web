import type React from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { BODY, KEYS, type Key, type KeyIcon, keyFor, keyName } from './keyboard';
import { PrintedLabel } from './PrintedLabel';
import { STOCK, TAPE_WIDTHS, tapeMm, tapeUnits, widthLabel, type Margin, type TapeStock, type TapeWidth } from './tape';
import './LabelBro.css';

export { PrintedLabel, type PrintedLabelProps } from './PrintedLabel';
export { TAPE_STOCKS, TAPE_WIDTHS, STOCK, tapeMm, type Margin, type TapeStock, type TapeWidth } from './tape';
export { KEYS, BODY, type Key } from './keyboard';

/** How many characters the machine will hold before it says the label is full. */
export const LABEL_BRO_LIMIT = 32;

/** How thick the machine is, as a multiple of the width of its drawing: 78 mm against 183. */
export const LABEL_BRO_HEIGHT = 312 / BODY.w;

/** Where it meets the desk within its own drawing: the middle of its footprint, since it sits flat on all of it. */
export const LABEL_BRO_FOOT = { x: 0.5, y: 0.5 };

/** How long a key stays down after a press, in milliseconds. */
const PRESS_MS = 120;

/** How many characters of the label the screen can hold at once. */
const WINDOW = 16;

/** How much blank tape the cutter leaves standing in the slot: 25 mm of leader. */
const LEADER = 100;

/**
 * A label that has been printed and cut off. Everything needed to draw it
 * again somewhere else — hand the whole thing to `<PrintedLabel>` — plus an
 * `id` to key it by and its length in millimetres.
 */
export type PrintedStrip = {
  /** Unique to this strip, for keying and dragging it around. */
  id: string;
  /** What is printed on it. */
  text: string;
  /** The cassette it came off, in millimetres across. */
  width: TapeWidth;
  /** Which ink on which tape. */
  stock: TapeStock;
  /** What the cutter left at the ends. */
  margin: Margin;
  /** How long the strip is, in millimetres. */
  lengthMm: number;
};

export type LabelBroProps = {
  /** The cassette in the machine, in millimetres across. */
  width?: TapeWidth;
  /** Which ink on which tape is in it. */
  stock?: TapeStock;
  /** How much blank the cutter leaves at each end. */
  margin?: Margin;
  /** What is on the screen. Hand this in to drive the machine yourself. */
  text?: string;
  /** What is on the screen before anyone touches it. */
  defaultText?: string;
  /** Called with the screen's new reading whenever it changes. */
  onTextChange?: (text: string) => void;
  /** Called when Print comes down, handed the strip the cutter drops. */
  onPrint?: (strip: PrintedStrip) => void;
  /** How many characters the machine will hold. */
  limit?: number;
  /** Whether it is switched on. Hand this in to drive it yourself. */
  on?: boolean;
  /** Whether it is switched on before anyone touches it. */
  defaultOn?: boolean;
  /** How it is lying on the desk, in degrees. */
  rotation?: number;
  className?: string;
  style?: React.CSSProperties;
};

/** The icons that stand in for legends on the caps that have no room for words. */
const ICON: Record<KeyIcon, React.ReactNode> = {
  power: <svg viewBox="0 0 24 24"><path d="M12 3v9" /><path d="M6.5 6.8a8 8 0 1 0 11 0" /></svg>,
  home: <svg viewBox="0 0 24 24"><path d="M3.5 11 12 4l8.5 7" /><path d="M6 10.2V20h12v-9.8" /></svg>,
  bluetooth: <svg viewBox="0 0 24 24"><path d="M7 7.5 17 16.5 12 21V3l5 4.5L7 16.5" /></svg>,
  feed: <svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6" /><path d="M15 15l5.5 5.5" /></svg>,
  up: <svg viewBox="0 0 24 24"><path d="M12 19V6M5.5 12.5 12 6l6.5 6.5" /></svg>,
  down: <svg viewBox="0 0 24 24"><path d="M12 5v13M5.5 11.5 12 18l6.5-6.5" /></svg>,
  left: <svg viewBox="0 0 24 24"><path d="M19 12H6M12.5 5.5 6 12l6.5 6.5" /></svg>,
  right: <svg viewBox="0 0 24 24"><path d="M5 12h13M11.5 5.5 18 12l-6.5 6.5" /></svg>,
  enter: <svg viewBox="0 0 24 24"><path d="M20 5v8H6" /><path d="M10.5 8.5 6 13l4.5 4.5" /></svg>,
  shift: <svg viewBox="0 0 24 24"><path d="M12 3.5 4.5 11H9v9.5h6V11h4.5z" /></svg>,
  barcode: <svg viewBox="0 0 24 24"><path d="M4 5v14M7.5 5v14M10.5 5v10M14 5v14M17.5 5v10M20 5v14" /></svg>,
  backlight: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.2 5.2 7 7M17 17l1.8 1.8M18.8 5.2 17 7M7 17l-1.8 1.8" /></svg>,
};

/**
 * A desktop label printer: 183 by 193 millimetres of textured black ABS with
 * a QWERTY keyboard filling two thirds of it, a grey-green LCD above that, and
 * a TZe cassette under the lid at the back. Tape comes out of the slot in the
 * left-hand edge.
 *
 * It works the way the real one does. Type — on the drawn keys or on your own
 * keyboard — and the characters go to the screen, which counts up how long the
 * label will be as you go. Press Print and the head lays the text down inside
 * the laminate, the cutter takes it off, and the strip sits in the exit slot
 * until somebody pulls it out. Feed runs blank tape through. Caps latches and
 * Shift does not, which is the way round these have always been.
 *
 * It is drawn looking straight down at it, the way everything here is, and it
 * draws none of its own thickness. It is 78 mm of moulded plastic all the
 * same: stand it in a `Solid` of {@link LABEL_BRO_HEIGHT} and on a tilted
 * plane the whole top face lifts and leans away from the eye while its side
 * slides out from under it, back down to the footprint it is standing on.
 *
 * One honest liberty: the real machine is a wedge, taller at the cassette than
 * at the front lip, and this declares the one height it is at its tallest. A
 * Solid takes a single number and a wedge is not one.
 */
export function LabelBro({
  width = 12,
  stock = 'black-on-white',
  margin = 'full',
  text: controlled,
  defaultText = '',
  onTextChange,
  onPrint,
  limit = LABEL_BRO_LIMIT,
  on: controlledOn,
  defaultOn = true,
  rotation = 0,
  className = '',
  style,
}: LabelBroProps) {
  const id = useId().replace(/:/g, '');
  const serial = useRef(0);
  const [own, setOwn] = useState(defaultText.slice(0, limit));
  const [ownOn, setOwnOn] = useState(defaultOn);
  const [caps, setCaps] = useState(true);
  const [shift, setShift] = useState(false);
  const [paired, setPaired] = useState(false);
  const [pressed, setPressed] = useState<{ key: string; n: number } | null>(null);
  const [out, setOut] = useState<PrintedStrip | null>(null);
  const [said, setSaid] = useState('');

  const text = (controlled ?? own).slice(0, limit);
  const on = controlledOn ?? ownOn;
  const full = text.length >= limit;
  const lengthMm = tapeMm(text, width, margin);

  const write = useCallback(
    (next: string) => {
      if (controlled === undefined) setOwn(next);
      onTextChange?.(next);
    },
    [controlled, onTextChange],
  );

  /* Keys come back up on their own. Each fresh press bumps the count, so the same key twice reads as twice. */
  useEffect(() => {
    if (!pressed) return;
    const timer = setTimeout(() => setPressed(null), PRESS_MS);
    return () => clearTimeout(timer);
  }, [pressed]);

  /** Put a character on the screen, if there is room for it. */
  const type = useCallback(
    (character: string) => {
      if (!on) return;
      if (full) {
        setSaid('The label is as long as this machine will hold — print it or clear it');
        return;
      }
      const next = text + character;
      write(next);
      setShift(false);
      setSaid(`${character === ' ' ? 'Space' : character} — ${next.trim() || 'nothing yet'}, ${tapeMm(next, width, margin)} millimetres`);
    },
    [full, margin, on, text, width, write],
  );

  /** Run the cutter and drop what is on the screen. */
  const print = useCallback(() => {
    if (!on) return;
    serial.current += 1;
    const strip: PrintedStrip = { id: `${id}-${serial.current}`, text, width, stock, margin, lengthMm };
    setOut(strip);
    setSaid(`Printed ${text.trim() ? `${text.trim()}` : 'a blank label'} on ${width} millimetre ${STOCK[stock].name}, ${lengthMm} millimetres long`);
    onPrint?.(strip);
  }, [id, lengthMm, margin, on, onPrint, stock, text, width]);

  /** What each key does when it goes down. */
  const run = useCallback(
    (key: Key) => {
      setPressed((was) => ({ key: key.id, n: (was?.n ?? 0) + 1 }));
      if (key.id === 'power') {
        const next = !on;
        if (controlledOn === undefined) setOwnOn(next);
        setSaid(next ? 'On' : 'Off');
        return;
      }
      if (!on) return;
      if (key.char !== undefined) {
        const upper = shift !== caps;
        type(key.char === ' ' ? ' ' : upper ? (key.shifted ?? key.char) : key.char);
        return;
      }
      switch (key.id) {
        case 'backspace': {
          if (!text) return setSaid('Nothing to take back');
          const next = text.slice(0, -1);
          write(next);
          return setSaid(`Back — ${next.trim() || 'nothing yet'}`);
        }
        case 'clear':
          write('');
          return setSaid('Cleared');
        case 'print':
          return print();
        case 'feed':
          setOut(null);
          return setSaid('Fed a blank run of tape through');
        case 'caps':
          setCaps((was) => !was);
          return setSaid(caps ? 'Caps off' : 'Caps on');
        case 'shift':
          setShift((was) => !was);
          return setSaid(shift ? 'Shift off' : 'Shift — the next character only');
        case 'bluetooth':
          setPaired((was) => !was);
          return setSaid(paired ? 'Bluetooth off' : 'Bluetooth on');
        default:
          return setSaid(keyName(key));
      }
    },
    [caps, controlledOn, on, paired, print, shift, text, type, write],
  );

  /** A key pressed anywhere on the machine goes to the drawn key that carries it. */
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    /* Enter and the space bar belong to whichever drawn key has the focus. */
    if (event.key === 'Enter' || event.key === ' ') return;
    const named: Record<string, string> = { Backspace: 'backspace', Escape: 'escape', ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    const byName = named[event.key] && KEYS.find((key) => key.id === named[event.key]);
    if (byName) {
      event.preventDefault();
      return run(byName);
    }
    if (event.key.length !== 1) return;
    const key = keyFor(event.key);
    if (!key) return;
    event.preventDefault();
    setPressed((was) => ({ key: key.id, n: (was?.n ?? 0) + 1 }));
    type(event.key);
  };

  /* What the screen can show at once, wound to the end the cursor is at. */
  const shown = text.length > WINDOW ? text.slice(text.length - WINDOW) : text;
  const vars = {
    '--label-bro-rotation': `${rotation}deg`,
    '--label-bro-ink': STOCK[stock].ink,
    '--label-bro-tape': STOCK[stock].tape,
  } as React.CSSProperties;

  return (
    <div
      className={`label-bro ${className}`}
      data-stock={stock}
      data-on={on ? '' : undefined}
      role="group"
      aria-label={`Label printer, ${width} millimetre ${STOCK[stock].name} tape${text.trim() ? `, the screen reads ${text.trim()}` : ''}`}
      onKeyDown={onKeyDown}
      style={{ ...vars, ...style }}
    >
      {/* The machine itself, which has a thickness and so a top face to lift. */}
      <div className="label-bro__body">
        {/* What is in the exit slot: the last thing printed, or a blank run of leader. */}
        <div className="label-bro__strip" style={{ '--label-bro-strip': out ? tapeUnits(out.text, out.width, out.margin) : LEADER } as React.CSSProperties}>
          <PrintedLabel
            text={out?.text ?? ''}
            width={out?.width ?? width}
            stock={out?.stock ?? stock}
            margin={out?.margin ?? margin}
            runUnits={out ? undefined : LEADER}
          />
        </div>

        {/* The shell: one moulding, with the cassette door a separate part at the back. */}
        <div className="label-bro__shell" aria-hidden="true">
          <span className="label-bro__lid" />
          <span className="label-bro__catch" />
          <span className="label-bro__slot" />
          {/* The width guide printed on the door, with the cassette that is in it marked. */}
          <span className="label-bro__widths">
            {TAPE_WIDTHS.map((mm) => (
              <b key={mm} data-fitted={mm === width ? '' : undefined}>
                {mm}
              </b>
            ))}
          </span>
        </div>

        {/* What is screen-printed on the deck. */}
        <span className="label-bro__brand" aria-hidden="true">brother</span>
        <span className="label-bro__model" aria-hidden="true">
          <b>P-touch</b>
          <i>D460BT</i>
        </span>
        <span className="label-bro__badge" aria-hidden="true">
          <s>{ICON.bluetooth}</s>
          <em>PC Connectable</em>
        </span>
        <span className="label-bro__legend label-bro__legend--feed" aria-hidden="true">Feed</span>
        <span className="label-bro__legend label-bro__legend--print" aria-hidden="true">Print Options</span>
        <span className="label-bro__legend label-bro__legend--bt" aria-hidden="true">Bluetooth</span>

        {/* The screen: a grey-green panel that only shows anything when the machine is on. */}
        <div className="label-bro__screen" aria-hidden="true">
          <span className="label-bro__glass">
            <span className="label-bro__row label-bro__row--status">
              <i>{widthLabel(width)}</i>
              <i data-lit={caps ? '' : undefined}>A</i>
              <i data-lit={shift ? '' : undefined}>⇧</i>
              <i data-lit={paired ? '' : undefined}>BT</i>
            </span>
            <span className="label-bro__row label-bro__row--line">
              <u>{shown}</u>
              <b className="label-bro__caret" />
            </span>
            <span className="label-bro__row label-bro__row--gauge">
              <i>{text.length}/{limit}</i>
              <i>{lengthMm}mm</i>
            </span>
          </span>
        </div>

        {/* The keyboard. Every cap is a real button, wherever the layout put it. */}
        <div className="label-bro__keys">
          {KEYS.map((key) => (
            <button
              type="button"
              key={key.id}
              className="label-bro__key"
              data-tone={key.tone}
              data-round={key.round ? '' : undefined}
              data-down={pressed?.key === key.id ? '' : undefined}
              data-latched={(key.id === 'caps' && caps) || (key.id === 'shift' && shift) || (key.id === 'bluetooth' && paired) ? '' : undefined}
              aria-label={keyName(key)}
              aria-pressed={key.id === 'caps' ? caps : key.id === 'shift' ? shift : key.id === 'bluetooth' ? paired : undefined}
              onClick={() => run(key)}
              style={{ '--key-x': key.x, '--key-y': key.y, '--key-w': key.w, '--key-h': key.h } as React.CSSProperties}
            >
              {key.icon ? <s aria-hidden="true">{ICON[key.icon]}</s> : null}
              {key.sub ? <i aria-hidden="true">{key.sub}</i> : null}
              {key.cap && !key.icon ? <b aria-hidden="true">{key.cap}</b> : null}
            </button>
          ))}
        </div>
      </div>

      <span className="label-bro__said" role="status" aria-live="polite">
        {said}
      </span>
    </div>
  );
}
