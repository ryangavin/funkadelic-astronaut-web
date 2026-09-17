import type React from 'react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Solid } from '../../behaviors/Perspective/Perspective';
import { Weathered } from '../../behaviors/Weathered/Weathered';
import { Distressed } from '../../foundations/Distressed/Distressed';
import '../../styles/fonts.css';
import {
  CONTRACT_DRY_MS,
  CONTRACT_HAND_MS,
  CONTRACT_HAND_STEP,
  CONTRACT_THUMP_MS,
  SIGNATURE_BOX,
  handAt,
  impression,
  isSigned,
  pools,
  ribbon,
  type ContractPoint,
  type ContractSignature,
  type ContractStroke,
} from './ink';
import './Contract.css';

export {
  CONTRACT_DRY_MS,
  CONTRACT_HAND_MS,
  CONTRACT_HAND_STEP,
  CONTRACT_SIGNED_LENGTH,
  CONTRACT_THUMP_MS,
  NIB,
  SIGNATURE_BOX,
  isSigned,
  nibWidth,
  signatureLength,
  type ContractPoint,
  type ContractSignature,
  type ContractStroke,
} from './ink';

/** The stock it was run off on: fresh white bond, the pink second sheet of a carbon set, or the goldenrod file copy. */
export const CONTRACT_PAPERS = ['bond', 'carbon', 'goldenrod'] as const;
export type ContractPaper = (typeof CONTRACT_PAPERS)[number];

/** Whose hand countersigned it. The three of them write nothing like each other. */
export const CONTRACT_HANDS = ['ryan', 'kevin', 'sam'] as const;
export type ContractHand = (typeof CONTRACT_HANDS)[number];

/** The page, in 720ths of its width: US letter, an inch of margin all round, three inches of rule to sign on. */
export const CONTRACT_PAGE = { width: 720, height: 932, margin: 84, rule: 246 } as const;

/**
 * How tall the desk stamp is, as a multiple of the width of its own drawing:
 * 58 mm against the 78 mm the drawing is wide. A wooden hand stamp with a
 * 64 by 27 mm rubber die on a 70 by 32 mm mount, the die 4 mm of rubber on
 * 2 mm of foam, 18 mm of mount above that, then the post and the knob.
 *
 * The drawing is a plan, like everything else here, so none of that height is
 * drawn. Stand it in a `Solid` of this and the knob rises off the desk and
 * leans away from the eye, the post and the mount slide out from under it, and
 * the rubber stays where the stamp is lying. Seen from straight above it is
 * worth nothing and the drawing is exactly the footprint it always was. The
 * Contract stands its own stamp up, since the stamp belongs to the page.
 */
export const CONTRACT_STAMP_HEIGHT = 112 / 150;

/** Where the mount's top face is, as a fraction of the whole height: 24 mm of the 58. */
const CONTRACT_STAMP_MOUNT = 0.41;

/** Each hand at the size it needs to sit on the rule, in 720ths of the page width. */
const HAND_SIZE: Record<ContractHand, number> = { ryan: 34, kevin: 56, sam: 68 };

/** One filled-in line of the deal. */
export type ContractTerm = {
  /** What the form calls it: VENUE, GUARANTEE, LOAD-IN. */
  label: React.ReactNode;
  /** What was typed in against it. */
  value: React.ReactNode;
  /** Whether it takes the full width of the block, the way an address has to. */
  wide?: boolean;
  /** Whether it was written in by hand after the page came off the typewriter, as a changed time always is. */
  inHand?: boolean;
};

/** A numbered term further down the page. */
export type ContractClause = {
  /** The few words in caps that open it. */
  heading?: React.ReactNode;
  /** The rest of the sentence. */
  text: React.ReactNode;
};

/** The band's side of the foot, signed before the page was ever sent over. */
export type ContractCountersignature = {
  /** The name as it is signed. */
  name: string;
  /** Whose hand it is. */
  hand?: ContractHand;
  /** Typed under the rule: who they are to sign for the band. */
  role?: React.ReactNode;
  /** Size of the hand, in 720ths of the page width, if the default sits wrong on the rule. */
  size?: number;
};

