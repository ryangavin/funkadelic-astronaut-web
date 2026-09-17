import type React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import '../../styles/fonts.css';
import { RolodexCard } from './RolodexCard';
import './Rolodex.css';
import {
  ROLODEX_DRAG,
  ROLODEX_KNOB_ACROSS,
  ROLODEX_SLOP,
  edgeAt,
  jumpTo,
  pitchOf,
  placesOf,
  tabAt,
  tabOf,
  wheelOf,
  wrap,
  type RolodexEntry,
} from './wheel';

export {
  ROLODEX_CARD_HEIGHT,
  ROLODEX_CARD_WIDTH,
  ROLODEX_DEPTH,
  ROLODEX_FOOT,
  ROLODEX_HEIGHT,
  ROLODEX_TALL,
  ROLODEX_TRAY_DEPTH,
  ROLODEX_TRAY_WIDTH,
  ROLODEX_WHEEL_HEIGHT,
  ROLODEX_WHEEL_WIDTH,
  ROLODEX_WIDTH,
  tabOf,
  wheelOf,
  type RolodexEntry,
  type RolodexSlot,
} from './wheel';
export { RolodexCard, type RolodexCardProps } from './RolodexCard';

/** The finishes these came in: the office putty, the black one, and the older bare steel. */
export const ROLODEX_FINISHES = ['putty', 'black', 'steel'] as const;
export type RolodexFinish = (typeof ROLODEX_FINISHES)[number];

/** What the promoter has in the file, filed the way he filed it. */
export const ROLODEX_CARDS: RolodexEntry[] = [
  {
    name: 'Bellweather Sound',
    lines: ['PA hire · Newburgh NY', 'Ask for Dot', 'tel. 845 · 555 · 0114', 'Deposit on the day, cash'],
    note: 'has the 32-channel desk',
  },
  {
    name: 'Cosmo’s Cartage',
    lines: ['Van and driver, overnight', 'tel. 201 · 555 · 0177', '$240 a day, tolls on us'],
    stamp: 'PAID',
  },
  {
    name: 'Dinah Okonkwo',
    lines: ['Lights, and she owns them', 'tel. ~~914 · 555 · 0106~~ 914 · 555 · 0190', 'Will not do a room with no dimmer'],
  },
  {
    name: 'Funkadelic Astronaut',
    lines: ['The band. Ryan, Kevin, Sam.', 'Rehearsal: the garage, Tues + Thurs', 'tel. 845 · 555 · 0042'],
    note: 'not before noon',
  },
  {
    name: 'Half-Moon Printing',
    lines: ['Posters, two colours, 18 × 24', 'Screen work, four days', 'tel. 845 · 555 · 0163'],
    stamp: 'NET 30',
  },
  {
    name: 'Nyack Neighborhood Festival',
    lines: ['5 First Avenue, Nyack NY', 'Sat 26 Sep · on at 6.00', 'Stage manager: Pris', 'Load in from the river side'],
    note: 'no ramp — carry the cab',
  },
  {
    name: 'Olive’s',
    lines: ['87 Main Street, Nyack NY', 'Doors 7.00 · set 8.00', 'tel. 845 · 555 · 0138', 'Door split 70/30 after $200'],
    note: 'ask for the back room',
  },
  {
    name: 'Saturn Lanes',
    lines: ['Hackensack NJ · bowling alley', 'Doors 8.30 · set 9.30', 'tel. 201 · 555 · 0271'],
    note: 'lane 7 is the stage',
  },
  {
    name: 'Teddy Vasquez',
    lines: ['Front of house, and he tunes', 'tel. 917 · 555 · 0155', '$150 a night + the ride home'],
  },
  {
    name: 'Wallace & Sons',
    lines: ['Piano tuning, upright or grand', 'tel. 845 · 555 · 0129', 'Two days’ notice, more in winter'],
    stamp: 'CANCELLED',
  },
];

