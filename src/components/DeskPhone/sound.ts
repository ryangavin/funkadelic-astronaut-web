/*
  The noise the set makes on its own account: the dry click of the dial's
  governor letting the wheel back a tooth at a time, and the beep the
  answering machine puts between one message and the next. Neither is a
  recording — they are made on the spot from an oscillator, because both are
  short, both are dull, and neither is worth a file. The recordings the band
  leaves on the tape play through the audio element instead.

  Everything here fails quietly. A browser that will not give us a sound card,
  or that has not yet had a gesture to unlock one, simply gets no click.
*/

type Context = AudioContext | undefined;

let shared: Context;
let refused = false;

function context(): Context {
  if (refused) return undefined;
  if (shared) {
    if (shared.state === 'suspended') void shared.resume().catch(() => undefined);
    return shared;
  }
  try {
    const Ctor =
      typeof AudioContext !== 'undefined'
        ? AudioContext
        : (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {
      refused = true;
      return undefined;
    }
    shared = new Ctor();
    return shared;
  } catch {
    refused = true;
    return undefined;
  }
}

type Tone = { frequency: number; ms: number; level: number; shape?: OscillatorType };

/** One short tone, faded in and out so it does not click on its own edges. */
export function tone({ frequency, ms, level, shape = 'sine' }: Tone): void {
  const audio = context();
  if (!audio || level <= 0) return;
  try {
    const now = audio.currentTime;
    const seconds = ms / 1000;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = shape;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + seconds + 0.02);
  } catch {
    // No sound card, no click. The wheel still turns.
  }
}

/** The dial breaking the line: a hard little tick, one per pulse. */
export const click = (level = 1): void => tone({ frequency: 1750, ms: 16, level: 0.05 * level, shape: 'square' });

/** The beep the machine lays between messages. */
export const beep = (level = 1): void => tone({ frequency: 1000, ms: 140, level: 0.08 * level });