export type ContractProps = {
  /** The name across the head of the page, printed in the band's own face. */
  artist?: string;
  /** Under the name at the right: who booked it and where to write to. One line each. */
  issuer?: React.ReactNode[];
  /** What the page calls itself, centred under the letterhead. */
  title?: string;
  /** The file number under the title, as an office gives one. */
  reference?: React.ReactNode;
  /** The paragraph that names the two parties and says what this is. */
  preamble?: React.ReactNode;
  /** The deal itself: as many filled-in lines as it takes. */
  terms?: ContractTerm[];
  /** What the heading over the deal block says. */
  termsHeading?: React.ReactNode;
  /** The numbered terms underneath, in the small print. */
  clauses?: ContractClause[];
  /** What the heading over the numbered terms says. */
  clausesHeading?: React.ReactNode;
  /** Typed under the left rule: the promoter who is being asked to sign. */
  signerName?: React.ReactNode;
  /** Typed under their name: what they are to the deal. */
  signerRole?: React.ReactNode;
  /** The band's side of the foot, already signed. */
  countersignature?: ContractCountersignature;
  /** The line of small print along the bottom edge. */
  foot?: React.ReactNode;
  /** The ink already on the line. Hand back what `onSign` gave you and the signature comes back exactly as it was written. */
  signature?: ContractSignature | null;
  /** Called every time the pen comes off the page, with everything written so far. Keep it and the page stays signed. */
  onSign?: (signature: ContractSignature) => void;
  /** Whether the stamp has already come down on it. */
  stamped?: boolean;
  /** Called when the stamp is thumped down. */
  onStamp?: () => void;
  /** The word cut into the rubber. */
  stampText?: string;
  /** The small line curved over the word: whose office the stamp belongs to. */
  stampBy?: string;
  /** The small line under the word: the date the rubber was set to. */
  stampDate?: string;
  /** The stock it was run off on. */
  paper?: ContractPaper;
  /** How it is lying on the desk, in degrees. Negative turns it counter-clockwise. */
  rotation?: number;
  /** What to call the whole thing to a screen reader. Defaults to the title and the band. */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
};

const NO_INK: ContractSignature = { strokes: [] };

const DEFAULT_TERMS: ContractTerm[] = [
  { label: 'Venue', value: 'Bluebird Hall, 214 Cookman Ave, Asbury Park NJ', wide: true },
  { label: 'Date', value: 'Saturday 12 December 2026' },
  { label: 'Capacity', value: '420 standing' },
  { label: 'Load-in', value: '4:00 pm' },
  { label: 'Soundcheck', value: '5:30 pm', inHand: true },
  { label: 'Doors', value: '7:00 pm' },
  { label: 'Set', value: '75 minutes, one set' },
  { label: 'Guarantee', value: '$1,800, cash, before the set' },
  { label: 'Door split', value: '80/20 to artist over $2,400' },
  { label: 'Support', value: 'The Wilt — 30 minutes' },
  { label: 'Billing', value: '100% headline, sole support' },
];

const DEFAULT_CLAUSES: ContractClause[] = [
  {
    heading: 'Sound and lights',
    text: 'Purchaser furnishes a working PA and lighting rig to the specification of the attached rider, and an engineer who knows it, from load-in until the house is cleared.',
  },
  {
    heading: 'Merchandise',
    text: 'Artist sells its own merchandise at the engagement and keeps all of it. Purchaser furnishes a table, a light and a chair.',
  },
  {
    heading: 'Cancellation',
    text: 'Neither party may cancel inside twenty-one days of the engagement except for illness, an act of God, or the venue burning down, in which case the guarantee is waived and nothing is owed either way.',
  },
  {
    heading: 'Recording',
    text: 'No part of the performance may be recorded, broadcast or reproduced without the written consent of the Artist, given in advance and in writing.',
  },
];

