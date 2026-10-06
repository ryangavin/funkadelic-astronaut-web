/*
  The file worked out apart from the drawing, so the wheel can be reasoned
  about — and tested — on its own.

  Everything is in ninety-sixths of an inch, which is how the whole thing is
  drawn. A rotary card is 4 inches by 2 5/8, which is 384 by 252 of them.
*/

/** A rotary card's width, in units: 4 inches, the size the V-File was cut for. */
const ROLODEX_CARD_WIDTH = 384;

/** The tray's depth, in units: 6 1/2 inches front to back, which is what the two fallen packs need. */
const ROLODEX_TRAY_DEPTH = 624;
/** The cheek the spindle is journalled in: a quarter inch of steel either side of the cards. */
const ROLODEX_CHEEK = 24;

/**
 * A knob, in units: a knurled wheel 1 3/4 inches across and a bit under half
 * an inch thick. Its axle lies along the spindle, so from straight above a
 * knob is not a disc at all — it is the strip of rim at the top of it, as wide
 * as the knob is thick and as long as the knob is across.
 */
export const ROLODEX_KNOB_ACROSS = 168;
const ROLODEX_KNOB_THICK = 43;

/** The spindle runs across the middle of the tray, and everything hangs off it. */
const ROLODEX_SPINDLE = ROLODEX_TRAY_DEPTH / 2;
/** Where the cards' 4 inches start, between the cheeks. */
const ROLODEX_WELL_LEFT = ROLODEX_KNOB_THICK + ROLODEX_CHEEK;

/** How much of the tray's depth the two packs of fallen cards are free to lie in. */
const ROLODEX_COMB_DEPTH = 480;
/** How far apart two top edges are drawn, at the most and at the least: an empty file spreads, a full one packs. */
const ROLODEX_PITCH_MAX = 22;
const ROLODEX_PITCH_MIN = 4;
/** The hole the card that has been taken out leaves in the comb, in pitches. */
const ROLODEX_GAP = 2.4;

/** The tab itself, in units, and how many lanes they are staggered across so a row of them can be read. */
const ROLODEX_TAB_WIDTH = 74;
const ROLODEX_TAB_LANES = 5;

/** How far a knob is dragged to turn one card, in units: a bit over a quarter of an inch of rim. */
export const ROLODEX_DRAG = 26;
/** How far the pointer may wander and still count as a click on the knob, in pixels. */
export const ROLODEX_SLOP = 4;

export type RolodexEntry = {
  /** The divider it files behind. Defaults to the first letter of the name. */
  tab?: string;
  /** The name typed across the top of the card. */
  name: string;
  /** The lines typed under it. A run wrapped in ~~ was struck out on the machine and typed again after. */
  lines?: string[];
  /** Added later in pen, over the type, the way a card collects corrections. */
  note?: string;
  /** A rubber stamp banged across it: PAID, CANCELLED, whatever was on the desk. */
  stamp?: string;
  /** Anything the caller wants to know the card by again. */
  id?: string;
};

/**
 * A place on the wheel. A divider hangs off the rails exactly as a card does,
 * so it takes a place of its own, and the first card under a letter is a whole
 * place behind its divider.
 */
type RolodexSlot = {
  /** The card filed here, if this place holds one rather than a divider. */
  card?: RolodexEntry;
  /** Which card in the file this place is, or which card a divider stands in front of. */
  index: number;
  /** The letter cut in the tab, if this place holds a divider. */
  letter?: string;
  /** Which lane across the top edge that tab is cut in. */
  lane?: number;
};

/** A run of type, and whether the typist struck it out rather than starting the card again. */
type RolodexRun = { text: string; struck: boolean };

/** Round a number into the file, so turning past the end of the wheel comes back at the front. */
export function wrap(value: number, count: number): number {
  if (count <= 0) return 0;
  const whole = Math.round(Number.isFinite(value) ? value : 0);
  return ((whole % count) + count) % count;
}

/** The letter a card files under. */
export function tabOf(card: RolodexEntry): string {
  const letter = (card.tab ?? card.name.trim().charAt(0) ?? '').toUpperCase();
  return letter || '#';
}

/**
 * Everything hanging off the rails, in the order it is filed: the first card
 * under a letter gets a divider in front of it, and the rest of that letter
 * follows on behind.
 */
export function wheelOf(cards: readonly RolodexEntry[]): RolodexSlot[] {
  const filed = new Set<string>();
  const wheel: RolodexSlot[] = [];
  cards.forEach((card, index) => {
    const letter = tabOf(card);
    if (!filed.has(letter)) {
      filed.add(letter);
      wheel.push({ letter, lane: (filed.size - 1) % ROLODEX_TAB_LANES, index });
    }
    wheel.push({ card, index });
  });
  return wheel;
}

/** Where on the wheel each card ended up, once the dividers had taken their places. */
export function placesOf(wheel: readonly RolodexSlot[]): Map<number, number> {
  const places = new Map<number, number>();
  wheel.forEach((slot, place) => {
    if (slot.card) places.set(slot.index, place);
  });
  return places;
}

/**
 * How far apart the top edges lie. A file of ten cards has nothing holding its
 * two packs together and they spread over the tray; a full one packs down to
 * the thickness of its own stock.
 */
export function pitchOf(places: number): number {
  if (places <= 1) return ROLODEX_PITCH_MAX;
  const room = ROLODEX_COMB_DEPTH / (places - 1 + ROLODEX_GAP);
  return Math.max(ROLODEX_PITCH_MIN, Math.min(ROLODEX_PITCH_MAX, room));
}

/**
 * Where a place's top edge is drawn, front to back across the tray. The card
 * that has been pulled out is not there, and everything behind it has closed
 * up to the far side of the hole it left — which is the hole moving along the
 * comb as the wheel is turned.
 */
export function edgeAt(place: number, places: number, drawn: number, pitch: number): number {
  const spread = (places - 1 + ROLODEX_GAP) * pitch;
  const start = ROLODEX_SPINDLE - spread / 2;
  return start + place * pitch + (place > drawn ? ROLODEX_GAP * pitch : 0);
}

/** Where a tab is cut across the divider's top edge, in units. */
export function tabAt(lane: number): number {
  const step = (ROLODEX_CARD_WIDTH - ROLODEX_TAB_WIDTH) / (ROLODEX_TAB_LANES - 1);
  return ROLODEX_WELL_LEFT + lane * step;
}

/** The next card under a letter, starting after the one showing, so pressing a tab again walks that letter. */
export function jumpTo(cards: readonly RolodexEntry[], letter: string, from: number): number {
  const wanted = letter.toUpperCase();
  for (let step = 1; step <= cards.length; step += 1) {
    const index = (from + step) % cards.length;
    if (tabOf(cards[index]) === wanted) return index;
  }
  return from;
}

/** Splits a typed line into what was left standing and what was struck out. */
export function runsOf(line: string): RolodexRun[] {
  return line
    .split(/(~~[^~]*~~)/)
    .filter((piece) => piece.length > 0)
    .map((piece) =>
      piece.length >= 4 && piece.startsWith('~~') && piece.endsWith('~~') ? { text: piece.slice(2, -2), struck: true } : { text: piece, struck: false },
    );
}

/**
 * How unevenly a given key struck: no typewriter sets two letters at the same
 * height or with the same weight of ink. Seeded, so a card types the same way
 * twice.
 */
export function wobble(seed: number): number {
  const spun = Math.sin(seed * 12.9898 + 4.1414) * 43758.5453;
  return (spun - Math.floor(spun)) * 2 - 1;
}
