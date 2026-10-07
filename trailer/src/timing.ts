/**
 * The trailer is cut to "Time to Save the Universe", which is played to a
 * 110 BPM click, so every cut and title lands on a bar or a beat.
 */
export const FPS = 30;
export const BPM = 110;
export const BEAT = 60 / BPM;
export const BAR = 4 * BEAT;

/** Where the song's bars sit: bar 27 starts on the downbeat at 1:00.44. */
const songBar = (n: number) => 60.44 + (n - 27) * BAR;

/** The two bars of build-up the intro plays over (2:01.5). */
export const SONG_INTRO_AT = songBar(55);
/** The loudest 16 bars (2:05.9 to 2:40.8), looped under the clips and back round for the end card. */
export const SONG_LOOP_AT = songBar(57);

/** The trailer's own bars: intro, the clips, the end card. */
export const INTRO_BARS = 2;
export const CLIP_BARS = 16;
export const END_BARS = 4;
export const TOTAL_BARS = INTRO_BARS + CLIP_BARS + END_BARS;

/** The frame a (fractional) bar of the trailer starts on. Rounded from seconds, so the cuts never drift off the beat. */
export const barFrame = (bars: number) => Math.round(bars * BAR * FPS);
export const secondsFrame = (seconds: number) => Math.round(seconds * FPS);
