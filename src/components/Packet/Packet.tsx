import type React from 'react';
import { IndexCard, type IndexCardProps } from '../IndexCard/IndexCard';
import { Polaroid, type PolaroidProps } from '../Polaroid/Polaroid';
import { PaperClip } from './PaperClip';
import './Packet.css';

/** The packet is exactly its card; the print sits on it. */
export const PACKET_RATIO = '720 / 480';
const CARD_HEAD = 90;

export type PacketProps = {
  /** The print clipped to the card. */
  photo: Omit<PolaroidProps, 'rotation' | 'className' | 'style'>;
  /** The card underneath. Its writing wraps around the print. */
  card: Omit<IndexCardProps, 'rotation' | 'className' | 'style' | 'clearance'>;
  /** Short lines in red pen after the bio, each ticked off. */
  facts?: React.ReactNode[];
  /** Optional heading above the facts. None by default. */
  factsHeading?: React.ReactNode;
  /** The pen the facts are written in. */
  factsInk?: string;
  /** Which top corner the print is clipped over. */
  photoSide?: 'left' | 'right';
  /** Width of the print, in 720ths of the packet width. */
  photoWidth?: number;
  /** How far down the card the print's top edge sits, in 720ths of the packet width. */
  photoTop?: number;
  /** Tilt of the print against the card, in degrees. */
  photoRotation?: number;
  /** Tilt of the whole packet in degrees, for one lying loose rather than in a pile. */
  rotation?: number;
  /** Hold it all together with a gem clip. */
  clip?: boolean;
  /** Where the clip bites along the top edge, in 720ths from the packet's photo-side edge. */
  clipAt?: number;
  /** Tilt of the clip in degrees; mirrored when the print is on the left. */
  clipRotation?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * A Polaroid paper-clipped to an index card: the unit a booking agent sifts
 * through. The photo sits over one top corner of the card, and the card's
 * writing keeps clear of it.
 */
export function Packet({
  photo,
  card,
  photoSide = 'right',
  facts = [],
  factsHeading,
  factsInk = '#a52837',
  photoWidth = 210,
  photoTop = 36,
  photoRotation = 5,
  rotation = 0,
  clip = true,
  clipAt = 58,
  clipRotation = 8,
  className = '',
  style,
}: PacketProps) {
  const photoHeight = photoWidth * (photo.format === 'wide' ? 573 / 720 : 875 / 720);
  const clearance = {
    side: photoSide,
    width: photoWidth - 4,
    height: Math.max(0, photoHeight + photoTop - CARD_HEAD + 18),
  };
  const { children, ...cardProps } = card;
  const factList = facts.length ? (
    <div className="packet__facts" style={{ '--packet-facts-ink': factsInk } as React.CSSProperties}>
      {factsHeading != null && factsHeading !== '' ? <span className="packet__facts-heading">{factsHeading}</span> : null}
      <ul>
        {facts.map((fact, index) => (
          <li key={index}>{fact}</li>
        ))}
      </ul>
    </div>
  ) : null;
  return (
    <div
      className={`packet ${className}`}
      data-photo-side={photoSide}
      style={
        {
          '--packet-rotation': `${rotation}deg`,
          '--packet-photo-width': photoWidth,
          '--packet-photo-top': photoTop,
          '--packet-photo-rotation': `${photoRotation}deg`,
          '--packet-clip-at': clipAt,
          '--packet-clip-rotation': `${clipRotation}deg`,
          ...style,
        } as React.CSSProperties
      }
    >
      <div className="packet__card">
        <IndexCard {...cardProps} clearance={clearance}>
          {children}
          {factList}
        </IndexCard>
      </div>
      <div className="packet__photo" data-stack-lag="">
        <Polaroid {...photo} />
      </div>
      {clip ? (
        <>
          <PaperClip part="back" className="packet__clip packet__clip--back" />
          <PaperClip part="front" className="packet__clip" />
        </>
      ) : null}
    </div>
  );
}
