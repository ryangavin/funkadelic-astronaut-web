import type React from 'react';
import { SOCIAL_PLATFORMS, SocialIcon } from '../../components/2D/SocialIcon/SocialIcon';
import type { BandPlatform } from '../../content/links';
import { t } from '../../i18n/copy';
import '../styles/newsprint.css';
import './IconLinks.css';

/** The printed size of a mark, in px: tokens.css's --epk-icon. */
const ICON_SIZE = 30;

type PlatformLink = { platform: BandPlatform; href: string };

/** A platform's mark printed in the night ink, taking the platform's own colour while it is pointed at or focused. */
function IconLink({ link }: { link: PlatformLink }) {
  return (
    <a
      className="epk-icon"
      href={link.href}
      target="_blank"
      rel="noreferrer"
      aria-label={t(`band.links.${link.platform}`)}
      style={{ '--epk-brand': SOCIAL_PLATFORMS[link.platform].brand } as React.CSSProperties}
    >
      <SocialIcon platform={link.platform} ink="var(--epk-icon-ink)" print="flat" paper="transparent" size={ICON_SIZE} label="" />
    </a>
  );
}

/** A row of platform marks, pulled out past its column by their tap targets so the marks themselves sit flush. */
export function IconLinks({ links, className = '' }: { links: readonly PlatformLink[]; className?: string }) {
  return (
    <div className={`epk-icons ${className}`}>
      {links.map(link => (
        <IconLink key={link.platform} link={link} />
      ))}
    </div>
  );
}
