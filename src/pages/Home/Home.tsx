import type React from 'react';
import festivalMap from '../../../assets/festival-map.webp';
import { AdmissionTicket, TOUR_ADMISSION_TICKET_PROPS } from '../../components/AdmissionTicket/AdmissionTicket';
import { Astronaut } from '../../components/Astronaut/Astronaut';
import { PaperSheet } from '../../components/PaperSheet/PaperSheet';
import { PaperStrip } from '../../components/PaperStrip/PaperStrip';
import { Pin } from '../../components/Pin/Pin';
import { Ribbon } from '../../components/Ribbon/Ribbon';
import { SocialIcon, type SocialPlatform } from '../../components/SocialIcon/SocialIcon';
import { STAGE_WIDTH, Stage, type StageProps } from '../../components/Stage/Stage';
import { OLIVES_TOUR_PASS_PROPS, TourPass, type TourPassColor, type TourPassProps } from '../../components/TourPass/TourPass';
import { Wordmark } from '../../components/Wordmark/Wordmark';
import { BandDossier } from '../../sections/BandDossier/BandDossier';
import '../../styles/fonts.css';
import './Home.css';

/** The poster's design size: 1440 across and 11 x 17 in proportion, so 2225 high. */
export const HOME_WIDTH = STAGE_WIDTH;
export const HOME_RATIO = 17 / 11;
export const HOME_HEIGHT = Math.round(HOME_WIDTH * HOME_RATIO);

/** The footer ribbon's block, from the seam to the poster's bottom edge. */
export const HOME_FOOTER_HEIGHT = 150;

export type HomeLink = { platform: SocialPlatform; href: string; label: string };

export const LISTEN_LINKS: HomeLink[] = [
  { platform: 'applemusic', href: 'https://music.apple.com/us/artist/funkadelic-astronaut/1208229110', label: 'Funkadelic Astronaut on Apple Music' },
  { platform: 'spotify', href: 'https://open.spotify.com/artist/5qpVp5gTB9QXi38qTyJ6oe', label: 'Funkadelic Astronaut on Spotify' },
  { platform: 'youtube', href: 'https://www.youtube.com/funkadelicastronaut', label: 'Funkadelic Astronaut on YouTube' },
  { platform: 'deezer', href: 'https://www.deezer.com/artist/11985446', label: 'Funkadelic Astronaut on Deezer' },
];

export const SOCIAL_LINKS: HomeLink[] = [
  { platform: 'instagram', href: 'https://www.instagram.com/funkadelicastronaut/', label: 'Funkadelic Astronaut on Instagram' },
  { platform: 'facebook', href: 'https://www.facebook.com/funkadelicastronaut', label: 'Funkadelic Astronaut on Facebook' },
  { platform: 'bandsintown', href: 'https://www.bandsintown.com/a/1180868', label: 'Funkadelic Astronaut on Bandsintown' },
];

export const BANDCAMP_LINK: HomeLink = { platform: 'bandcamp', href: 'https://funkadelicastronaut.bandcamp.com/', label: 'Funkadelic Astronaut on Bandcamp' };

/** The platform inks the hero prints the streaming marks in. */
export const LISTEN_INKS: Partial<Record<SocialPlatform, string>> = { applemusic: 'red', spotify: 'green', youtube: 'red', deezer: 'purple' };

export const BOOKING_HREF = 'mailto:samluba1@gmail.com?subject=Funkadelic%20Astronaut%20Booking';

/** The upcoming dates as on the site's tour section: one pass each, in its own ink. */
export const TOUR_DATES: (TourPassProps & { color: TourPassColor })[] = [
  { ...OLIVES_TOUR_PASS_PROPS, color: 'red' },
  {
    dateTime: '2026-09-26',
    weekday: 'Sat',
    month: 'Sep',
    day: '26',
    tierLabel: 'GA pass',
    venue: 'Nyack Neighborhood Music & Arts Festival',
    city: 'Nyack, New York',
    location: '5 First Avenue',
    time: '6:00 PM',
    venueImageSrc: '/assets/performance.webp',
    actionLabel: 'Event details',
    actionHref: 'https://www.bandsintown.com/a/1180868',
    actionAriaLabel: 'Event details for the Nyack Neighborhood Music & Arts Festival',
    color: 'blue',
  },
  {
    dateTime: '2026-10-03',
    weekday: 'Sat',
    month: 'Oct',
    day: '03',
    tierLabel: 'VIP pass',
    venue: 'Saturn Lanes',
    city: 'Hackensack, New Jersey',
    location: 'A bowling-alley gig from the design universe',
    time: 'Doors 8:30 PM · set 9:30 PM',
    venueImageSrc: '/assets/performance.webp',
    actionLabel: 'Mock ticket',
    actionAriaLabel: 'Mock ticket, a fictional preview',
    color: 'purple',
  },
];

