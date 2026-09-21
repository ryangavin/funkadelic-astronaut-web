import { useLayoutEffect, useRef, useState } from 'react';
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
  const cover = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(300);
  useLayoutEffect(() => {
    const element = cover.current!;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  // Scale the entire print treatment, including vinyl geometry and paper padding.
  // Nested PaperSheet containers make inherited cqw unsuitable for these details.
  const print = { fontSize: width * .145, outlineWidth: width * .003,
    shadowX: width * .003, shadowY: width * .003, paddingX: width * .018, paddingY: width * .008 };
  return <div ref={cover} className="dossier-cover">
    <div className="dossier-cover__brand">
      <Wordmark jitter={COVER_PRINT} {...print} letterSpacing=".01em">FUNKADELIC</Wordmark>
      <Wordmark jitter={COVER_PRINT} {...print} letterSpacing=".01em" inkColor="#639ec8">ASTRONAUT</Wordmark>
    </div>
    <span className="dossier-cover__label">Band dossier · press & booking</span>
    <div className="dossier-cover__note"><StickyNote color="canary" rotation={4} size={80}><p>For the festival lineup?</p><p>Listen to the tape!! — M.C.</p></StickyNote></div>
    <div className="dossier-cover__streams">{LISTEN_LINKS.map(({ platform, href, label }, index) => <SocialSticker key={platform} platform={platform} href={href} label={label} size={width * .075} rotation={index % 2 ? 5 : -6} target="_blank" rel="noreferrer" />)}</div>
    <div className="dossier-cover__ring"><CoffeeRing strength={.35} rotation={-30} /></div>
  </div>;
}
