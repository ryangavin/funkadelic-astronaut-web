import { Wordmark } from '../../components/2D/Wordmark/Wordmark';
import { StickyNote } from '../../components/2D/StickyNote/StickyNote';
import { SocialSticker } from '../../components/2D/Sticker/SocialSticker';
import { CoffeeRing } from '../../components/3D/Mug/CoffeeRing';
import { LISTEN_LINKS } from '../Home/Home';
import './DossierCover.css';

/*
  The print misregistration is asked for on hover rather than left running. On
  its own page a wordmark can jitter away; here it lies on a desk, inside the
  plane's perspective and under the lamp's filters, and a cover that never stops
  twitching keeps every glyph's subtree dirty and repaints that stack around the
  clock — the cost is paid whether or not anyone is looking at the folder. Taking
  it under the pointer keeps the effect where it reads, which is close up.
*/
const COVER_PRINT = { activation: 'hover-focus' } as const;

/** The decorated press-kit cover from the promoter's desk, scaled to its folder. */
export function DossierCover() {
  return <div className="dossier-cover">
    <div className="dossier-cover__brand">
      <Wordmark jitter={COVER_PRINT} fontSize={44} letterSpacing=".02em" outlineWidth={1.5} shadowX={2} shadowY={2} paddingX={8} paddingY={4}>FUNKADELIC</Wordmark>
      <Wordmark jitter={COVER_PRINT} fontSize={44} letterSpacing=".02em" outlineWidth={1.5} shadowX={2} shadowY={2} paddingX={8} paddingY={4} inkColor="#639ec8">ASTRONAUT</Wordmark>
    </div>
    <span className="dossier-cover__label">Press kit · fall 2026</span>
    <div className="dossier-cover__note"><StickyNote color="canary" rotation={4} size={80}><p>Sept 26 — the 6pm slot?</p><p>Listen to the tape!! — M.C.</p></StickyNote></div>
    <div className="dossier-cover__streams">{LISTEN_LINKS.map(({ platform, href, label }, index) => <SocialSticker key={platform} platform={platform} href={href} label={label} size={32} rotation={index % 2 ? 5 : -6} target="_blank" rel="noreferrer" />)}</div>
    <div className="dossier-cover__ring"><CoffeeRing strength={.35} rotation={-30} /></div>
  </div>;
}
