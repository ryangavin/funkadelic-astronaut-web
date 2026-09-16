import { useId, useState } from 'react';
import performance from '../../../assets/performance.webp';
import { BAND_PACKET } from '../../sections/BandDossier/bandMembers';
import './BandIntro.css';

export type BandIntroProps = { initialOpen?: boolean };

function Bio() {
  return <div className="intro-paper__bio">{BAND_PACKET.card?.children}</div>;
}

/** Thin horizontal half-fold: the lower panel swings down from the crease. */
export function FoldedOneSheet({ initialOpen = false }: BandIntroProps) {
  const [open, setOpen] = useState(initialOpen);
  const id = useId();
  return (
    <section className="intro-experiment" aria-label="Folded one-sheet band introduction">
      <div className={`intro-onesheet intro-paper ${open ? 'is-open' : ''}`}>
        <div className="intro-onesheet__top">
          <span className="intro-paper__eyebrow">F/A · Artist introduction · New Jersey</span>
          <h2>Funkadelic<br />Astronaut</h2>
          <div className="intro-onesheet__summary"><Bio /><p className="intro-paper__hand">funk + electronics<br />since 2012</p></div>
          <span className="intro-paper__credits">KEYS / DRUMS / BASS / VOX</span>
        </div>
        <div className="intro-onesheet__reveal" id={id} inert={!open} aria-hidden={!open}>
          <div className="intro-onesheet__fold">
            <figure><img src={performance} alt="Funkadelic Astronaut performing live" /><figcaption><span>Funkadelic Astronaut / Live set</span><span>01 — Northeast</span></figcaption></figure>
            <p className="intro-paper__hand">See you out there.</p>
          </div>
        </div>
        <button type="button" className="intro-onesheet__crease" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>{open ? 'Fold one-sheet' : 'Unfold one-sheet'} <span aria-hidden="true">{open ? '↑' : '↓'}</span></button>
      </div>
    </section>
  );
}
