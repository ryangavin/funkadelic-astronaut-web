import type React from 'react';
import { Distressed } from '../../foundations/Distressed/Distressed';
import '../../styles/fonts.css';
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
  /** A rubber stamp in the top-right corner. */
  stamp?: React.ReactNode;
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
      <div className="index-card__sheet">
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
        {present(stamp) ? (
          <Distressed className="index-card__stamp">
            <span className="index-card__stamp-ink">{stamp}</span>
          </Distressed>
        ) : null}
      </div>
    </div>
  );
}
