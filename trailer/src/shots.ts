/**
 * The cut. Each shot plays a file from public/media (8-second sections of the
 * band's YouTube videos, fetched as trailer/README.md describes) from `from`
 * seconds, for `bars` bars of the song.
 *
 * `focus` is the horizontal `object-position` the vertical cut crops to, 0
 * (left edge) to 100 (right edge), chosen to keep the bassist in shot. `look`
 * lifts the washed-out daylight footage to match the club shows.
 */
export type Shot = {
  clip: string;
  from: number;
  bars: number;
  focus: number;
  look?: 'daylight';
  /** A line of the title card laid over the shot. */
  title?: 'genre' | 'place';
};

/** Where the bassist stands in each room. */
const OLIVES = 76;
const LENORAS = 48;
const STUDIO = 12;
const WILD_AIR = 50;

export const SHOTS: Shot[] = [
  // Eight bars, one shot each: the rooms they play.
  { clip: 'olives-1', from: 0, bars: 1, focus: OLIVES },
  { clip: 'lenoras-2', from: 1, bars: 1, focus: LENORAS },
  { clip: 'prelude-1', from: 1, bars: 1, focus: STUDIO },
  { clip: 'olives-3', from: 0, bars: 1, focus: OLIVES },
  { clip: 'wildair-1', from: 1, bars: 1, focus: WILD_AIR, look: 'daylight' },
  { clip: 'lenoras-3', from: 2, bars: 1, focus: LENORAS },
  { clip: 'howl-2', from: 2, bars: 1, focus: STUDIO },
  { clip: 'olives-2', from: 3, bars: 1, focus: OLIVES },
  // Four bars under the titles.
  { clip: 'lenoras-1', from: 1, bars: 1, focus: LENORAS, title: 'genre' },
  { clip: 'prelude-2', from: 2, bars: 1, focus: STUDIO, title: 'genre' },
  { clip: 'olives-5', from: 1, bars: 1, focus: OLIVES, title: 'place' },
  { clip: 'lenoras-4', from: 2, bars: 1, focus: LENORAS, title: 'place' },
  // The last four bars cut on every other beat, into the end card.
  { clip: 'olives-4', from: 4.5, bars: 0.5, focus: OLIVES },
  { clip: 'howl-1', from: 2, bars: 0.5, focus: STUDIO },
  { clip: 'lenoras-5', from: 0.5, bars: 0.5, focus: LENORAS },
  { clip: 'wildair-3', from: 2, bars: 0.5, focus: WILD_AIR, look: 'daylight' },
  { clip: 'olives-3', from: 4, bars: 0.5, focus: OLIVES },
  { clip: 'prelude-1', from: 5, bars: 0.5, focus: STUDIO },
  { clip: 'lenoras-1', from: 4, bars: 0.5, focus: LENORAS },
  { clip: 'olives-1', from: 5, bars: 0.5, focus: OLIVES },
];
