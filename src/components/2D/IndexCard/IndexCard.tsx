import type React from 'react';
import { Weathered } from '../../../behaviors/Weathered/Weathered';
import { Distressed } from '../../../foundations/Distressed/Distressed';
import '../../../styles/fonts.css';
import './IndexCard.css';

export const INDEX_CARD_SIZES = ['4x6', '3x5'] as const;
export type IndexCardSize = (typeof INDEX_CARD_SIZES)[number];
export const INDEX_CARD_RULINGS = ['ruled', 'blank'] as const;
export type IndexCardRuling = (typeof INDEX_CARD_RULINGS)[number];

export type IndexCardNote = {
  /** What was written in pen. */
  text: React.ReactNode;
  /** Where the note starts, as percentages of the card's width and height. */
  x: number;
  y: number;
  rotation?: number;
  /** Pen colour. Defaults to blue-black. */
  ink?: string;
  /** Handwriting size, in 720ths of the card width. */
  size?: number;
};

export const INDEX_CARD_STAMP_POSITIONS = ['top-right', 'bottom-left', 'bottom-right', 'signature'] as const;
export type IndexCardStampPosition = (typeof INDEX_CARD_STAMP_POSITIONS)[number];

export type IndexCardSignature = {
  /** The signer's name. Read by assistive technology; shown only when there is no scrawl. */
  text: string;
  /** A scrawl: SVG path data drawn in `box`. Real signatures are illegible, so this beats any font. */
  path?: string;
  /** The scrawl's own coordinate space, width then height. */
  box?: [number, number];
  /** Width of the scrawl in 720ths of the card width. */
  width?: number;
  /** For a legible hand instead: a CSS font-family. Defaults to the site's handwritten face. */
  font?: string;
  /** Size of a legible hand in 720ths of the card width. */
  size?: number;
  weight?: number;
  rotation?: number;
  ink?: string;
};

export type IndexCardAside = {
  /** A column of writing placed by the caller, e.g. under a clipped print. */
  content: React.ReactNode;
  /** Top edge and width, in 720ths of the card width; it hangs from the right margin. */
  top: number;
  width: number;
  /** Pen colour. Defaults to the card's blue-black. */
  ink?: string;
};

export type IndexCardClearance = {
  /** Which side something is clipped over the card. */
  side: 'left' | 'right';
  /** Footprint to keep the typed lines clear of, in 720ths of the card width. */
  width: number;
  height: number;
};

export type IndexCardProps = {
  /** Typed heading above the head rule. */
  title?: React.ReactNode;
  /** Typed, at the right of the heading. */
  subtitle?: React.ReactNode;
  /** Typed body, set on the ruled lines. Paragraphs keep to the rules. */
  children?: React.ReactNode;
  /** Pen annotations laid over the card. */
  notes?: IndexCardNote[];
  /** A rubber stamp. */
  stamp?: React.ReactNode;
  /** Which corner the stamp lands in. `signature` sets it beside the signature as a sign-off. */
  stampAt?: IndexCardStampPosition;
  /** Signed in the bottom-right corner. */
  signature?: IndexCardSignature;
  /** A column of writing hung from the right margin at a given height. */
  aside?: IndexCardAside;
  size?: IndexCardSize;
  ruling?: IndexCardRuling;
  /** Keeps the typed lines clear of something clipped over a corner. */
  clearance?: IndexCardClearance;
  /** Tilt of the whole card in degrees. */
  rotation?: number;
  className?: string;
  style?: React.CSSProperties;
};

const present = (node: React.ReactNode) => node != null && node !== '' && node !== false;

/**
 * A ruled index card, typed on and written over. Sized in 720ths of its width so
 * the rules, the type and the pen scale together.
 */
export function IndexCard({
  title,
  subtitle,
  children,
  notes = [],
  stamp,
  stampAt = 'top-right',
  signature,
  aside,
  size = '4x6',
  ruling = 'ruled',
  clearance,
  rotation = 0,
  className = '',
  style,
}: IndexCardProps) {
  return (
    <div
      className={`index-card ${className}`}
      data-size={size}
      data-ruling={ruling}
      style={{ '--index-card-rotation': `${rotation}deg`, ...style } as React.CSSProperties}
    >
      <Weathered className="index-card__sheet" grain>
        {present(title) || present(subtitle) ? (
          <header className="index-card__head">
            {present(title) ? <span className="index-card__title">{title}</span> : null}
            {present(subtitle) ? <span className="index-card__subtitle">{subtitle}</span> : null}
          </header>
        ) : null}
        <div className="index-card__body">
          {clearance ? (
            <span
              className="index-card__clearance"
              aria-hidden="true"
              style={{
                float: clearance.side,
                width: `calc(${clearance.width} * var(--index-card-unit))`,
                height: `calc(${clearance.height} * var(--index-card-unit))`,
              }}
            />
          ) : null}
          {children}
        </div>
        {notes.map((note, index) => (
          <span
            key={index}
            className="index-card__note"
            style={
              {
                left: `${note.x}%`,
                top: `${note.y}%`,
                '--index-card-note-rotation': `${note.rotation ?? 0}deg`,
                '--index-card-note-size': note.size ?? 34,
                ...(note.ink ? { '--index-card-pen': note.ink } : {}),
              } as React.CSSProperties
            }
          >
            {note.text}
          </span>
        ))}
        {aside ? (
          <div
            className="index-card__aside"
            style={
              {
                top: `calc(${aside.top} * var(--index-card-unit))`,
                width: `calc(${aside.width} * var(--index-card-unit))`,
                ...(aside.ink ? { '--index-card-aside-ink': aside.ink } : {}),
              } as React.CSSProperties
            }
          >
            {aside.content}
          </div>
        ) : null}
        {signature || (present(stamp) && stampAt === 'signature') ? (
          <div className="index-card__signoff">
            {present(stamp) && stampAt === 'signature' ? (
              <Distressed className="index-card__stamp index-card__stamp--signature">
                <span className="index-card__stamp-ink">{stamp}</span>
              </Distressed>
            ) : null}
            {signature?.path ? (
              <svg
                className="index-card__signature index-card__signature--scrawl"
                viewBox={`0 0 ${signature.box?.[0] ?? 320} ${signature.box?.[1] ?? 110}`}
                role="img"
                aria-label={`Signed, ${signature.text}`}
                style={
                  {
                    '--index-card-signature-width': signature.width ?? 240,
                    '--index-card-signature-rotation': `${signature.rotation ?? -2}deg`,
                    ...(signature.ink ? { '--index-card-signature-ink': signature.ink } : {}),
                  } as React.CSSProperties
                }
              >
                <path d={signature.path} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d={signature.path} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" transform="translate(0.8 0.6)" opacity="0.7" />
              </svg>
            ) : signature ? (
              <span
                className="index-card__signature"
                style={
                  {
                    '--index-card-signature-font': signature.font ?? 'var(--font-handwritten, Caveat, cursive)',
                    '--index-card-signature-size': signature.size ?? 40,
                    '--index-card-signature-weight': signature.weight ?? 400,
                    '--index-card-signature-rotation': `${signature.rotation ?? -2}deg`,
                    ...(signature.ink ? { '--index-card-signature-ink': signature.ink } : {}),
                  } as React.CSSProperties
                }
              >
                {signature.text}
              </span>
            ) : null}
          </div>
        ) : null}
        {present(stamp) && stampAt !== 'signature' ? (
          <Distressed className={`index-card__stamp index-card__stamp--${stampAt}`}>
            <span className="index-card__stamp-ink">{stamp}</span>
          </Distressed>
        ) : null}
      </Weathered>
    </div>
  );
}