/**
 * Where everything is pinned, in design pixels from the poster's top left, with
 * each piece's tilt and size. Pieces that draw themselves to a width (the
 * astronaut, the dossier, the ticket, the passes) take a `Width`; the paper
 * strips take a `Scale`. Every value is also a prop, so the composition can be
 * nudged from the story's controls.
 */
export const HOME_LAYOUT = {
  pressKitX: 60,
  pressKitY: 22,
  pressKitRotation: -1,
  pressKitScale: 1,
  bandX: 572,
  bandY: 38,
  bandRotation: -1.5,
  bandScale: 1,
  tourX: 748,
  tourY: 40,
  tourRotation: 1,
  tourScale: 1,
  bookingX: 1040,
  bookingY: 22,
  bookingRotation: 1,
  bookingScale: 1,
  funkX: 135,
  funkY: 126,
  funkRotation: -1,
  funkScale: 1,
  astroX: 194,
  astroY: 276,
  astroRotation: 0.5,
  astroScale: 1,
  astronautX: 1112,
  astronautY: 200,
  astronautRotation: 2,
  astronautWidth: 330,
  listenX: 92,
  listenY: 420,
  listenRotation: -1.5,
  listenScale: 1,
  dossierX: 120,
  dossierY: 530,
  dossierRotation: 1.5,
  dossierWidth: 1000,
  ticketX: 420,
  ticketY: 1170,
  ticketRotation: -2,
  ticketWidth: 600,
  olivesX: 70,
  olivesY: 1380,
  olivesRotation: -2.15,
  olivesWidth: 400,
  nyackX: 520,
  nyackY: 1360,
  nyackRotation: 1.5,
  nyackWidth: 400,
  saturnX: 970,
  saturnY: 1385,
  saturnRotation: -1,
  saturnWidth: 400,
};
export type HomeLayout = typeof HOME_LAYOUT;

export type HomeProps = Partial<HomeLayout> &
  Pick<StageProps, 'minScale' | 'maxScale'> & {
    /** How strongly the map prints, 0 to 1. */
    mapOpacity?: number;
    className?: string;
    style?: React.CSSProperties;
  };

const stamps = (links: HomeLink[], size: number, ink: string) =>
  links.map(({ platform, href, label }) => (
    <a key={platform} className="home__stamp" href={href} aria-label={label} style={{ width: size + 16, height: size + 16 }}>
      <SocialIcon platform={platform} ink={ink} size={size} worn={false} label="" />
    </a>
  ));

const navStrip = (text: string, fontSize: number, ink: string) => (
  <Wordmark fontSize={fontSize} inkColor={ink} letterSpacing={fontSize > 60 ? '-0.015em' : undefined} paddingX={fontSize > 60 ? 16 : 14} paddingY={fontSize > 60 ? 8 : 6} jitter>
    {text}
  </Wordmark>
);

/**
 * The home page as one poster: an 11 x 17 sheet, 1440 by 2225 design pixels,
 * with the festival map printed edge to edge, scaled as a whole by the Stage
 * so nothing reflows. The wordmark, the astronaut, the streaming strip, the
 * band's press package, the tour ticket and its passes are pinned where they
 * go on it, and the footer ribbon closes the bottom edge; there are no seams
 * between sections.
 */
