import kevinPortraitSmall from '../../../assets/epk/kevin-portrait-450.webp';
import kevinPortraitMedium from '../../../assets/epk/kevin-portrait-675.webp';
import kevinPortrait from '../../../assets/epk/kevin-portrait-900.webp';
import ryanPortraitSmall from '../../../assets/epk/ryan-portrait-450.webp';
import ryanPortraitMedium from '../../../assets/epk/ryan-portrait-675.webp';
import ryanPortrait from '../../../assets/epk/ryan-portrait-900.webp';
import samPortraitSmall from '../../../assets/epk/sam-portrait-450.webp';
import samPortraitMedium from '../../../assets/epk/sam-portrait-675.webp';
import samPortrait from '../../../assets/epk/sam-portrait-900.webp';
import type { MemberId } from '../../content/members';
import { Inkjet } from '../../foundations/Inkjet/Inkjet';
import { t } from '../../i18n/copy';
import type { PressKitInk } from './inks';
import '../styles/newsprint.css';
import './MemberColumn.css';

/** Each member's spot ink their column is ruled in, and their stage portrait at 900×600, 675×450 and 450×300. */
const MEMBER_PRINTS = {
  ryan: { ink: 'periwinkle', portrait: ryanPortrait, medium: ryanPortraitMedium, small: ryanPortraitSmall, focus: '35% 30%' },
  kevin: { ink: 'lime', portrait: kevinPortrait, medium: kevinPortraitMedium, small: kevinPortraitSmall, focus: '62% 30%' },
  sam: { ink: 'pink', portrait: samPortrait, medium: samPortraitMedium, small: samPortraitSmall, focus: '25% 40%' },
} as const satisfies Record<MemberId, { ink: PressKitInk; portrait: string; medium: string; small: string; focus: string }>;

/**
 * How wide the portrait is drawn (PressKit.css, MemberColumn.css, tokens.css): narrow, across the sheet less its
 * margins; medium, the 2fr of a 2fr/3fr row; wide, a third of a sheet at most 1240px across.
 */
const PORTRAIT_SIZES = '(max-width: 679px) calc(100vw - 32px), (max-width: 1079px) 34vw, min(365px, 28vw)';

/** One member's column: their portrait, name and part, and their bio from the catalogue. */
export function MemberColumn({ id, name }: { id: MemberId; name: string }) {
  const { ink, portrait, medium, small, focus } = MEMBER_PRINTS[id];
  return (
    <article className="epk-member epk-ribbon" data-ink={ink}>
      <Inkjet className="epk-member__print">
        <img
          className="epk-member__photo"
          src={portrait}
          srcSet={`${small} 450w, ${medium} 675w, ${portrait} 900w`}
          sizes={PORTRAIT_SIZES}
          width={900}
          height={600}
          alt={t(`band.members.${id}.photoAlt`)}
          loading="lazy"
          style={{ objectPosition: focus }}
        />
      </Inkjet>
      <h3 className="epk-member__name epk-headline">
        {name}
        <small className="epk-member__part epk-label">{t(`band.members.${id}.part`)}</small>
      </h3>
      {t(`band.members.${id}.bio`).map(paragraph => (
        <p key={paragraph} className="epk-copy">
          {paragraph}
        </p>
      ))}
    </article>
  );
}
