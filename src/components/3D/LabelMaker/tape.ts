/*
  The tape itself, in numbers.

  Dymo embossing tape is 3/8 of an inch wide — 9.5 mm — of glossy pigmented
  PVC on a roll. The dies around the wheel are cut on a fixed pitch, so the
  machine is a monospace: every character advances the tape the same 5 mm,
  whether it is an I or a W, and stands about 4.7 mm tall. A ten-character
  label comes off the machine 60 mm long, which is what a real one measures.

  Everything here — and everything in the machine's drawing — is counted in
  quarter-millimetres, so the tape and the machine that makes it are in the
  same unit and can be laid against each other without arithmetic.
*/

/** A drawing unit is a quarter of a millimetre. */
export const UNIT_MM = 0.25;

/** 3/8 of an inch across: 38 units, 9.5 mm. */
export const TAPE_WIDTH = 38;

/** The pitch the wheel advances the tape by, one character at a time: 5 mm. */
export const CHARACTER_PITCH = 20;

/** The blank run the cutter leaves at each end — one character's worth, as on a real label. */
export const TAPE_MARGIN = CHARACTER_PITCH;

/** How deep the scalloped blade bites into the cut, in units: two millimetres. */
export const SCALLOP_DEPTH = 8;

/** The colours the tape is sold in. */
export const LABEL_COLORS = ['red', 'black', 'blue', 'green'] as const;
export type LabelColor = (typeof LABEL_COLORS)[number];

/** Which blade is fitted: the straight one, or the one that leaves a wavy edge. */
export const LABEL_CUTS = ['straight', 'scalloped'] as const;
export type LabelCut = (typeof LABEL_CUTS)[number];

/** How long a strip carrying this text runs, in drawing units. */
export const tapeUnits = (text: string) => TAPE_MARGIN * 2 + CHARACTER_PITCH * text.length;

/** The same length in millimetres, which is what anyone laying it on a desk wants. */
export const tapeMm = (text: string) => Math.round(tapeUnits(text) * UNIT_MM * 10) / 10;

/**
 * The shape the blade leaves at the two ends.
 *
 * A straight blade needs no clipping. The scalloped blade is a wave, and it
 * cuts both labels at once: where it bites into the strip in front of it, it
 * leaves a matching bulge on the strip behind. So a label's two ends are
 * complements of one another and two labels cut in a row will nest together.
 * The strip stays the same length at every point across its width.
 */
export function tapeClip(cut: LabelCut): string | undefined {
  if (cut !== 'scalloped') return undefined;
  const steps = 18;
  const waves = 2;
  const bite = (t: number) => (SCALLOP_DEPTH * (1 - Math.cos(2 * Math.PI * waves * t))) / 2;
  const points: string[] = [];
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    points.push(`calc(${bite(t).toFixed(2)} * var(--label-unit)) ${(t * 100).toFixed(2)}%`);
  }
  for (let step = steps; step >= 0; step -= 1) {
    const t = step / steps;
    points.push(`calc(100% - ${(SCALLOP_DEPTH - bite(t)).toFixed(2)} * var(--label-unit)) ${(t * 100).toFixed(2)}%`);
  }
  return `polygon(${points.join(', ')})`;
}
