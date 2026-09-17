import type React from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import '../../../styles/fonts.css';
import { DIE_STEP, WHEEL, characterName, embossable, keyCharacter, turnTo } from './characters';
import { Label } from './Label';
import { tapeMm, tapeUnits, type LabelColor, type LabelCut } from './tape';
import './LabelMaker.css';

export { Label, type LabelProps } from './Label';
export { LABEL_COLORS, LABEL_CUTS, tapeMm, tapeUnits, UNIT_MM, type LabelColor, type LabelCut } from './tape';
export { WHEEL, characterName } from './characters';

/**
 * How long a strip the machine will run out before you have to cut it. A real
 * roll holds two metres and does not care; a desk has less room than that.
 */
export const LABEL_MAKER_LIMIT = 28;

/** How thick a hand embosser is, as a multiple of the width of its drawing: 32 mm against 180. */
export const LABEL_MAKER_HEIGHT = 128 / 720;

/** Where it sits on the desk within its own drawing: the middle of the footprint, in fractions of the drawing's width. */
export const LABEL_MAKER_FOOT = { x: 360 / 720, y: 400 / 720 };

/** How long the trigger stays down after a squeeze, in milliseconds. */
const SQUEEZE_MS = 150;

/**
 * A strip cut off the machine. It carries everything needed to draw it again
 * somewhere else — hand the whole thing to `<Label>` — plus an `id` to key it
 * by and its length in millimetres, so whoever catches it can size it against
 * the rest of the desk without measuring characters.
 */
export type EmittedLabel = {
  /** Unique to this strip, for keying and dragging it around. */
  id: string;
  /** What is embossed on it. */
  text: string;
  /** The tape it was cut from. */
  color: LabelColor;
  /** What the blade left at the ends. */
  cut: LabelCut;
  /** How long the strip is, in millimetres. The tape is always 9.5 mm across. */
  lengthMm: number;
};

export type LabelMakerProps = {
  /** The roll in the machine. Red, black, blue or green, which is all it was ever sold in. */
  color?: LabelColor;
  /** Which blade is fitted: the straight one, or the one that leaves a wavy end. */
  cutter?: LabelCut;
  /** What is already on the tape sticking out of the slot. Hand this in to drive the machine yourself. */
  text?: string;
  /** What is on the tape before anyone touches it, when you are leaving the machine to look after itself. */
  defaultText?: string;
  /** Called with the tape's new reading whenever a character is embossed or wound back off. */
  onTextChange?: (text: string) => void;
  /** Called when the cut lever comes down, handed the strip that drops off the machine. */
  onEmit?: (label: EmittedLabel) => void;
  /** How far the machine will run the tape out before the roll has to be cut. */
  limit?: number;
  /** How it is lying on the desk, in degrees. Negative tilts counter-clockwise. */
  rotation?: number;
  className?: string;
  style?: React.CSSProperties;
};

const centimetres = (text: string) => `${(tapeMm(text) / 10).toFixed(1)} cm`;

/**
 * A hand embosser for making labels: 180 by 150 millimetres of moulded plastic,
 * with the big wheel of character dies filling the head, the roll of 3/8 inch
 * PVC tape in its well behind it, the squeeze handle underneath and the slot at
 * the nose the finished tape comes out of.
 *
 * It works the way the real one does. Turn the wheel until the character you
 * want is under the index at the top — click it, or use the arrow keys — then
 * squeeze the handle: the die comes down on the tape, the tape advances one
 * character, and another five millimetres of it pushes out of the slot. Typing
 * on a keyboard does both at once, which is what anyone who has ever used one
 * of these wishes it did. When the strip reads what it should, the cut
 * lever at the nose snips it off and it becomes a loose thing you can put down
 * somewhere else.
 *
 * It is drawn looking straight down at it, the way everything here is, and it
 * draws none of its own thickness. It is 32 mm of moulded plastic all the same:
 * stand it in a `Solid` of {@link LABEL_MAKER_HEIGHT} and on a tilted plane the
 * whole top face lifts and leans away from the eye while its side slides out
 * from under it, back down to the footprint it is standing on. Off a tilted
 * surface that is worth nothing and the drawing is exactly what it was.
 */
