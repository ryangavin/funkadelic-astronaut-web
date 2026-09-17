import type React from 'react';
import '../../../styles/fonts.css';
import { CHARACTER_PITCH, TAPE_WIDTH, tapeClip, tapeMm, tapeUnits, type LabelColor, type LabelCut } from './tape';
import './Label.css';

export { LABEL_COLORS, LABEL_CUTS, tapeMm, tapeUnits, type LabelColor, type LabelCut } from './tape';

export type LabelProps = {
  /** What is stamped into it. Capitals only — the wheel has no lower-case dies. */
  text?: string;
  /** The PVC it was cut from. */
  color?: LabelColor;
  /** What the blade left at the two ends. */
  cut?: LabelCut;
  /** How it came to rest, in degrees. Negative lies it counter-clockwise. */
  rotation?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * A strip of embossed tape, cut off and lying wherever it was dropped: glossy
 * 3/8 inch PVC with the characters pressed up out of it from behind. The
 * pigment is only in the plastic, so where the die has stretched and stressed
 * it the colour goes out of it and the letter comes up white — that whitening
 * is the whole reason the thing is legible, and the only reason anyone ever
 * bought one. A blank run of a character's width sits at each end, the tape
 * curls a little, and the raised letters keep it off the desk just enough to
 * throw a shadow. Sized by its parent's width.
 */
export function Label({ text = '', color = 'red', cut = 'straight', rotation = 0, className = '', style }: LabelProps) {
  const characters = [...text];
  const units = tapeUnits(text);
  const clip = tapeClip(cut);
  return (
    <div
      className={`label ${className}`}
      data-color={color}
      data-cut={cut}
      role="img"
      aria-label={text ? `Embossed ${color} label: ${text}` : `A blank strip of ${color} tape`}
      style={
        {
          '--label-rotation': `${rotation}deg`,
          '--label-units': units,
          aspectRatio: `${units} / ${TAPE_WIDTH}`,
          ...style,
        } as React.CSSProperties
      }
    >
      <div className="label__tape" style={clip ? { clipPath: clip } : undefined}>
        <span className="label__text" aria-hidden="true">
          {characters.map((character, index) => (
            <span className="label__char" key={`${index}-${character}`}>
              {character === ' ' ? ' ' : character}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

/** The width of a strip carrying this text, in millimetres, for anyone laying one out at scale. */
export const labelMm = tapeMm;
/** A character's worth of tape, in millimetres. */
export const LABEL_PITCH_MM = CHARACTER_PITCH * 0.25;
/** The tape's width in millimetres: 3/8 of an inch. */
export const LABEL_WIDTH_MM = TAPE_WIDTH * 0.25;