/**
 * A performance agreement, the one-page kind an agent sends over and a promoter
 * signs to book the band: US letter, 8½ by 11 inches, drawn in 720ths of its
 * width, so the page is 720 by 932 units and one unit is about a third of a
 * millimetre. A point of type is 1.18 units. The margins are an inch all round
 * (84 units). Typed body copy is 12 point (14 units) on 15½ point leading (18);
 * the labels on the deal block are 8 point caps (9½ units), letterspaced the way
 * a form letterspaces them. The two rules at the foot are a shade under three
 * inches long (246 units), which is what an inch of margin each side and a
 * finger's gap between the columns leaves to sign in, and they sit an inch and a
 * half off the bottom edge with the typed name underneath.
 *
 * Signing is the point of it. Drag along the left rule and ink comes out under
 * the pointer: the line is broad where the hand dawdled and starves fine where
 * it ran, it pools dark at the turns, and it sits wet on the stock for a
 * couple of seconds before it dries into it. Without a pointer, put focus on
 * the rule and hold Enter: the hand writes by itself, crawling the loops and
 * running away on the sweeps, and letting go lifts the nib wherever it had got
 * to. Signed, the rubber stamp beside the foot can be thumped down, and it
 * lands crooked, heavy on one edge, with a few holes where the rubber was dry.
 *
 * Content comes in through the props and the ink comes out through `onSign`:
 * hand that back as `signature` and the page is signed exactly as it was
 * written, on any screen, because the strokes are kept in the rule's own box.
 */