export type RolodexProps = {
  /** The file itself, in the order it is filed. Anything can be on a card; the wheel takes them as they come. */
  cards?: readonly RolodexEntry[];
  /** Which card has been drawn out and is lying on the desk, when the page is turning the wheel itself. */
  index?: number;
  /** Which card is out when it is first put on the desk. */
  defaultIndex?: number;
  /** Called with the card that came up, every time the wheel is turned. */
  onChange?: (index: number, card: RolodexEntry) => void;
  /** The tray and the knobs: office putty, black, or the older bare steel. */
  finish?: RolodexFinish;
  /** How the file sits on the desk, in degrees. Negative turns it counter-clockwise. */
  rotation?: number;
  /** How the loose card came to rest beside it, in degrees. Nothing on a desk lies square. */
  cardRotation?: number;
  /** Whether the card it is open at is drawn lying beside it. Off, this is the wheel alone and the page lays the card out itself. */
  loose?: boolean;
  /** What the file is, for anyone who cannot see it. */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * A rotary card file, drawn from straight above — the Rolodex V-File, which
 * takes the standard 4 by 2 5/8 inch card: the weighted tray 4 1/2 inches
 * across and 6 1/2 front to back, the spindle between its cheeks, a knurled
 * knob standing off each end of it, and five hundred cards' worth of wheel
 * hanging off two rails by the V notches cut in their bottom edges.
 *
 * From overhead a card on the wheel is one line: it stands on its edge, so
 * all there is of it is the 4 inches of its top edge. That is what the comb
 * down the middle of the tray is — every card in the file, packed fore and
 * aft, with the alphabet dividers standing proud of the rest because they are
 * cut taller, and a hole where the card that has been taken out used to be.
 * The card itself is lying on the desk beside the file, face up, where it can
 * actually be read.
 *
 * Either knob turns it: a click steps one card, a drag along the rim spins it.
 * The arrow keys step it, a letter key or a press on a tab jumps to that
 * letter, and the hole in the comb travels as the wheel goes round. Sized by
 * its parent.
 */
export function Rolodex({
  cards = ROLODEX_CARDS,
  index,
  defaultIndex = 0,
  onChange,
  finish = 'putty',
  rotation = 0,
  cardRotation = -3,
  loose = true,
  label = 'Rotary card file',
  className = '',
  style,
}: RolodexProps) {
  const count = cards.length;
  const [own, setOwn] = useState(() => wrap(defaultIndex, count));
  const current = wrap(index ?? own, count);
  const card = count > 0 ? cards[current] : undefined;

  const select = useCallback(
    (next: number) => {
      if (count === 0) return;
      const landed = wrap(next, count);
      if (index === undefined) setOwn(landed);
      if (landed !== current) onChange?.(landed, cards[landed]);
    },
    [cards, count, current, index, onChange],
  );

  const wheel = useMemo(() => wheelOf(cards), [cards]);
  const places = useMemo(() => placesOf(wheel), [wheel]);
  const drawn = places.get(current) ?? 0;
  const pitch = pitchOf(wheel.length);

  /* A knob under the hand: where it was grabbed, which card was up then, and how far it has been dragged since. */
  const grip = useRef<{ from: number; at: number; perPixel: number; moved: number } | null>(null);
  const spun = useRef(false);

  const take = (event: React.PointerEvent<HTMLButtonElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    if (!box.height) return;
    /* Capture is a convenience — a synthetic pointer may not own one, and the knob still turns without it. */
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* no capture, no matter */
    }
    grip.current = { from: current, at: event.clientY, perPixel: ROLODEX_KNOB_ACROSS / box.height, moved: 0 };
    spun.current = false;
  };

  const turn = (event: React.PointerEvent<HTMLButtonElement>) => {
    const held = grip.current;
    if (!held) return;
    const travelled = event.clientY - held.at;
    held.moved = Math.max(held.moved, Math.abs(travelled));
    if (held.moved <= ROLODEX_SLOP) return;
    spun.current = true;
    /* Rim travelled, in the file's own units, is cards turned: dragging toward you brings the next card up. */
    select(held.from + Math.round((travelled * held.perPixel) / ROLODEX_DRAG));
  };

  const release = (event: React.PointerEvent<HTMLButtonElement>) => {
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* it was never held */
    }
    grip.current = null;
  };

  /* A press on a knob that never turned into a drag is a click, and a click is one card. */
  const click = (step: number) => {
    if (spun.current) {
      spun.current = false;
      return;
    }
    select(current + step);
  };

  const keys = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (count === 0 || event.metaKey || event.ctrlKey || event.altKey) return;
    const key = event.key;
    if (key === 'ArrowDown' || key === 'ArrowRight') select(current + 1);
    else if (key === 'ArrowUp' || key === 'ArrowLeft') select(current - 1);
    else if (key === 'PageDown') select(current + 5);
    else if (key === 'PageUp') select(current - 5);
    else if (key === 'Home') select(0);
    else if (key === 'End') select(count - 1);
    else if (/^[a-z0-9]$/i.test(key)) select(jumpTo(cards, key, current));
    else return;
    event.preventDefault();
  };

  const knob = (side: 'left' | 'right', step: number, name: string) => (
    <button
      type="button"
      className={`rolodex__knob rolodex__knob--${side}`}
      aria-label={name}
      onPointerDown={take}
      onPointerMove={turn}
      onPointerUp={release}
      onPointerCancel={release}
      onClick={() => click(step)}
    >
      <span className="rolodex__knurl" aria-hidden="true" />
    </button>
  );

  return (
    <div
      className={`rolodex ${className}`}
      data-finish={finish}
      data-loose={loose ? '' : undefined}
      role="group"
      aria-label={label}
      onKeyDown={keys}
      style={{ '--rolodex-rotation': `${rotation}deg`, ...style } as React.CSSProperties}
    >
      <div className="rolodex__wheel">
        {/* The tray's footprint, where the file stands. It does not move, whatever the desk is tilted to. */}
        <span className="rolodex__foot" aria-hidden="true" />
        {/* The side of the tray: nothing at all seen from straight above, and it slides out from under the rim as the view comes down. */}
        <span className="rolodex__side" aria-hidden="true" />

        {/* Everything else is the top of the thing, 4 1/4 inches up, and rises and leans with its height. */}
        <div className="rolodex__top">
          <span className="rolodex__tray" aria-hidden="true" />
          <span className="rolodex__cheek rolodex__cheek--left" aria-hidden="true" />
          <span className="rolodex__cheek rolodex__cheek--right" aria-hidden="true" />
          <span className="rolodex__spindle" aria-hidden="true" />

          {/* Every card in the file, seen edge on: one 4-inch line each, and a hole where the one on the desk came out. */}
          <div className="rolodex__comb">
            {wheel.map((slot, place) =>
              slot.card && slot.index === current ? null : (
                <span
                  key={slot.letter ? `tab-${place}` : `edge-${slot.index}`}
                  className={`rolodex__edge${slot.letter ? ' rolodex__edge--divider' : ''}`}
                  data-near={place > drawn ? '' : undefined}
                  style={{ '--rolodex-at': edgeAt(place, wheel.length, drawn, pitch), '--rolodex-place': place } as React.CSSProperties}
                  aria-hidden="true"
                />
              ),
            )}
          </div>

          {/* The dividers' tabs, cut taller than the cards and staggered in five lanes so a row of them can be read. */}
          <div className="rolodex__tabs">
            {wheel.map((slot, place) =>
              slot.letter ? (
                <button
                  type="button"
                  key={`letter-${place}`}
                  className="rolodex__tab"
                  data-near={place > drawn ? '' : undefined}
                  style={
                    {
                      '--rolodex-at': edgeAt(place, wheel.length, drawn, pitch),
                      '--rolodex-lane': tabAt(slot.lane ?? 0),
                      '--rolodex-place': place,
                    } as React.CSSProperties
                  }
                  aria-label={`Go to ${slot.letter}`}
                  onClick={() => select(jumpTo(cards, slot.letter as string, current))}
                >
                  {slot.letter}
                </button>
              ) : null,
            )}
          </div>

          {knob('left', -1, 'Turn back a card')}
          {knob('right', 1, 'Turn on a card')}
        </div>
      </div>

      {loose && card ? (
        <div className="rolodex__loose">
          <RolodexCard card={card} seed={current} rotation={cardRotation} />
        </div>
      ) : null}

      <p className="rolodex__status" role="status">
        {card ? `${card.name} — card ${current + 1} of ${count}, filed under ${tabOf(card)}` : 'No cards in the file'}
      </p>
    </div>
  );
}
