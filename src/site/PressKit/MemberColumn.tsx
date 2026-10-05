import kevinPortrait from '../../../assets/epk/kevin-portrait-900.webp';
import ryanPortrait from '../../../assets/epk/ryan-portrait-900.webp';
import samPortrait from '../../../assets/epk/sam-portrait-900.webp';
import type { MemberId } from '../../content/members';
import { Inkjet } from '../../foundations/Inkjet/Inkjet';
import { t } from '../../i18n/copy';
import type { PressKitInk } from './inks';
import '../styles/newsprint.css';
import './MemberColumn.css';

/** Each member's spot ink their column is ruled in, and their stage portrait. */
const MEMBER_PRINTS = {
  ryan: { ink: 'periwinkle', portrait: ryanPortrait, focus: '35% 30%' },
  kevin: { ink: 'lime', portrait: kevinPortrait, focus: '62% 30%' },
  sam: { ink: 'pink', portrait: samPortrait, focus: '25% 40%' },
} as const satisfies Record<MemberId, { ink: PressKitInk; portrait: string; focus: string }>;

/** One member's column: their portrait, name and part, and their bio from the catalogue. */
export function MemberColumn({ id, name }: { id: MemberId; name: string }) {
  const { ink, portrait, focus } = MEMBER_PRINTS[id];
  return (
    <article className="epk-member epk-ribbon" data-ink={ink}>
      <Inkjet className="epk-member__print">
        <img className="epk-member__photo" src={portrait} alt={t(`band.members.${id}.photoAlt`)} loading="lazy" style={{ objectPosition: focus }} />
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