export function LabelMaker({
  color = 'red',
  cutter = 'straight',
  text: controlled,
  defaultText = '',
  onTextChange,
  onEmit,
  limit = LABEL_MAKER_LIMIT,
  rotation = 0,
  className = '',
  style,
}: LabelMakerProps) {
  const id = useId().replace(/:/g, '');
  const serial = useRef(0);
  const [own, setOwn] = useState(() => embossable(defaultText, limit));
  const [index, setIndex] = useState(0);
  const [angle, setAngle] = useState(0);
  const [squeeze, setSqueeze] = useState(0);
  const [snip, setSnip] = useState(0);
  const [said, setSaid] = useState('');
  const wheel = useRef<HTMLDivElement>(null);

  const text = embossable(controlled ?? own, limit);
  const full = text.length >= limit;

  const write = useCallback(
    (next: string) => {
      if (controlled === undefined) setOwn(next);
      onTextChange?.(next);
    },
    [controlled, onTextChange],
  );

  // The trigger and the cut lever fall back up on their own springs. Each fresh
  // squeeze bumps the count, so holding one down twice in a row holds it down.
  useEffect(() => {
    if (!squeeze) return;
    const timer = setTimeout(() => setSqueeze(0), SQUEEZE_MS);
    return () => clearTimeout(timer);
  }, [squeeze]);
  useEffect(() => {
    if (!snip) return;
    const timer = setTimeout(() => setSnip(0), SQUEEZE_MS * 2);
    return () => clearTimeout(timer);
  }, [snip]);

  // A thumb keeps its place on the rim: when the wheel turns under a focused
  // die, the focus rides round with it to whatever now stands at the index.
  useEffect(() => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !active.classList.contains('label-maker__die')) return;
    if (active.dataset.die === String(index)) return;
    wheel.current?.querySelector<HTMLButtonElement>(`[data-die='${index}']`)?.focus();
  }, [index]);

  /** Turn the wheel to a die without embossing anything, the way a thumb does. */
  const turn = useCallback((to: number) => {
    const next = ((to % WHEEL.length) + WHEEL.length) % WHEEL.length;
    setIndex(next);
    setAngle((standing) => turnTo(standing, next));
    setSaid(`Wheel at ${characterName(WHEEL[next])}`);
  }, []);

  /** Squeeze the handle: the die under the index comes down and the tape moves on. */
  const emboss = useCallback(
    (character: string) => {
      setSqueeze((count) => count + 1);
      if (full) {
        setSaid('The tape is out as far as it goes — cut it off');
        return;
      }
      const next = text + character;
      write(next);
      setSaid(`Embossed ${characterName(character)} — the tape reads ${next.trim() || 'nothing yet'}`);
    },
    [full, text, write],
  );

  /**
   * Winding the tape back off the roll. A real machine cannot do this — what is
   * stamped is stamped, and you cut the strip off and start it again — but a
   * keyboard expects Backspace to mean something, so the wheel gives it up.
   */
  const back = useCallback(() => {
    if (!text) {
      setSaid('Nothing on the tape to wind back');
      return;
    }
    const next = text.slice(0, -1);
    write(next);
    setSaid(`Wound back — the tape reads ${next.trim() || 'nothing yet'}`);
  }, [text, write]);

  /** Drop the cut lever. The strip comes off and the machine starts a fresh leader. */
  const cut = useCallback(() => {
    setSnip((count) => count + 1);
    serial.current += 1;
    const strip: EmittedLabel = { id: `${id}-${serial.current}`, text, color, cut: cutter, lengthMm: tapeMm(text) };
    setSaid(`Cut a ${color} label ${text.trim() ? `reading ${text.trim()}` : 'with nothing on it'}, ${centimetres(text)} long`);
    write('');
    onEmit?.(strip);
  }, [color, cutter, id, onEmit, text, write]);

  /** A key pressed anywhere on the machine turns the wheel to that die and squeezes, in one go. */
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === 'Backspace') {
      event.preventDefault();
      back();
      return;
    }
    // Enter belongs to whichever control has the focus, and so does the space
    // bar when that control is a lever. On a die it does not: a space bar over
    // a wheel means the blank die, and pressing the character already under the
    // index a second time would do nothing worth having.
    const control = event.target instanceof Element ? event.target.closest('button') : null;
    const onLever = control !== null && !control.classList.contains('label-maker__die');
    if (event.key === 'Enter') return;
    if (event.key === ' ' && onLever) return;
    const character = keyCharacter(event.key);
    if (character === undefined) return;
    event.preventDefault();
    const to = WHEEL.indexOf(character);
    setIndex(to);
    setAngle((standing) => turnTo(standing, to));
    emboss(character);
  };

  /** Arrow keys on the wheel turn it a die at a time, which is what a thumb on the rim does. */
  const onWheelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    event.stopPropagation();
    turn(index + step);
  };

  const units = tapeUnits(text);
  const selected = WHEEL[index];
  const cssVars = {
    '--label-maker-rotation': `${rotation}deg`,
    '--label-maker-angle': `${angle}deg`,
  } as React.CSSProperties;

  return (
    <div
      className={`label-maker ${className}`}
      data-color={color}
      data-squeeze={squeeze ? '' : undefined}
      data-snip={snip ? '' : undefined}
      role="group"
      aria-label={`Label maker, ${color} tape${text.trim() ? `, the tape reads ${text.trim()}` : ''}`}
      onKeyDown={onKeyDown}
      style={{ ...cssVars, ...style }}
    >
      {/* The machine itself, which has a thickness and so a top face to lift. */}
      <div className="label-maker__body">
        {/* The tape already out of the slot, growing a character at a time. */}
        <div className="label-maker__strip" style={{ '--label-maker-strip': units } as React.CSSProperties}>
          <Label text={text} color={color} cut={cutter} />
        </div>
        <div className="label-maker__throat" aria-hidden="true" />

        {/* The shell: the round head, the tape well behind it, and the fixed grip. */}
        <div className="label-maker__housing" aria-hidden="true">
          <span className="label-maker__head" />
          <span className="label-maker__snout" />
          <span className="label-maker__grip" />
          <span className="label-maker__well" />
        </div>

        {/* The roll of tape in its well, seen through the window in the cover. */}
        <div className="label-maker__roll" aria-hidden="true">
          <span className="label-maker__coil" />
          <span className="label-maker__spindle" />
        </div>

        {/* The chromed nose: two lips with the slot between them. */}
        <span className="label-maker__lip label-maker__lip--upper" aria-hidden="true" />
        <span className="label-maker__lip label-maker__lip--lower" aria-hidden="true" />

        {/* The wheel of dies. It turns so that the chosen character stands under the index. */}
        <div
          className="label-maker__dial"
          ref={wheel}
          role="group"
          aria-label="Character wheel"
          onKeyDown={onWheelKeyDown}
        >
          <div className="label-maker__ring">
            {WHEEL.map((character, position) => (
              <button
                type="button"
                key={character}
                data-die={position}
                className="label-maker__die"
                aria-label={characterName(character)}
                aria-pressed={position === index}
                tabIndex={position === index ? 0 : -1}
                onClick={() => turn(position)}
                style={{ '--label-maker-die': `${position * DIE_STEP}deg` } as React.CSSProperties}
              >
                <span aria-hidden="true">{character === ' ' ? '␣' : character}</span>
              </button>
            ))}
          </div>
          <span className="label-maker__hub" aria-hidden="true">
            <b>tapewriter</b>
            <i>3/8 in.</i>
          </span>
        </div>

        <span className="label-maker__index" aria-hidden="true" />

        <button type="button" className="label-maker__cut" onClick={cut} aria-label={text.trim() ? `Cut off the label reading ${text.trim()}` : 'Cut the tape'}>
          <span aria-hidden="true">cut</span>
        </button>

        <button
          type="button"
          className="label-maker__trigger"
          aria-label={`Squeeze: emboss ${characterName(selected)}`}
          aria-disabled={full || undefined}
          onClick={() => emboss(selected)}
        >
        </button>
      </div>

      <span className="label-maker__status" role="status" aria-live="polite">
        {said}
      </span>
    </div>
  );
}
