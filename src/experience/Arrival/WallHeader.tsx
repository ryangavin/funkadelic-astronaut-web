import type React from 'react';
import astronaut from '../../../assets/astronaut-transparent.png';
import { Wall } from '../../components/3D/Wall/Wall';
import { ARRIVAL_LINKS, nextShow, showLine } from './links';
import type { ArrivalHeaderProps } from './SiteBar';
import '../../styles/fonts.css';
import './WallHeader.css';

/*
  A big poster is not one sheet. It goes up as tiles, each pasted on its own,
  and no two land quite in register — so the banner is drawn once per tile,
  each copy clipped to its own sheet and nudged a hair off its neighbours.
*/
const COLUMNS = 4;
const ROWS = 2;
const TILES = Array.from({ length: COLUMNS * ROWS }, (_, index) => {
  const column = index % COLUMNS, row = Math.floor(index / COLUMNS);
  const wobble = (seed: number) => ((Math.sin(seed * 12.9898) * 43758.5453) % 1);
  return { column, row, dx: wobble(index + 1) * 2.4, dy: wobble(index + 7) * 2, turn: wobble(index + 3) * 0.35 };
});

function BannerArt() {
  return <div className="wall-banner__art">
    <p className="wall-banner__kicker"><span>Live</span><span>Future rock</span><span>New Jersey</span></p>
    <p className="wall-banner__name"><span>Funkadelic</span> <span>Astronaut</span></p>
    <img className="wall-banner__astronaut" src={astronaut} alt="" />
  </div>;
}

/** An older bill, pasted over and half torn off, either side of the banner. */
function OldBill({ tone, rotate, torn }: { tone: 'white' | 'pink' | 'sky'; rotate: number; torn?: boolean }) {
  return <div className="wall-bill" data-tone={tone} data-torn={torn ? '' : undefined} style={{ rotate: `${rotate}deg` } as React.CSSProperties}>
    <img src={astronaut} alt="" />
    <span>Funkadelic<br />Astronaut</span>
  </div>;
}

/**
 * The header as part of the room: the brick behind the desk, seen face on,
 * with the band wheat-pasted across it. The name is a tiled banner as wide as
 * the wall allows; the links are snipes — the strips a fly-poster crew pastes
 * over a bill to say SOLD OUT or TONIGHT — so the navigation is pasted onto
 * the same wall as the name rather than laid over the picture.
 */
export function WallHeader({ active, onLink, onHome }: ArrivalHeaderProps) {
  const show = nextShow();
  return (
    <header className="wall-header">
      <div className="wall-header__brick" aria-hidden="true">
        <Wall finish="red" width={6000} height={1500} flat weathered light={0.5} />
      </div>

      <div className="wall-header__bills" aria-hidden="true">
        <OldBill tone="white" rotate={-3} torn />
        <OldBill tone="pink" rotate={2} />
        <span className="wall-header__gap" />
        <OldBill tone="sky" rotate={-2} />
        <OldBill tone="white" rotate={3} torn />
      </div>

      <button type="button" className="wall-banner" onClick={onHome} aria-label="Funkadelic Astronaut — home">
        {TILES.map(({ column, row, dx, dy, turn }) => (
          <span key={`${column}:${row}`} className="wall-banner__tile" aria-hidden="true" style={{ '--tile-column': column, '--tile-row': row, '--tile-dx': `${dx}px`, '--tile-dy': `${dy}px`, '--tile-turn': `${turn}deg`, '--tile-columns': COLUMNS, '--tile-rows': ROWS } as React.CSSProperties}>
            <BannerArt />
          </span>
        ))}
      </button>

      <nav className="wall-header__snipes" aria-label="Main">
        {ARRIVAL_LINKS.map((link, index) => {
          const tone = link.id === 'listen' ? 'gold' : link.id === 'shows' ? 'pink' : 'white';
          const style = { rotate: `${[-2.5, 1.5, -1, 2, -1.8][index]}deg` } as React.CSSProperties;
          const label = link.id === 'shows' ? <>Next show · {showLine(show)}</> : link.id === 'listen' ? <>▶ Listen</> : link.label;
          return link.href
            ? <a key={link.id} className="snipe" data-tone={tone} style={style} href={link.id === 'shows' ? show?.actionHref ?? link.href : link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{label}</a>
            : <button key={link.id} type="button" className="snipe" data-tone={tone} style={style} aria-current={active === link.id ? 'true' : undefined} onClick={() => onLink?.(link.id)}>{label}</button>;
        })}
      </nav>
    </header>
  );
}
