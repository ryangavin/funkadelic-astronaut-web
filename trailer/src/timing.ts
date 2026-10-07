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

/** The song starts two bars before its loudest stretch (2:05.9 to 3:04.8), so the intro is its build-up. */
export const SONG_AT = songBar(55);

/** The trailer's own bars: two bars of intro, then the clips; the end card has what's left of the 30 seconds. */
export const INTRO_BARS = 2;
export const CLIP_BARS = 9;
export const TOTAL_FRAMES = 30 * FPS;

/** The frame a (fractional) bar of the trailer starts on. Rounded from seconds, so the cuts never drift off the beat. */
export const barFrame = (bars: number) => Math.round(bars * BAR * FPS);
export const secondsFrame = (seconds: number) => Math.round(seconds * FPS);
