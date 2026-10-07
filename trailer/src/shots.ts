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
  /** How far down the frame the move centres, as a percentage; 45 unless the crowd is higher up. */
  focusY?: number;
  /** Lifts footage too dark to read the crowd in. */
  look?: 'lift';
  /** A line of the title card laid over the shot. */
  title?: 'genre' | 'place';
};

/** Where the band stands in each room. */
const NYACK = 50;
const OLIVES = 76;
const LENORAS = 48;
/** Barrier Brewing, from behind the band: the crowd is up and to the left, beyond the barrier. */
const BARRIER = 30;
/** Space Invasion II, from the soundboard over a full room to the stage. */
const SPACE_INVASION = 55;
/** Sprout Music Collective, wide: the stage at the left, the dance floor across the middle. */
const SPROUT = 20;

/** The packed room at Space Invasion II (opening for Space Bacon), under the intro's title. */
export const INTRO_SHOT: Shot = { clip: 'spacebacon-2', from: 0, bars: 2, focus: SPACE_INVASION, move: 'in', look: 'lift' };

/** The porchfest crowd, softened under the end card. */
export const END_SHOT: Shot = { clip: 'nyack', from: 3, bars: 3, focus: NYACK, move: 'out' };

/** Nine bars, one shot each, five of them crowds: this band is a live band. */
export const SHOTS: Shot[] = [
  { clip: 'sprout-1', from: 0, bars: 1, focus: SPROUT, move: 'in' },
  { clip: 'olives-1', from: 0, bars: 1, focus: OLIVES, move: 'right' },
  { clip: 'nyack', from: 19.5, bars: 1, focus: 40, move: 'in', title: 'genre' },
  { clip: 'lenoras-1', from: 1, bars: 1, focus: LENORAS, move: 'in', title: 'genre' },
  { clip: 'olives-3', from: 0, bars: 1, focus: OLIVES, move: 'out', title: 'place' },
  { clip: 'nyack', from: 47, bars: 1, focus: NYACK, move: 'right', title: 'place' },
  { clip: 'sprout-1', from: 4.5, bars: 1, focus: SPROUT, move: 'right' },
  { clip: 'barrier-2', from: 2, bars: 1, focus: BARRIER, move: 'left', focusY: 30, look: 'lift' },
  { clip: 'nyack', from: 72, bars: 1, focus: 60, move: 'left' },
];
