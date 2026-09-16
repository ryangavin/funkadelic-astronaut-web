import { useId, type ComponentProps, type CSSProperties, type HTMLAttributes } from 'react';
import type { PaperStock } from '../PaperSheet/PaperSheet';
import './Sticker.css';

export type StickerShape = {
  /** The printed artwork's outline, in artwork units. The vinyl is cut a border's width outside it. */
  path: string;
  /** The artwork's nominal canvas, in artwork units. */
  width: number;
  height: number;
};

export type StickerProps = HTMLAttributes<HTMLElement> &
  Pick<ComponentProps<'a'>, 'href' | 'target' | 'rel' | 'download' | 'hrefLang'> & {
    /** Artwork width in CSS pixels. The cut border adds to it. */
    size?: number;
    rotation?: number;
    /** Colour of the vinyl showing in the border. */
    stock?: PaperStock;
    /** Width of the border the die leaves around the artwork, in artwork units: 1.1 on a 24-unit mark is about a
        millimetre and a half on a 40 mm sticker. */
    border?: number;
    /** Clear laminate over the whole sticker, border included. */
    glossy?: boolean;
    /** A black keyline printed round the artwork, inside the white border, in artwork units. 0 leaves it off. */
    keyline?: number;
    /** Still on its release liner: a rectangle of glossy backing paper the sticker is kiss-cut on, lying loose.
        `true` for the usual margin round the sticker, or the margin in artwork units. */
    backing?: boolean | number;
    /** A corner lifting off the surface: `true` for a small curl, or its depth in artwork units. Links curl further under the pointer. */
    peel?: boolean | number;
    /** Which corner of the artwork lifts, in artwork coordinates. */
    peelTip?: { x: number; y: number };
    /** Outline of the artwork. Defaults to a rounded square. */
    shape?: StickerShape;
    /** How far the artwork extends past its nominal canvas on each side, in artwork units, for wide marks. */
    overhang?: number;
};

const ROUNDED_SQUARE: StickerShape = {
  width: 24,
  height: 24,
  path: 'M5 0H19Q24 0 24 5V19Q24 24 19 24H5Q0 24 0 19V5Q0 0 5 0Z',
};

/** The vinyl each stock is printed on. */
const VINYL: Record<PaperStock, string> = { white: '#fbf8f1', pale: '#f5e9cf', wheat: '#ead3a7', ink: '#15151d' };

const DEFAULT_PEEL = 1.2;
/** The liner's margin round the sticker, in artwork units. */
const DEFAULT_LINER = 2.4;
const LIFT = 1;

type Point = { x: number; y: number };

const fix = (value: number) => Number(value.toFixed(3));

/**
 * The geometry of a corner peeling back. The corner beyond the fold is lifted
 * and turned over, so that part of the sticker is gone from the surface and its
 * mirror image, underside up, lies inside the fold. Under the pointer the fold
 * moves further in; a fold shifted inward by δ moves the mirror image by 2δ.
 */
function peelGeometry(tip: Point, centre: Point, depth: number) {
  const dx = centre.x - tip.x;
  const dy = centre.y - tip.y;
  const length = Math.hypot(dx, dy) || 1;
  const inward = { x: dx / length, y: dy / length };
  const along = { x: -inward.y, y: inward.x };
  const fold = { x: tip.x + inward.x * depth, y: tip.y + inward.y * depth };
  const a = 2 * along.x * along.x - 1;
  const b = 2 * along.x * along.y;
  const d = 2 * along.y * along.y - 1;
  const reflect = `matrix(${fix(a)} ${fix(b)} ${fix(b)} ${fix(d)} ${fix(fold.x - a * fold.x - b * fold.y)} ${fix(fold.y - b * fold.x - d * fold.y)})`;
  return { inward, along, fold, reflect };
}

/**
 * A die-cut vinyl sticker: the artwork printed clean on white vinyl with a
 * black keyline round it, cut a millimetre or two outside that, laminated
 * clear over the whole face with one soft sheen, and stuck flat, so it casts
 * almost no shadow; or, with `backing`, still on its glossy release liner,
 * lying loose. A corner can be peeling: that corner is
 * off the surface and turned over, its underside showing inside the fold.
 * With an `href` it is a link, and the corner curls further under the pointer.
 */