export function Home({ mapOpacity = 1, minScale, maxScale, className = '', style, ...pins }: HomeProps) {
  // A control left unset falls back to the layout's own value.
  const at: HomeLayout = { ...HOME_LAYOUT, ...Object.fromEntries(Object.entries(pins).filter(([, value]) => value !== undefined)) };
  // Pieces without a width of their own are scaled with zoom, so their pixels scale like everything else.
  const scaled = (scale: number) => ({ className: 'home__scaled', style: { zoom: scale } as React.CSSProperties });
  const passes = [
    { key: 'olives', x: at.olivesX, y: at.olivesY, rotation: at.olivesRotation, width: at.olivesWidth },
    { key: 'nyack', x: at.nyackX, y: at.nyackY, rotation: at.nyackRotation, width: at.nyackWidth },
    { key: 'saturn', x: at.saturnX, y: at.saturnY, rotation: at.saturnRotation, width: at.saturnWidth },
  ];

  return (
    <Stage className={`home ${className}`} style={style} height={HOME_HEIGHT} minScale={minScale} maxScale={maxScale}>
      <PaperSheet height={HOME_HEIGHT} surround={0} imageSrc={festivalMap} imageSize="cover" imagePosition="center" imageOpacity={mapOpacity} imageContrast={1.05}>
        <header className="home__hero">
          {/* The original's top row: press kit and booking as the big utility strips at the
              corners, the band and tour anchors between them, all in Modak on paper. */}
          <nav className="home__nav" aria-label="Main navigation">
            <Pin x={at.pressKitX} y={at.pressKitY} rotation={at.pressKitRotation}>
              <a href="press-kit.html" aria-label="Press kit" {...scaled(at.pressKitScale)}>
                {navStrip('PRESS KIT', 72, '#9275b2')}
              </a>
            </Pin>
            <Pin x={at.bandX} y={at.bandY} rotation={at.bandRotation}>
              <a href="#band" {...scaled(at.bandScale)}>
                {navStrip('BAND', 46, '#228542')}
              </a>
            </Pin>
            <Pin x={at.tourX} y={at.tourY} rotation={at.tourRotation}>
              <a href="#tour" {...scaled(at.tourScale)}>
                {navStrip('TOUR', 46, '#228542')}
              </a>
            </Pin>
            <Pin x={at.bookingX} y={at.bookingY} rotation={at.bookingRotation}>
              <a href={BOOKING_HREF} aria-label="Booking" {...scaled(at.bookingScale)}>
                {navStrip('BOOKING', 72, '#c58930')}
              </a>
            </Pin>
          </nav>

          {/* The wordmark as on the site: FUNKADELIC in purple over ASTRONAUT in blue, each on its own strip. */}
          <h1 className="home__title">
            <span className="home__sr">Funkadelic Astronaut</span>
            <Pin x={at.funkX} y={at.funkY} rotation={at.funkRotation}>
              <div {...scaled(at.funkScale)}>
                <Wordmark fontSize={128} letterSpacing="0.06em" outlineWidth={3} shadowX={4} shadowY={5} jitter>
                  FUNKADELIC
                </Wordmark>
              </div>
            </Pin>
            <Pin x={at.astroX} y={at.astroY} rotation={at.astroRotation}>
              <div {...scaled(at.astroScale)}>
                <Wordmark fontSize={112} letterSpacing="0.06em" outlineWidth={3} shadowX={4} shadowY={5} inkColor="#639ec8" jitter>
                  ASTRONAUT
                </Wordmark>
              </div>
            </Pin>
          </h1>

          {/* The astronaut hangs off the right, its helmet level with the second word, the way the hero crops it. */}
          <Pin x={at.astronautX} y={at.astronautY} width={at.astronautWidth} rotation={at.astronautRotation}>
            <Astronaut />
          </Pin>

          {/* The streaming marks in their platform inks, on a scrap of paper bottom left of the hero. */}
          <nav className="home__listen" aria-label="Listen on streaming services">
            <Pin x={at.listenX} y={at.listenY} rotation={at.listenRotation}>
              <div {...scaled(at.listenScale)}>
                <PaperStrip paddingX={22} paddingY={12}>
                  <div className="home__stamps home__stamps--hero">
                    {LISTEN_LINKS.map(({ platform, href, label }) => (
                      <a key={platform} className="home__stamp" href={href} aria-label={label}>
                        <SocialIcon platform={platform} ink={LISTEN_INKS[platform] ?? 'black'} size={54} label="" />
                      </a>
                    ))}
                  </div>
                </PaperStrip>
              </div>
            </Pin>
          </nav>
        </header>

        <main>
          <Pin x={at.dossierX} y={at.dossierY} width={at.dossierWidth}>
            <section id="band" className="home__band">
              <BandDossier rotation={at.dossierRotation} />
            </section>
          </Pin>

          {/* The tour as on the site: the season's admission ticket over a row of passes, one per date. */}
          <section id="tour" className="home__tour" aria-label="Tour">
            <Pin x={at.ticketX} y={at.ticketY} width={at.ticketWidth} rotation={at.ticketRotation}>
              <AdmissionTicket {...TOUR_ADMISSION_TICKET_PROPS} rotation={0} />
            </Pin>
            {TOUR_DATES.map(({ color, ...pass }, index) => (
              <Pin key={passes[index].key} x={passes[index].x} y={passes[index].y} width={passes[index].width} rotation={passes[index].rotation}>
                <TourPass {...pass} color={color} rotation={0} />
              </Pin>
            ))}
          </section>
        </main>

        <Pin x={0} y={HOME_HEIGHT - HOME_FOOTER_HEIGHT} width={HOME_WIDTH}>
          <footer className="home__footer" aria-label="Funkadelic Astronaut links">
            <Ribbon>
              <div className="home__links">
                <a className="home__credit" href="https://github.com/ryangavin/funkadelic-astronaut-web">
                  <SocialIcon platform="github" ink="#ead3a7" size={22} worn={false} label="" />
                  <span>See how this site was made</span>
                </a>
                <nav aria-label="Socials" className="home__stamps">
                  {stamps(SOCIAL_LINKS, 25, '#ead3a7')}
                </nav>
                <nav aria-label="Music" className="home__stamps home__stamps--end">
                  {stamps([...LISTEN_LINKS, BANDCAMP_LINK], 25, '#ead3a7')}
                </nav>
              </div>
            </Ribbon>
          </footer>
        </Pin>
      </PaperSheet>
    </Stage>
  );
}
