import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react';
import './Weathered.css';

export type WeatheredTone = 'dark' | 'light';
export const WEATHERED_TEXTURES = ['patina', 'flecks', 'grain', 'wear'] as const;
export type WeatheredTexture = (typeof WEATHERED_TEXTURES)[number];

export type WeatheredProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  /** Which element to render. The surface must be the element itself: its background is what weathers. */
  as?: ElementType;
  /** Age stains, multiplied onto the surface. `true` for the usual strength, a number for an opacity. */
  patina?: boolean | number;
  /** Fibre flecks in the stock. On a light tone they are dark and multiplied; on a dark tone, light and screened. */
  flecks?: boolean | number;
  /** Fine paper grain, soft-lit. */
  grain?: boolean | number;
  /** Print wear, like ink rubbed off the page. */
  wear?: boolean | number;
  /** Whether the surface is light stock or dark. */
  tone?: WeatheredTone;
  children?: ReactNode;
};

/**
 * A weathered surface. The textures sit at z-index -1 inside the element's own
 * stacking context: above its background, beneath everything placed on it. So a
 * weathered sheet stays worn while the cards laid on it are not, unless they are
 * weathered themselves.
 */
export function Weathered({ as: Tag = 'div', patina, flecks, grain, wear, tone = 'dark', className = '', children, ...props }: WeatheredProps) {
  const layers: [WeatheredTexture, boolean | number | undefined][] = [
    ['patina', patina],
    ['flecks', flecks],
    ['grain', grain],
    ['wear', wear],
  ];
  return (
    <Tag {...props} className={`weathered ${className}`} data-tone={tone}>
      {layers.map(([texture, strength]) =>
        strength ? (
          <span
            key={texture}
            className={`weathered__layer weathered__layer--${texture}`}
            aria-hidden="true"
            style={typeof strength === 'number' ? ({ opacity: strength } as CSSProperties) : undefined}
          />
        ) : null,
      )}
      {children}
    </Tag>
  );
}
