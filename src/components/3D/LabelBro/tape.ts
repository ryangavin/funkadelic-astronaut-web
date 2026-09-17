/*
  The cassette, in numbers.

  A TZe cassette is a sealed box of laminated tape. The print is transferred
  onto the underside of a clear over-laminate and that is then glued down to
  the backing, so the ink ends up inside the sandwich where a thumb cannot
  reach it. That is the whole difference between this and the Dymo down the
  desk: one presses letters into the plastic and one prints them inside it.

  The head is a fixed row of elements and cannot reach the full width of the
  tape, so the print band is about three quarters of the cassette and the rest
  stays blank at the two long edges however small the type is set.

  Everything here is counted in quarter-millimetres — the same unit the Dymo
  is drawn in — so the two machines and their labels can be laid against each
  other without arithmetic.
*/

/** A drawing unit is a quarter of a millimetre. */
export const UNIT_MM = 0.25;

/** Millimetres to drawing units. */
export const mmUnits = (mm: number) => mm / UNIT_MM;

/** The cassettes this machine takes, in millimetres across. 24 mm needs the bigger body. */
export const TAPE_WIDTHS = [3.5, 6, 9, 12, 18] as const;
export type TapeWidth = (typeof TAPE_WIDTHS)[number];

/** What is in the cassette: which ink on which tape. The five a working desk actually keeps. */
export const TAPE_STOCKS = ['black-on-white', 'black-on-yellow', 'black-on-clear', 'white-on-black', 'white-on-red'] as const;
export type TapeStock = (typeof TAPE_STOCKS)[number];

/**
 * The stocks, as colours. Clear tape is the odd one: it is not white, it is
 * whatever it was stuck to, so it is drawn as a faint tint with its own edge
 * showing and the print floating on it.
 */
export const STOCK: Record<TapeStock, { ink: string; tape: string; edge: string; name: string }> = {
  'black-on-white': { ink: '#181818', tape: '#f6f5f1', edge: 'rgb(60 55 45 / 0.28)', name: 'black on white' },
  'black-on-yellow': { ink: '#1b1a12', tape: '#f2c73c', edge: 'rgb(90 68 10 / 0.34)', name: 'black on yellow' },
  'black-on-clear': { ink: '#1a1a1a', tape: 'rgb(236 238 236 / 0.34)', edge: 'rgb(70 76 70 / 0.34)', name: 'black on clear' },
  'white-on-black': { ink: '#f4f4f2', tape: '#232324', edge: 'rgb(0 0 0 / 0.5)', name: 'white on black' },
  'white-on-red': { ink: '#fbf7f5', tape: '#b4272c', edge: 'rgb(74 12 14 / 0.42)', name: 'white on red' },
};

/** What the cutter leaves blank at each end: 4 mm of leader, or 2 mm on the small setting. */
export const MARGINS = { full: 16, small: 8 } as const;
export type Margin = keyof typeof MARGINS;

/** How much of the tape's width the head can reach. The rest is blank margin at the long edges. */
const PRINT_BAND = 0.75;

/** How much of the print band a capital fills, leaving room for descenders. */
const CAP_OF_BAND = 0.8;

/** The band the head can print in on this cassette, in units. */
export const printBand = (width: TapeWidth) => mmUnits(width) * PRINT_BAND;

/** How tall the machine prints a capital on this cassette, in units. */
export const capHeight = (width: TapeWidth) => printBand(width) * CAP_OF_BAND;

/*
  How wide each character comes out. The machine prints a proportional face,
  not a monospace, so it knows every glyph's advance and adds them up before
  it prints — which is how it can tell you the length of a label you have not
  cut yet. These are those advances, as multiples of the cap height.

  They are the face's real metrics and not a guess at them: a capital in a
  grotesque advances about 0.65 of the em and a cap stands about 0.72 of it,
  so a letter is a little wider than it is tall. Setting these short does not
  make a tidier label, it makes the letters run into one another, because the
  drawing spends exactly what the arithmetic costed.
*/
const NARROW = new Set([...`iIjlt.,;:'"!|()[]/\\`]);
const WIDE = new Set([...'MWmw@%&']);
const ADVANCE = { narrow: 0.4, wide: 1.18, space: 0.4, normal: 0.9 };

/** How far one character advances the tape, in units, on this cassette. */
export const advance = (character: string, width: TapeWidth) => {
  const cap = capHeight(width);
  if (character === ' ') return cap * ADVANCE.space;
  if (NARROW.has(character)) return cap * ADVANCE.narrow;
  if (WIDE.has(character)) return cap * ADVANCE.wide;
  return cap * ADVANCE.normal;
};

/** How long a strip carrying this text runs, in units, margins and all. */
export const tapeUnits = (text: string, width: TapeWidth, margin: Margin = 'full') =>
  MARGINS[margin] * 2 + [...text].reduce((run, character) => run + advance(character, width), 0);

/** The same length in millimetres, which is what the machine puts on its screen. */
export const tapeMm = (text: string, width: TapeWidth, margin: Margin = 'full') =>
  Math.round(tapeUnits(text, width, margin) * UNIT_MM);

/** How the machine writes a cassette's width on its screen and on the lid. */
export const widthLabel = (width: TapeWidth) => `${width}mm`;
