import { useId } from 'react';

export type PaperClipPart = 'whole' | 'front' | 'back';

/*
  One gem clip, 44 x 120. The wire comes up the outer left leg, over the big
  bend, down the outer right leg, round the small bottom bend and back up the
  inner loop. Split at the apex of the big bend so the outer left leg can slip
  behind whatever is clipped while the rest stays in front of it.
*/
const WIRE: Record<PaperClipPart, string> = {
  whole: 'M 8 104 V 20 a 12 12 0 0 1 24 0 V 108 a 8 8 0 0 1 -16 0 V 32 a 4 4 0 0 1 8 0 V 92',
  back: 'M 8 104 V 20 A 12 12 0 0 1 20 8',
  front: 'M 20 8 A 12 12 0 0 1 32 20 V 108 a 8 8 0 0 1 -16 0 V 32 a 4 4 0 0 1 8 0 V 92',
};

/** A gem clip in nickel wire, drawn to be laid over a photo and its card. */
export function PaperClip({ part = 'whole', className = '' }: { part?: PaperClipPart; className?: string }) {
  const id = `paper-clip-${useId().replace(/:/g, '')}`;
  return (
    <svg className={className} viewBox="0 0 44 120" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8d8f99" />
          <stop offset="0.35" stopColor="#eef0f4" />
          <stop offset="0.6" stopColor="#b8bbc4" />
          <stop offset="1" stopColor="#6f717a" />
        </linearGradient>
      </defs>
      <path d={WIRE[part]} fill="none" stroke={`url(#${id})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
