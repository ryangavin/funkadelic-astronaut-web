import type React from 'react';
import type { Ref } from 'react';
import festivalMap from '../../../assets/festival-map.webp';
import { Wordmark } from '../../components/2D/Wordmark/Wordmark';
import { SocialIcon } from '../../components/2D/SocialIcon/SocialIcon';
import { Handbill } from '../experiments/BandIntro/Handbill';
import { BAND_HANDBILL_BACK, BAND_HANDBILL_FRONT } from '../experiments/BandIntro/Handbill.band';
import { BOOKING_HREF, LISTEN_INKS, LISTEN_LINKS } from '../Poster/Home';
import { nextShow } from './links';
import '../../styles/fonts.css';
import './TitleScreen.css';

export type TitleScreenProps = {
  /** Go in to the desk. Left out, the title is a page on its own and says nothing about going anywhere. */
  onEnter?: () => void;
  ref?: Ref<HTMLElement>;
  className?: string;
  style?: React.CSSProperties;
};

/* The name is fluid; the strip's padding and outline stay the size the brand draws them. */
const NAME_SIZE = { '--wordmark-font-size': 'clamp(40px, min(6.4vw, 11svh), 150px)' } as React.CSSProperties;

/**
 * The band before the desk: who they are, what they sound like, and when you
 * can see them, as big as a screen can say it. The flyer is the same one that
 * lies on the promoter's desk, and going in is that flyer being put down on it.
 */
export function TitleScreen({ onEnter, ref, className = '', style }: TitleScreenProps) {
  const show = nextShow();
  return (
    <section ref={ref} className={`title-screen ${className}`} aria-label="Funkadelic Astronaut" style={{ '--title-map': `url(${festivalMap})`, ...style } as React.CSSProperties}
      onWheel={event => { if (onEnter && event.deltaY > 24) onEnter(); }}>
      <div className="title-screen__copy">
        <p className="title-screen__kicker title-screen__fade">New Jersey · est. 2012 · future rock</p>
        <h1 className="title-screen__name">
          <span className="title-screen__sr">Funkadelic Astronaut</span>
          <Wordmark aria-hidden="true" style={NAME_SIZE} rotation={-1.5} outlineWidth={3} shadowX={4} shadowY={5} paddingX={18} paddingY={6} letterSpacing=".04em">FUNKADELIC</Wordmark>
          <Wordmark aria-hidden="true" style={NAME_SIZE} rotation={1} outlineWidth={3} shadowX={4} shadowY={5} paddingX={18} paddingY={6} letterSpacing=".04em" inkColor="#639ec8">ASTRONAUT</Wordmark>
        </h1>
        <p className="title-screen__tagline title-screen__fade">Three friends. Funk meets electronics.<span> Keys, drums, bass and vox.</span></p>

        <div className="title-screen__actions title-screen__fade">
          {onEnter && <button type="button" className="title-screen__enter" onClick={onEnter} autoFocus>
            Step into the promoter’s office <span aria-hidden="true">→</span>
          </button>}
          <nav className="title-screen__listen" aria-label="Listen">
            {LISTEN_LINKS.map(({ platform, href, label }) => (
              <a key={platform} href={href} aria-label={label} target="_blank" rel="noreferrer">
                <SocialIcon platform={platform} ink={LISTEN_INKS[platform] ?? 'black'} size={30} worn={false} label="" />
              </a>
            ))}
          </nav>
        </div>

        <p className="title-screen__show title-screen__fade">
          {show ? <>
            <span className="title-screen__label">Next show</span>
            <a href={show.actionHref} target="_blank" rel="noreferrer">{show.weekday} {show.month} {Number(show.day)} · {show.venue} · {show.time}</a>
          </> : <span className="title-screen__label">New dates soon</span>}
          <a className="title-screen__book" href={BOOKING_HREF}>Book us</a>
        </p>
      </div>

      <div className="title-screen__flyer">
        <Handbill front={BAND_HANDBILL_FRONT} back={BAND_HANDBILL_BACK} stock="goldenrod" spot="purple" />
      </div>

      {onEnter && <p className="title-screen__hint title-screen__fade" aria-hidden="true">scroll to go in ↓</p>}
    </section>
  );
}
