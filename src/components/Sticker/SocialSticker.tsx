import { SocialIcon, SOCIAL_PLATFORMS, type SocialIconProps } from '../SocialIcon/SocialIcon';
import { Sticker, type StickerProps } from './Sticker';

export type SocialStickerProps = Omit<StickerProps, 'children' | 'shape' | 'overhang' | 'peelTip'> &
  Pick<SocialIconProps, 'platform' | 'ink' | 'worn' | 'label' | 'print'>;

/** A platform's mark, printed clean on vinyl and die-cut around its own outline. `print="cutout"` gives it the poster's worn finish instead. */
export function SocialSticker({ platform, ink, worn = false, print = 'flat', label, size = 72, href, ...props }: SocialStickerProps) {
  const name = label ?? SOCIAL_PLATFORMS[platform].label;
  const defaultInk = platform === 'spotify' ? 'green' : platform === 'deezer' ? 'purple' : 'red';
  return <Sticker {...props} href={href} size={size}
    aria-label={href !== undefined ? name : props['aria-label']}
    overhang={platform === 'youtube' ? 5.04 : platform === 'bandcamp' ? 6.86 : 0}
    peelTip={platform === 'deezer' ? { x: 23.4, y: 4.8 } : platform === 'spotify' ? { x: 20.5, y: 20.5 } : platform === 'youtube' ? { x: 27.5, y: 22.5 } : { x: 22.5, y: 22.5 }}
    shape={{ width: 24, height: 24, path: SOCIAL_PLATFORMS[platform].silhouette }}>
    <SocialIcon platform={platform} ink={ink ?? defaultInk} size={size} worn={worn} print={print}
      label={href !== undefined ? '' : name} />
  </Sticker>;
}
