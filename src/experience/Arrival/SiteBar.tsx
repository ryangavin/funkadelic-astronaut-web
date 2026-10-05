import type React from 'react';
import { useState } from 'react';
import { Wordmark } from '../../components/2D/Wordmark/Wordmark';
import { ARRIVAL_LINKS, nextShow, showLine, type ArrivalLinkId } from './links';
import '../../styles/fonts.css';
import './SiteBar.css';

export type ArrivalHeaderProps = {
  /** Which link's thing is picked up on the desk just now. */
  active?: ArrivalLinkId;
  /** A link that stays on the desk was pressed. Links that leave the site are ordinary links. */
  onLink?: (id: ArrivalLinkId) => void;
  /** The name was pressed: back to the title, when there is one. */
  onHome?: () => void;
};

/**
 * The site's own chrome, kept apart from the room: a strip of ink floating over
 * the scene, with the name stuck on it as a printed label. It is plainly a
 * website's header, and that is the point — anyone who only came for the dates
 * finds them in one click without reading the desk.
 */
export function SiteBar({ active, onLink, onHome }: ArrivalHeaderProps) {
  const [open, setOpen] = useState(false);
  const show = nextShow();
  return (
    <header className="site-bar" data-open={open ? '' : undefined}>
      <button type="button" className="site-bar__name" onClick={onHome} aria-label="Funkadelic Astronaut — home">
        <Wordmark style={{ '--wordmark-font-size': 'clamp(15px, 4.2vw, 26px)' } as React.CSSProperties} outlineWidth={1.5} shadowX={2} shadowY={2} paddingX={10} paddingY={3} rotation={-1.5}>
          <span>FUNKADELIC</span> <span className="site-bar__astro">ASTRONAUT</span>
        </Wordmark>
      </button>
      <button type="button" className="site-bar__menu" aria-expanded={open} aria-controls="site-bar-links" onClick={() => setOpen(!open)}>
        {open ? 'Close' : 'Menu'}
      </button>
      <nav id="site-bar-links" className="site-bar__nav" aria-label="Main">
        {ARRIVAL_LINKS.map(link => link.href
          ? <a key={link.id} className="site-bar__link" href={link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{link.label}</a>
          : <button key={link.id} type="button" className="site-bar__link" data-primary={link.id === 'listen' ? '' : undefined} aria-current={active === link.id ? 'true' : undefined} onClick={() => { setOpen(false); onLink?.(link.id); }}>
            {link.id === 'listen' && <span aria-hidden="true">▶ </span>}{link.label}
          </button>)}
      </nav>
      <a className="site-bar__next" href={show?.actionHref} target="_blank" rel="noreferrer">
        <span>Next</span> {showLine(show)}
      </a>
    </header>
  );
}
