/*
  The dies around the wheel.

  The wheel on a hand embosser carries 45 hardened character dies on its rim,
  evenly spaced, so the wheel turns exactly eight degrees from one to the next.
  Capitals only — there are no lower-case dies — then the ten digits, then the
  handful of marks you need to write an address, and last a blank die that
  stresses no plastic at all and gives you a space.
*/

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const MARKS = "&.,-'!?/";

/** The 45 dies, in the order they sit round the rim. */
export const WHEEL: readonly string[] = [...LETTERS, ...DIGITS, ...MARKS, ' '];

/** Degrees from one die to the next: 360 over 45. */
export const DIE_STEP = 360 / WHEEL.length;

const NAMES: Record<string, string> = {
  ' ': 'Space',
  '&': 'Ampersand',
  '.': 'Full stop',
  ',': 'Comma',
  '-': 'Dash',
  "'": 'Apostrophe',
  '!': 'Exclamation mark',
  '?': 'Question mark',
  '/': 'Slash',
};

/** What to call a die out loud. */
export const characterName = (character: string) => NAMES[character] ?? character;

/** The die a keystroke asks for, if the wheel carries one. Lower case comes out as its capital. */
export function keyCharacter(key: string): string | undefined {
  if (key.length !== 1) return undefined;
  const upper = key.toUpperCase();
  return WHEEL.includes(upper) ? upper : undefined;
}

/** Only what the wheel can actually emboss, in capitals, cut to what the machine will run out. */
export const embossable = (text: string, limit: number) =>
  [...text.toUpperCase()].filter((character) => WHEEL.includes(character)).slice(0, limit).join('');

/**
 * How far the wheel has to turn to bring a die to the index, taking the short
 * way round from wherever it is standing. The angle accumulates rather than
 * resetting, so a wheel spun past the blank keeps going instead of unwinding.
 */
export function turnTo(angle: number, index: number) {
  const target = -index * DIE_STEP;
  const delta = (((target - angle + 180) % 360) + 360) % 360 - 180;
  return angle + delta;
}
