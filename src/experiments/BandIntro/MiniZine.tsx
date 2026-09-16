import { useId, useRef, useState } from 'react';
import performance from '../../../assets/performance.webp';
import astronaut from '../../../assets/astronaut-transparent.png';
import { BAND_PACKET } from '../../sections/BandDossier/bandMembers';
import './BandIntro.css';

export type BandIntroProps = { initialOpen?: boolean };

function Bio() {
  return <div className="intro-paper__bio">{BAND_PACKET.card?.children}</div>;
}

/** A small two-page photocopied booklet. Deliberately isolated from the dossier. */
export function MiniZine({ initialOpen = false }: BandIntroProps) {
  const [open, setOpen] = useState(initialOpen);
  const id = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  return (
    <section className="intro-experiment" aria-label="Mini zine band introduction">
      <div className={`intro-zine ${open ? 'is-open' : ''}`}>
        <div className="intro-zine__spread intro-paper" id={id} inert={!open} aria-hidden={!open}>
          <div className="intro-zine__page intro-zine__photo-page">
            <span className="intro-paper__eyebrow">A little noise from New Jersey</span>
            <img className="intro-zine__photo" src={performance} alt="Funkadelic Astronaut performing live" />
            <span className="intro-paper__hand">Three friends. One orbit.</span>
            <span className="intro-paper__folio">01 / LIVE TRANSMISSION</span>
          </div>
          <div className="intro-zine__page intro-zine__bio-page">
            <span className="intro-paper__eyebrow">The band / est. 2012</span>
            <h2>Funk, meet<br />the future.</h2>
            <Bio />
            <p className="intro-paper__credits">KEYS / DRUMS / BASS / VOX</p>
            <span className="intro-paper__folio">02 / FUNKADELIC ASTRONAUT</span>
          </div>
        </div>
        <button type="button" className="intro-zine__cover intro-paper" aria-label="Open mini zine" aria-expanded={open} aria-controls={id} tabIndex={open ? -1 : 0} aria-hidden={open} onClick={() => { setOpen(true); toggleRef.current?.focus(); }}>
          <span className="intro-paper__eyebrow">New Jersey · Future rock</span>
          <span className="intro-zine__title">Funkadelic<br />Astronaut</span>
          <img src={astronaut} alt="" />
          <span className="intro-zine__edition">FIELD NOTES<br />VOL. 01 / THE BAND</span>
          <span className="intro-paper__hand">a small introduction ↗</span>
        </button>
      </div>
      <button type="button" ref={toggleRef} className="intro-experiment__toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>{open ? 'Close mini zine' : 'Open mini zine'} <span aria-hidden="true">{open ? '↶' : '↗'}</span></button>
    </section>
  );
}