export function Sticker({
  size = 72,
  rotation = 0,
  stock = 'white',
  border = 1.3,
  keyline = 0.4,
  backing = false,
  glossy = true,
  peel = true,
  peelTip = { x: 22.5, y: 22.5 },
  shape = ROUNDED_SQUARE,
  overhang = 0,
  children,
  href,
  className = '',
  style,
  ...props
}: StickerProps) {
  const id = useId().replace(/:/g, '');
  const { width, height, path } = shape;
  const unit = size / width;
  // The vinyl's box: the artwork, its overhang, the border, room for the shadow, and the liner if it is on one.
  const liner = backing === true ? DEFAULT_LINER : backing === false ? 0 : backing;
  const margin = border + 1.6 + liner;
  const box = { x: -overhang - margin, y: -margin, width: width + 2 * overhang + 2 * margin, height: height + 2 * margin };
  const sheet = { x: box.x + 0.9, y: box.y + 0.9, width: box.width - 1.8, height: box.height - 1.8 };
  const percent = ({ x, y }: Point) => `${fix(((x - box.x) / box.width) * 100)}% ${fix(((y - box.y) / box.height) * 100)}%`;

  const depth = peel === true ? DEFAULT_PEEL : peel === false ? 0 : peel;
  const centre = { x: width / 2, y: height / 2 };
  const rest = depth > 0 ? peelGeometry(peelTip, centre, depth) : null;
  const shift = depth * LIFT;
  /** Everything on the inner side of a fold placed `offset` further in than the resting one, as a clip polygon. */
  const kept = (offset: number) => {
    if (!rest) return 'none';
    const reach = 4 * Math.max(box.width, box.height);
    const at = { x: rest.fold.x + rest.inward.x * offset, y: rest.fold.y + rest.inward.y * offset };
    const corners = [
      { x: at.x - rest.along.x * reach, y: at.y - rest.along.y * reach },
      { x: at.x + rest.along.x * reach, y: at.y + rest.along.y * reach },
      { x: at.x + rest.along.x * reach + rest.inward.x * reach, y: at.y + rest.along.y * reach + rest.inward.y * reach },
      { x: at.x - rest.along.x * reach + rest.inward.x * reach, y: at.y - rest.along.y * reach + rest.inward.y * reach },
    ];
    return `polygon(${corners.map(percent).join(', ')})`;
  };

  const vars = {
    '--sticker-width': `${fix(box.width * unit)}px`,
    '--sticker-height': `${fix(box.height * unit)}px`,
    '--sticker-art-left': `${fix((overhang + margin) * unit)}px`,
    '--sticker-art-top': `${fix(margin * unit)}px`,
    '--sticker-art-size': `${size}px`,
    '--sticker-rotation': `${rotation}deg`,
    '--sticker-cut': kept(0),
    '--sticker-cut-lifted': kept(shift),
    // The flap moves with its own box, so its clip is set back by the same distance it travels.
    '--sticker-flap-cut': kept(0),
    '--sticker-flap-cut-lifted': kept(-shift),
    '--sticker-flap-shift': rest ? `${fix(rest.inward.x * 2 * shift * unit)}px ${fix(rest.inward.y * 2 * shift * unit)}px` : '0 0',
    ...style,
  } as CSSProperties;

  const viewBox = `${fix(box.x)} ${fix(box.y)} ${fix(box.width)} ${fix(box.height)}`;
  const outline = `#${id}-outline`;
  const Tag = href === undefined ? 'div' : 'a';
  const vinyl = VINYL[stock];
  // The underside shades from the fold out to the tip. It is painted inside the mirrored
  // group, so it is laid out along the corner's original, outward direction.
  const backingFrom = rest ? rest.fold : centre;
  const backingTo = rest ? { x: rest.fold.x - rest.inward.x * (depth + border), y: rest.fold.y - rest.inward.y * (depth + border) } : centre;

  return (
    <Tag {...props} href={href} className={`sticker ${className}`} data-peel={rest ? '' : undefined} data-stock={stock} style={vars}>
      {/* On its liner: a sheet of glossy backing paper lying on the desk, the sticker kiss-cut on it.
          It stays down when the corner is peeled: that is what is being peeled off. */}
      {liner > 0 && (
        <svg className="sticker__layer sticker__sheet" viewBox={viewBox} aria-hidden="true" focusable="false">
          <defs>
            <filter id={`${id}-sheet-shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.5" />
              <feOffset dx="0.4" dy="0.7" />
            </filter>
            <linearGradient id={`${id}-sheet`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fbf9f4" />
              <stop offset="0.5" stopColor="#f1ede4" />
              <stop offset="1" stopColor="#e6e1d6" />
            </linearGradient>
          </defs>
          <rect x={sheet.x} y={sheet.y} width={sheet.width} height={sheet.height} rx="0.8" fill="#121420" opacity="0.35" filter={`url(#${id}-sheet-shadow)`} />
          <rect x={sheet.x} y={sheet.y} width={sheet.width} height={sheet.height} rx="0.8" fill={`url(#${id}-sheet)`} />
          <rect x={sheet.x} y={sheet.y} width={sheet.width} height={sheet.height} rx="0.8" fill="none" stroke="#121420" strokeOpacity="0.12" strokeWidth="0.12" />
          {/* The kiss-cut, scored through the vinyl into the liner: it shows where the sticker has lifted. */}
          <use href={`#${id}-outline`} fill="none" stroke="#121420" strokeOpacity="0.14" strokeWidth={2 * border + 0.2} />
        </svg>
      )}
      {/* The vinyl on the surface: cut, printed and laminated. The lifted corner is cut away here. */}
      <span className="sticker__vinyl">
        <svg className="sticker__layer" viewBox={viewBox} aria-hidden="true" focusable="false">
          <defs>
            <path id={`${id}-outline`} d={path} strokeLinejoin="round" />
            <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.25" />
              <feOffset dy="0.2" />
            </filter>
          </defs>
          {/* Stuck flat, the whole sticker is one thin layer: the faintest shadow at its cut edge, and the
              hairline of the vinyl's own thickness, which on a liner is the kiss-cut. */}
          {liner === 0 && <use href={outline} fill="#121420" stroke="#121420" strokeWidth={2 * border} opacity="0.22" filter={`url(#${id}-shadow)`} />}
          <use href={outline} fill={vinyl} stroke={vinyl} strokeWidth={2 * border} />
          <use href={outline} fill="none" stroke="#121420" strokeOpacity={liner > 0 ? 0.22 : 0.16} strokeWidth={2 * border + 0.2} style={{ mixBlendMode: 'multiply' }} />
          <use href={outline} fill="none" stroke={vinyl} strokeWidth={2 * border - 0.06} />
          {/* The keyline: printed black round the artwork, its inner half under the print. */}
          {keyline > 0 && <use href={outline} fill="none" stroke="#121420" strokeWidth={2 * keyline} />}
        </svg>
        <span className="sticker__artwork">{children}</span>
        {glossy && (
          <svg className="sticker__layer" viewBox={viewBox} aria-hidden="true" focusable="false">
            <defs>
              <mask id={`${id}-face`} maskUnits="userSpaceOnUse" x={box.x} y={box.y} width={box.width} height={box.height}>
                <use href={outline} fill="white" stroke="white" strokeWidth={2 * border} />
              </mask>
              <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0.8" y2="1">
                <stop offset="0" stopColor="white" stopOpacity="0.42" />
                <stop offset="0.36" stopColor="white" stopOpacity="0.05" />
                <stop offset="0.42" stopColor="white" stopOpacity="0.16" />
                <stop offset="0.5" stopColor="white" stopOpacity="0" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* The laminate: one soft sheen from the upper left across vinyl and print alike. */}
            <g mask={`url(#${id}-face)`}>
              <rect x={box.x} y={box.y} width={box.width} height={box.height} fill={`url(#${id}-gloss)`} />
            </g>
          </svg>
        )}
      </span>
      {/* The lifted corner, turned over: the sticker's mirror image inside the fold, underside up. */}
      {rest && (
        <svg className="sticker__layer sticker__flap" viewBox={viewBox} aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id={`${id}-underside`} gradientUnits="userSpaceOnUse" x1={backingFrom.x} y1={backingFrom.y} x2={backingTo.x} y2={backingTo.y}>
              <stop offset="0" stopColor="#a9a59b" />
              <stop offset="0.3" stopColor="#e4e1d8" />
              <stop offset="0.72" stopColor="#ffffff" />
              <stop offset="1" stopColor="#efece5" />
            </linearGradient>
            <filter id={`${id}-lift`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="0.45" />
              <feOffset dx="0.3" dy="0.55" />
            </filter>
          </defs>
          {/* The shadow is cast outside the mirrored group, so it falls down and to the right like every other. */}
          <g filter={`url(#${id}-lift)`} opacity="0.4">
            <use href={outline} transform={rest.reflect} fill="#121420" stroke="#121420" strokeWidth={2 * border} />
          </g>
          <g transform={rest.reflect}>
            <use href={outline} fill={`url(#${id}-underside)`} stroke={`url(#${id}-underside)`} strokeWidth={2 * border} />
            <use href={outline} fill="none" stroke="#c9c5bb" strokeWidth={2 * border + 0.2} style={{ mixBlendMode: 'multiply' }} opacity="0.5" />
            <use href={outline} fill="none" stroke={`url(#${id}-underside)`} strokeWidth={2 * border} />
          </g>
        </svg>
      )}
    </Tag>
  );
}