export function Contract({
  artist = 'Funkadelic Astronaut',
  issuer = ['Cold Moon Booking', '41 Bond St, Asbury Park NJ', 'booking@funkadelicastronaut.com'],
  title = 'Performance Agreement',
  reference = 'Agreement no. FA-2612 · one of one page · rider attached',
  preamble = 'This agreement, made this ninth day of September 2026, is between the Purchaser named below and Funkadelic Astronaut (the Artist), for the engagement described below. The Purchaser engages the Artist to perform, and the Artist agrees to perform, upon all the terms set out on this page and on the rider attached to it, which is part of this agreement.',
  terms = DEFAULT_TERMS,
  termsHeading = 'The engagement',
  clauses = DEFAULT_CLAUSES,
  clausesHeading = 'Terms',
  signerName = 'Bluebird Hall Presents',
  signerRole = 'Purchaser · for the venue',
  countersignature = { name: 'Kevin O’Neill', hand: 'kevin', role: 'For the Artist · Funkadelic Astronaut' },
  foot = 'Not valid until signed by the Purchaser · return one copy · keep the goldenrod',
  signature: given,
  onSign,
  stamped: givenStamped = false,
  onStamp,
  stampText = 'Confirmed',
  stampBy = 'Bluebird Hall Presents',
  stampDate = '9 Sept 2026',
  paper = 'bond',
  rotation = 0,
  label,
  className = '',
  style,
}: ContractProps) {
  const [signature, setSignature] = useState<ContractSignature>(given ?? NO_INK);
  const [nib, setNib] = useState<ContractStroke | null>(null);
  const [wet, setWet] = useState(false);
  const [stamped, setStamped] = useState(givenStamped);
  const [thumping, setThumping] = useState(false);
  const [fresh, setFresh] = useState(false);

  const pad = useRef<HTMLButtonElement>(null);
  const ink = useRef<SVGSVGElement>(null);
  const writing = useRef<{ id: number | 'key'; began: number; points: ContractStroke } | null>(null);
  const frame = useRef(0);
  const drying = useRef(0);
  const lifting = useRef(0);
  const latest = useRef(signature);
  const statusId = useId();
  const stamperId = `contract-stamper-${useId().replace(/:/g, '')}`;

  useEffect(() => {
    latest.current = signature;
  }, [signature]);

  // The parent owns the ink if it wants to: hand back what onSign gave and the page is signed again.
  useEffect(() => {
    setSignature(given ?? NO_INK);
  }, [given]);

  useEffect(() => {
    setStamped(givenStamped);
  }, [givenStamped]);

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      window.clearTimeout(drying.current);
      window.clearTimeout(lifting.current);
    },
    [],
  );

  const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Where a point on the screen falls in the rule's own 320 by 110 box. Taken
   * back through the ink's own matrix rather than measured off a rectangle, so
   * the nib lands under the pointer however the page is lying on the desk.
   */
  const at = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const matrix = ink.current?.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
    return { x: point.x, y: point.y };
  };

  const touch = (id: number | 'key', point: { x: number; y: number }) => {
    window.clearTimeout(drying.current);
    const first: ContractPoint = { x: point.x, y: point.y, t: 0 };
    writing.current = { id, began: performance.now(), points: [first] };
    setNib([first]);
    setWet(true);
  };

  const trail = (point: { x: number; y: number }) => {
    const pen = writing.current;
    if (!pen) return;
    const t = performance.now() - pen.began;
    const last = pen.points[pen.points.length - 1];
    // A nib that has not moved leaves nothing new: sample where there is something to sample.
    if (Math.hypot(point.x - last.x, point.y - last.y) < 0.7 && t - last.t < 45) return;
    pen.points = [...pen.points, { x: point.x, y: point.y, t }];
    setNib(pen.points);
  };

  const lift = useCallback(() => {
    const pen = writing.current;
    if (!pen) return;
    writing.current = null;
    cancelAnimationFrame(frame.current);
    setNib(null);
    const next: ContractSignature = {
      strokes: [...latest.current.strokes, pen.points],
      signedAt: new Date().toISOString(),
    };
    latest.current = next;
    setSignature(next);
    onSign?.(next);
    if (still()) {
      setWet(false);
      return;
    }
    drying.current = window.setTimeout(() => setWet(false), CONTRACT_DRY_MS);
  }, [onSign]);

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || writing.current) return;
    const point = at(event.clientX, event.clientY);
    if (!point) return;
    // Keep the pointer even if it wanders off the rule mid-name, where a hand would carry on.
    try {
      pad.current?.setPointerCapture(event.pointerId);
    } catch {
      /* Some pointers cannot be captured; the stroke still follows them while they are over the rule. */
    }
    touch(event.pointerId, point);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (writing.current?.id !== event.pointerId) return;
    const point = at(event.clientX, event.clientY);
    if (point) trail(point);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (writing.current?.id !== event.pointerId) return;
    try {
      if (pad.current?.hasPointerCapture(event.pointerId)) pad.current.releasePointerCapture(event.pointerId);
    } catch {
      /* Nothing to let go of. */
    }
    lift();
  };

  /**
   * How far the hand has got after this long, and the ink it laid down getting
   * there. It is worked out from the clock rather than from the frames, and
   * fills in whatever the frames missed: the hand was writing for as long as
   * the key was held, whether or not the page was being painted at the time.
   * Painted normally there is one frame to a sample and it comes to the same
   * thing. Returns how much of the signature is written, 0 to 1.
   */
  const handTo = (elapsed: number) => {
    const pen = writing.current;
    if (pen?.id !== 'key') return 0;
    const laid: ContractPoint[] = [];
    let t = pen.points[pen.points.length - 1].t;
    while (t + CONTRACT_HAND_STEP < elapsed) {
      t += CONTRACT_HAND_STEP;
      laid.push({ ...handAt(t / CONTRACT_HAND_MS), t });
    }
    const progress = Math.min(1, elapsed / CONTRACT_HAND_MS);
    laid.push({ ...handAt(progress), t: elapsed });
    pen.points = [...pen.points, ...laid];
    setNib(pen.points);
    return progress;
  };

  /* Held down, the hand writes for itself, at its own pace, into the same ink. */
  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return;
    // The press is the pen going down, not a click: nothing else may act on it.
    event.preventDefault();
    if (event.repeat || writing.current) return;
    touch('key', handAt(0));
    const step = () => {
      const pen = writing.current;
      if (pen?.id !== 'key') return;
      if (handTo(performance.now() - pen.began) >= 1) {
        lift();
        return;
      }
      frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  };

  const onKeyUp = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return;
    const pen = writing.current;
    if (pen?.id !== 'key') return;
    // Letting go lifts the nib where the hand had got to by the clock, not by the last frame.
    handTo(performance.now() - pen.began);
    lift();
  };

  const thump = () => {
    if (stamped) return;
    setStamped(true);
    setFresh(true);
    onStamp?.();
    if (still()) return;
    setThumping(true);
    lifting.current = window.setTimeout(() => setThumping(false), CONTRACT_THUMP_MS);
  };

  const drawn = useMemo(() => {
    const strokes = nib ? [...signature.strokes, nib] : signature.strokes;
    return strokes.map((stroke) => ({ line: ribbon(stroke), beads: pools(stroke) }));
  }, [signature, nib]);

  const signed = isSigned(signature);
  const rubber = useMemo(() => impression(stampText), [stampText]);
  const gaps = rubber.gaps
    .map((gap) => `radial-gradient(circle at ${gap.x * 100}% ${gap.y * 100}%, rgb(0 0 0 / 0) 0 ${gap.r * 44}%, #000 ${gap.r * 100}%)`)
    .join(', ');
  const hand = countersignature?.hand ?? 'kevin';

  const status = thumping
    ? 'Stamping'
    : stamped
      ? `Signed, and stamped ${stampText.toLowerCase()}`
      : nib
        ? 'Ink flowing'
        : signed
          ? 'Signed. The stamp is ready.'
          : 'Not signed yet. Sign on the purchaser’s rule.';

  return (
    <div
      className={`contract ${className}`}
      data-paper={paper}
      data-signed={signed ? '' : undefined}
      data-stamped={stamped ? '' : undefined}
      role="group"
      aria-label={label ?? `${title}: ${artist}`}
      aria-describedby={statusId}
      style={{ '--contract-rotation': `${rotation}deg`, ...style } as React.CSSProperties}
    >
      <Weathered as="article" className="contract__page" grain flecks patina={0.35}>
        <header className="contract__letterhead">
          <h2 className="contract__artist">
            <Distressed>{artist}</Distressed>
          </h2>
          <div className="contract__issuer">
            {issuer.map((line, index) => (
              <span key={index}>{line}</span>
            ))}
          </div>
        </header>

        <div className="contract__titling">
          <h3 className="contract__title">{title}</h3>
          {reference ? <p className="contract__reference">{reference}</p> : null}
        </div>

        {preamble ? <p className="contract__preamble">{preamble}</p> : null}

        <section className="contract__block">
          <h4 className="contract__heading">{termsHeading}</h4>
          <dl className="contract__terms">
            {terms.map((term, index) => (
              <div key={index} className="contract__term" data-wide={term.wide ? '' : undefined}>
                <dt>{term.label}</dt>
                <dd data-hand={term.inHand ? '' : undefined}>{term.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {clauses.length ? (
          <section className="contract__block contract__block--clauses">
            <h4 className="contract__heading">{clausesHeading}</h4>
            <ol className="contract__clauses">
              {clauses.map((clause, index) => (
                <li key={index}>
                  {clause.heading ? <b>{clause.heading}.</b> : null} {clause.text}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <footer className="contract__foot">
          <div className="contract__sign">
            <span className="contract__sign-caps">The purchaser</span>
            <div className="contract__space">
              <span className="contract__space-rule" aria-hidden="true" />
              {signed ? null : (
                <span className="contract__here" aria-hidden="true">
                  ✗
                </span>
              )}
              <button
                ref={pad}
                type="button"
                className="contract__pad"
                aria-label={
                  signed
                    ? 'Signed. Drag along the rule, or hold Enter, to write again'
                    : 'Sign here: drag along the rule, or hold Enter to let the hand write'
                }
                aria-describedby={statusId}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={onKeyDown}
                onKeyUp={onKeyUp}
                onBlur={() => {
                  if (writing.current?.id === 'key') lift();
                }}
                onClick={(event) => event.preventDefault()}
              >
                <svg
                  ref={ink}
                  className="contract__ink"
                  viewBox={`0 0 ${SIGNATURE_BOX.width} ${SIGNATURE_BOX.height}`}
                  aria-hidden="true"
                  focusable="false"
                >
                  {drawn.map((stroke, index) => (
                    <g
                      key={index}
                      className="contract__ink-stroke"
                      data-wet={wet && index === drawn.length - 1 ? '' : undefined}
                    >
                      {stroke.line ? <path className="contract__ink-feather" d={stroke.line} /> : null}
                      {stroke.line ? <path className="contract__ink-line" d={stroke.line} /> : null}
                      {stroke.beads.map((bead, bit) => (
                        <circle key={bit} className="contract__ink-pool" cx={bead.x} cy={bead.y} r={bead.r} />
                      ))}
                      {stroke.line ? <path className="contract__ink-sheen" d={stroke.line} /> : null}
                    </g>
                  ))}
                </svg>
              </button>
            </div>
            <span className="contract__sign-name">{signerName}</span>
            {signerRole ? <span className="contract__sign-role">{signerRole}</span> : null}
          </div>

          <div className="contract__sign">
            <span className="contract__sign-caps">For the artist</span>
            <div className="contract__space">
              <span className="contract__space-rule" aria-hidden="true" />
              {countersignature ? (
                <span
                  className="contract__counter"
                  style={
                    {
                      '--contract-hand': `var(--font-signature-${hand}, var(--font-handwritten, cursive))`,
                      '--contract-hand-size': countersignature.size ?? HAND_SIZE[hand],
                    } as React.CSSProperties
                  }
                >
                  {countersignature.name}
                </span>
              ) : null}
            </div>
            <span className="contract__sign-name">{countersignature?.name}</span>
            {countersignature?.role ? <span className="contract__sign-role">{countersignature.role}</span> : null}
          </div>
        </footer>

        {foot ? <p className="contract__smallprint">{foot}</p> : null}

        {stamped ? (
          <Distressed
            className={`contract__stamp${fresh && !still() ? ' contract__stamp--fresh' : ''}`}
            style={{ '--contract-stamp-angle': `${rubber.angle}deg` } as React.CSSProperties}
          >
            <span
              className="contract__stamp-face"
              style={{
                maskImage: `${gaps}, linear-gradient(${rubber.lean}deg, #000 0%, rgb(0 0 0 / 0.56) 100%)`,
                maskComposite: 'intersect',
              }}
            >
              <svg viewBox="0 0 300 130" role="img" aria-label={`Stamped ${stampText}`}>
                {/* Never a clean rectangle: the rubber is cut a little out of true and the rule breaks at the right. */}
                <path
                  className="contract__stamp-rule"
                  d="M 10 13 L 289 8 L 293 118 L 14 123 Z"
                />
                <path className="contract__stamp-rule contract__stamp-rule--inner" d="M 20 21 L 200 18" />
                <path className="contract__stamp-rule contract__stamp-rule--inner" d="M 232 17 L 283 16 L 286 110 L 24 115 L 21 30" />
                {/* Set to the width of the rubber, whatever the words are: a stamp is cut to fit its own block. */}
                <text className="contract__stamp-over" x="150" y="41" textAnchor="middle" textLength="216" lengthAdjust="spacingAndGlyphs">
                  {stampBy}
                </text>
                <text className="contract__stamp-word" x="150" y="86" textAnchor="middle" textLength="226" lengthAdjust="spacingAndGlyphs">
                  {stampText}
                </text>
                <text className="contract__stamp-under" x="150" y="108" textAnchor="middle" textLength="120" lengthAdjust="spacingAndGlyphs">
                  {stampDate}
                </text>
              </svg>
            </span>
          </Distressed>
        ) : null}
      </Weathered>

      {/* It is 58 mm tall, so on a desk seen at an angle it stands up: the knob goes
          where its height puts it, the post and the mount slide out from under it, and
          the rubber stays where the stamp is lying. On a flat page all of that is nothing. */}
      <Solid
        className="contract__stamper-solid"
        height={CONTRACT_STAMP_HEIGHT}
        style={{ '--contract-stamp-mount': CONTRACT_STAMP_MOUNT } as React.CSSProperties}
      >
        <button
          type="button"
          className="contract__stamper"
          data-thumping={thumping ? '' : undefined}
          aria-label={stamped ? `Stamped ${stampText.toLowerCase()}` : `Stamp it ${stampText.toLowerCase()}`}
          aria-describedby={statusId}
          disabled={!signed || stamped}
          onClick={thump}
        >
          <svg viewBox="0 0 150 110" aria-hidden="true" focusable="false">
            {/* Straight down, which is how everything here is drawn. A stamp from
                overhead is its footprint: the mount's rounded rectangle and the knob
                over it, concentric. Whatever the lathe did to the knob's profile is
                edge-on from here and cannot be seen at all. */}
            <defs>
              <radialGradient id={`${stamperId}-knob`} cx="0.36" cy="0.3" r="0.8">
                <stop offset="0" stopColor="#fff" stopOpacity="0.52" />
                <stop offset="0.45" stopColor="#fff" stopOpacity="0.06" />
                <stop offset="1" stopColor="#000" stopOpacity="0.3" />
              </radialGradient>
              {/* A turned column under the window: bright a third of the way across, dark
                  round both edges. In user space, so the mount's side and the post's are
                  lit as one piece of wood. */}
              <linearGradient id={`${stamperId}-side`} gradientUnits="userSpaceOnUse" x1="7" y1="0" x2="143" y2="0">
                <stop offset="0" stopColor="#000" stopOpacity="0.46" />
                <stop offset="0.16" stopColor="#000" stopOpacity="0.08" />
                <stop offset="0.32" stopColor="#fff" stopOpacity="0.24" />
                <stop offset="0.52" stopColor="#fff" stopOpacity="0.06" />
                <stop offset="0.74" stopColor="#000" stopOpacity="0.16" />
                <stop offset="1" stopColor="#000" stopOpacity="0.52" />
              </linearGradient>
              <filter id={`${stamperId}-cast`} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="6" />
              </filter>
              <clipPath id={`${stamperId}-mount-clip`}>
                <rect x="7" y="24" width="136" height="62" rx="4" />
              </clipPath>
              <clipPath id={`${stamperId}-knob-clip`}>
                <circle cx="75" cy="55" r="40" />
              </clipPath>
            </defs>

            {/* The shadow it throws down and to the right, the shape of the thing itself. */}
            <rect
              className="contract__stamper-cast"
              x="7"
              y="24"
              width="136"
              height="62"
              rx="4"
              filter={`url(#${stamperId}-cast)`}
              transform="translate(9 12)"
            />

            {/* The rubber die, the only part of it touching the desk, so it never moves. */}
            <rect className="contract__stamper-die" x="13" y="29" width="124" height="52" rx="3" />

            {/* The mount's side: nothing at all from above, sheared out from under its own
                top face as the view comes down. Its foot is where the stamp is lying. */}
            <g className="contract__stamper-riser">
              <rect className="contract__stamper-wood" x="7" y="54.5" width="136" height="1" />
              <rect x="7" y="54.5" width="136" height="1" fill={`url(#${stamperId}-side)`} />
            </g>

            {/* The mount's top face, with the post standing on it and leaning up to the knob. */}
            <g className="contract__stamper-mount">
              <rect className="contract__stamper-face" x="7" y="24" width="136" height="62" rx="4" />
              {/* Sawn from a board, so the grain runs the length of the block, with a
                  cathedral where the saw cut across the rings. */}
              <g className="contract__stamper-grain" clipPath={`url(#${stamperId}-mount-clip)`}>
                <path d="M 5 31 C 46 28, 96 34, 145 30" />
                <path d="M 5 39 C 40 43, 102 36, 145 40" />
                <path d="M 5 47 C 52 44, 92 50, 145 46" />
                <path d="M 5 63 C 46 67, 96 58, 145 62" />
                <path d="M 5 71 C 40 68, 102 74, 145 70" />
                <path d="M 5 79 C 52 82, 92 76, 145 78" />
                <path d="M 34 88 C 48 66, 58 44, 68 22" />
                <path d="M 46 88 C 60 68, 70 48, 78 22" />
              </g>
              <rect x="7" y="24" width="136" height="62" rx="4" fill={`url(#${stamperId}-side)`} opacity="0.35" />
              <g className="contract__stamper-stem">
                <rect className="contract__stamper-wood" x="60" y="54.5" width="30" height="1" />
                <rect x="60" y="54.5" width="30" height="1" fill={`url(#${stamperId}-side)`} />
              </g>
            </g>

            {/* The knob: discs, up where the stamp's height puts them. */}
            <g className="contract__stamper-knob">
              <circle className="contract__stamper-knob-face" cx="75" cy="55" r="40" />
              {/* Turned from a dowel, so what is up is the end of it: annual rings,
                  and the tree was no more centred on the lathe than any tree is. */}
              <g className="contract__stamper-rings" clipPath={`url(#${stamperId}-knob-clip)`}>
                <circle cx="72" cy="52" r="7" />
                <circle cx="72.5" cy="52" r="12.5" />
                <circle cx="72" cy="51.5" r="17" />
                <circle cx="71.5" cy="52.5" r="23" />
                <circle cx="72" cy="52" r="29" />
                <circle cx="72.5" cy="51.5" r="34.5" />
                <circle cx="72" cy="52" r="39" />
              </g>
              <circle cx="75" cy="55" r="40" fill={`url(#${stamperId}-knob)`} />
              <circle className="contract__stamper-turn" cx="75" cy="55" r="27" />
              <circle className="contract__stamper-dimple" cx="75" cy="55" r="8" />
            </g>
          </svg>
        </button>
      </Solid>

      <span id={statusId} className="contract__status" role="status" aria-live="polite">
        {status}
      </span>
    </div>
  );
}
