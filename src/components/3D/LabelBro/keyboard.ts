/*
  The keyboard, laid out once.

  Everything on this machine is counted in quarter-millimetres, so the body is
  732 units across by 772 deep — 183 by 193 millimetres, which is what a
  desktop P-touch measures. The keys are on a 45-unit pitch: 40-unit caps with
  5 between them, or 11.25 mm centre to centre, which is a little tighter than
  a typewriter and exactly what a machine you thumb rather than touch-type on
  gets away with.

  Eight rows. The top two are the light grey function keys, the four in the
  middle are an ordinary QWERTY, and the arrows sit in the well to the right
  of the numbers where there is nothing else to put. The power key is round
  and red and sits on its own at the left, the way it does on the real thing.
*/

/** The machine's plan, in units: 183 by 193 millimetres. */
export const BODY = { w: 732, h: 772 };

/** A plain character cap, and the gap between caps. */
const CAP = 40;
const GAP = 5;
/** How deep a key is, and how far it is from the one behind it. */
const DEEP = 38;
const PITCH = 48;

/** The first row of keys, and each row after it. */
const ROW = (n: number) => 340 + n * PITCH;

/** What a key is made of, which is the only thing that sets its colour. */
export type KeyTone = 'dark' | 'light' | 'print' | 'power';

/** An icon the cap carries instead of a legend. */
export type KeyIcon = 'power' | 'home' | 'bluetooth' | 'feed' | 'up' | 'down' | 'left' | 'right' | 'enter' | 'shift' | 'barcode' | 'backlight';

export type Key = {
  /** What the machine calls it. What the click handler switches on. */
  id: string;
  /** The legend on the cap. */
  cap?: string;
  /** The smaller legend above it: what Shift gets you. */
  sub?: string;
  /** What it types unshifted. A key with no character does something instead. */
  char?: string;
  /** What it types with Shift down. */
  shifted?: string;
  /** What to call it out loud, where the legend alone will not do. */
  name?: string;
  /** An icon instead of a legend. */
  icon?: KeyIcon;
  x: number;
  y: number;
  w: number;
  h: number;
  tone: KeyTone;
  /** Round, like the power key. */
  round?: boolean;
};

type Spec = Omit<Key, 'x' | 'y' | 'w' | 'h' | 'tone'> & { w?: number; h?: number; tone?: KeyTone; before?: number };

/** Lay a run of keys left to right from a starting edge, in units. */
function lay(row: number, from: number, tone: KeyTone, specs: Spec[]): Key[] {
  let x = from;
  return specs.map((spec) => {
    x += spec.before ?? 0;
    const w = spec.w ?? CAP;
    const key: Key = { ...spec, x, y: ROW(row), w, h: spec.h ?? DEEP, tone: spec.tone ?? tone };
    x += w + GAP;
    return key;
  });
}

/** A letter: printed as a capital, types lower case until Caps or Shift says otherwise. */
const letter = (upper: string): Spec => ({ id: upper, cap: upper, char: upper.toLowerCase(), shifted: upper });

/** A number or a mark, with whatever Shift gets you printed above it. */
const pair = (lower: string, upper: string): Spec => ({ id: lower, cap: lower, sub: upper, char: lower, shifted: upper });

const LEFT = 40;

/*
  Row A: the two keys that put tape through the machine. They sit off on their
  own at the right, under the branding, because on the real thing everything
  to their left at this depth is screen.
*/
const rowA = lay(0, 543, 'light', [
  { id: 'feed', icon: 'feed', name: 'Feed the tape', w: 72 },
  { id: 'print', cap: 'Print', name: 'Print', w: 72, tone: 'print' },
]);

/* Row B: what the label is, rather than what it says. And the two that take it back. */
const rowB = [
  ...lay(1, LEFT, 'light', [
    { id: 'font', cap: 'Font', w: 72 },
    { id: 'label', cap: 'Label', w: 72 },
    { id: 'frame', cap: 'Frame', w: 72 },
    { id: 'symbol', cap: 'Symbol', w: 72 },
    { id: 'save', cap: 'Save', w: 72 },
  ]),
  ...lay(1, 587, 'light', [
    { id: 'clear', cap: 'Clear', name: 'Clear the label', w: 50 },
    { id: 'backspace', cap: 'BS', name: 'Backspace', w: 50 },
  ]),
];

