import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import astronaut from '../../../assets/astronaut-transparent.png';
import performance from '../../../assets/performance.webp';
import { BAND_PACKET } from '../../sections/BandDossier/bandMembers';
import './BandHandbill.css';

export type BandHandbillProps = {
  initialBack?: boolean;
  /** Also respects the device’s reduced-motion preference. */
  reducedMotion?: boolean;
  /** Slow the same physical turn down for inspection in Storybook. */
  duration?: number;
};

/** An isolated, two-sided miniature band poster. Input is locked during each turn. */
export function BandHandbill({ initialBack = false, duration = 1100, reducedMotion = false }: BandHandbillProps) {
  const [back, setBack] = useState(initialBack);
  const [turning, setTurning] = useState(false);
  const busy = useRef(false);
  const fallback = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const statusId = useId();
  const turnDuration = Math.max(300, duration);
  const finish = () => {
    clearTimeout(fallback.current);
    busy.current = false;
    setTurning(false);
  };
  useEffect(() => () => clearTimeout(fallback.current), []);
  const flip = () => {
    if (busy.current) return;
    setBack(value => !value);
    if (reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    busy.current = true;
    setTurning(true);
    // Also release the control if the browser cancels or suspends the animation.
    fallback.current = setTimeout(finish, turnDuration + 250);
  };

  return (
    <section className="band-handbill" aria-label="Double-sided band handbill" data-back={back} data-turning={turning} style={{ '--handbill-duration': `${turnDuration}ms` } as CSSProperties}>
      <div className="band-handbill__stage">
        <div className="band-handbill__shadow" aria-hidden="true" />
        <div className="band-handbill__card" onAnimationEnd={event => { if (event.target === event.currentTarget) finish(); }}>
          <div className="band-handbill__face band-handbill__front" aria-hidden={back} inert={back}>
            <span className="band-handbill__kicker">NEW JERSEY / EST. 2012</span>
            <h2>Funkadelic<br /><span>Astronaut</span></h2>
            <div className="band-handbill__portal" aria-hidden="true"><i /><img src={astronaut} alt="" /><span>✦</span></div>
            <div className="band-handbill__front-foot"><strong>FUTURE ROCK</strong><span>FUNK / ELECTRONICS / THREE FRIENDS</span></div>
            <span className="band-handbill__corner" aria-hidden="true">↗</span>
          </div>
          <div className="band-handbill__face band-handbill__back" aria-hidden={!back} inert={!back}>
            <span className="band-handbill__kicker">FLIP SIDE / THE BAND</span>
            <h2>Three friends.<br /><span>One orbit.</span></h2>
            <div className="band-handbill__bio">{BAND_PACKET.card?.children}</div>
            <figure><img src={performance} alt="Funkadelic Astronaut performing live" /><figcaption>FUNKADELIC ASTRONAUT / LIVE SET</figcaption></figure>
            <span className="band-handbill__credits">KEYS / DRUMS / BASS / VOX</span>
          </div>
        </div>
        <button className="band-handbill__hit" type="button" aria-label={back ? 'Flip handbill to poster' : 'Flip handbill to band bio'} aria-describedby={statusId} aria-disabled={turning} onClick={flip} />
      </div>
      <p className="band-handbill__hint" id={statusId} role="status" aria-live="polite">{turning ? 'Turning the handbill…' : back ? 'Band bio · tap to turn back ↶' : 'Mini poster · tap to flip ↗'}</p>
    </section>
  );
}
