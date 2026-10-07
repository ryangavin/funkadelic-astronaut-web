/**
 * The cut. Each shot plays `clip` from `from` seconds, for `bars` bars of the
 * song. `nyack` is the band's own porchfest footage, committed at
 * assets/epk/nyack-set.mp4; every other clip is an 8-second section of one of
 * the band's YouTube videos in public/media, fetched as trailer/README.md
 * describes.
 *
 * `focus` is the horizontal `object-position` the vertical cut crops to, 0
 * (left edge) to 100 (right edge), chosen to keep the band, or the crowd, in
 * shot. `move` is the shot's slow Ken Burns move: a push in, a pull out, or a
 * pan towards the left or right.
 */
export type Move = 'in' | 'out' | 'left' | 'right';

export type Shot = {
  clip: string;
  from: number;
  bars: number;
  focus: number;
  move: Move;
  /** A line of the title card laid over the shot. */
  title?: 'genre' | 'place';
};

/** Where the band stands in each room. */
const NYACK = 50;
const OLIVES = 76;
const LENORAS = 48;
const STUDIO = 12;

/** The porchfest crowd from the street, under the intro's title. */
export const INTRO_SHOT: Shot = { clip: 'nyack', from: 0.5, bars: 1, focus: NYACK, move: 'in' };

/** The porchfest crowd, softened under the end card. */
export const END_SHOT: Shot = { clip: 'nyack', from: 3, bars: 3, focus: NYACK, move: 'out' };

/** Ten bars, one shot each, four of them the Nyack crowd: they play to people. */
export const SHOTS: Shot[] = [
  { clip: 'nyack', from: 19.5, bars: 1, focus: 40, move: 'in' },
  { clip: 'olives-1', from: 0, bars: 1, focus: OLIVES, move: 'right' },
  { clip: 'nyack', from: 27, bars: 1, focus: 35, move: 'left', title: 'genre' },
  { clip: 'lenoras-1', from: 1, bars: 1, focus: LENORAS, move: 'in', title: 'genre' },
  { clip: 'nyack', from: 47, bars: 1, focus: NYACK, move: 'right' },
  { clip: 'olives-3', from: 0, bars: 1, focus: OLIVES, move: 'out', title: 'place' },
  { clip: 'prelude-1', from: 1, bars: 1, focus: STUDIO, move: 'in', title: 'place' },
  { clip: 'nyack', from: 72, bars: 1, focus: 60, move: 'left' },
  { clip: 'lenoras-4', from: 2, bars: 1, focus: LENORAS, move: 'out' },
  { clip: 'olives-5', from: 1, bars: 1, focus: OLIVES, move: 'in' },
];