/* Row C: the round red one, and the two beside it. The middle of this row is bare deck. */
const rowC = lay(2, LEFT, 'dark', [
  { id: 'power', icon: 'power', name: 'Power', w: 46, h: 46, tone: 'power', round: true },
  { id: 'bluetooth', icon: 'bluetooth', name: 'Bluetooth', w: 46, h: 46, round: true },
  { id: 'home', icon: 'home', name: 'Home', w: 46, h: 46, round: true },
]);

/* Rows D to G: an ordinary QWERTY, and the keys that hang off its right. */
const rowD = lay(3, LEFT, 'dark', [
  pair('1', '!'), pair('2', '@'), pair('3', '#'), pair('4', '$'), pair('5', '%'), pair('6', '^'),
  pair('7', '&'), pair('8', '*'), pair('9', '('), pair('0', ')'), pair('-', '_'), pair('=', '+'),
]);

const rowE = [
  ...lay(4, LEFT, 'dark', [
    { id: 'tab', cap: 'Tab', char: ' ', w: 52, tone: 'light' },
    ...'QWERTYUIOP'.split('').map(letter),
  ]),
  ...lay(4, 593, 'dark', [
    { id: 'escape', cap: 'Esc', name: 'Escape', w: 47 },
    { id: 'ok', cap: 'OK', w: 47 },
  ]),
];

const rowF = [
  ...lay(5, LEFT, 'dark', [
    { id: 'caps', cap: 'Caps', w: 54, tone: 'light' },
    ...'ASDFGHJKL'.split('').map(letter),
    pair(';', ':'),
    pair("'", '"'),
  ]),
  ...lay(5, 594, 'dark', [{ id: 'enter', cap: 'Enter', icon: 'enter', name: 'Enter', w: 98 }]),
];

const rowG = [
  ...lay(6, LEFT, 'dark', [
    { id: 'shift', cap: 'Shift', icon: 'shift', w: 70, tone: 'light' },
    ...'ZXCVBNM'.split('').map(letter),
    pair(',', '<'),
    pair('.', '>'),
    pair('/', '?'),
  ]),
  ...lay(6, 565, 'dark', [{ id: 'accent', cap: 'Accent', w: 75, tone: 'light' }]),
];

/* Row H: the long one, and the two oddities that ended up beside it. */
const rowH = lay(7, 190, 'dark', [
  { id: 'backlight', cap: 'Backlight', w: 80, tone: 'light' },
  { id: 'barcode', cap: 'Barcode', w: 80, tone: 'light' },
  { id: 'space', cap: 'Space', char: ' ', name: 'Space', w: 180 },
]);

/*
  The arrows, in the well to the right of the numbers: a plus of four caps
  spanning the two rows the numbers and QWERTY leave empty out there.
*/
const ARROW = 32;
const arrows: Key[] = [
  { id: 'up', icon: 'up', name: 'Up', x: 626, y: ROW(3), w: ARROW, h: 30, tone: 'dark' },
  { id: 'left', icon: 'left', name: 'Left', x: 592, y: ROW(3) + 32, w: ARROW, h: 30, tone: 'dark' },
  { id: 'right', icon: 'right', name: 'Right', x: 660, y: ROW(3) + 32, w: ARROW, h: 30, tone: 'dark' },
  { id: 'down', icon: 'down', name: 'Down', x: 626, y: ROW(3) + 64, w: ARROW, h: 30, tone: 'dark' },
];

/** Every key on the machine, in the order a thumb would find them. */
export const KEYS: Key[] = [...rowA, ...rowB, ...rowC, ...rowD, ...rowE, ...rowF, ...rowG, ...rowH, ...arrows];

/** The keys that put a character on the tape. */
export const TYPING = KEYS.filter((key) => key.char !== undefined);

/** Find the key a pressed keyboard character belongs to, so a real key lights the drawn one. */
export function keyFor(character: string): Key | undefined {
  return TYPING.find((key) => key.char === character || key.shifted === character);
}

/** What to call a key out loud. */
export const keyName = (key: Key) => key.name ?? key.cap ?? key.id;
