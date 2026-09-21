import { useState } from 'react';
import { PerspectiveDesk } from '../../pages/Desk/PerspectiveDesk';
import type { ObjectPlacements } from '../../pages/Desk/DeskObjects';
import { MVP_INITIAL_IDS, BENCH_EXTRAS, MVP_PASS_IDS } from '../../debug/SizingBench/roster';
import { Movable } from '../../behaviors/Movable/Movable';
import './ProductionTrailer.css';

// Composition overrides only; shared object artwork and dimensions remain untouched.
export const TRAILER_PLACEMENTS: ObjectPlacements = {
  dossier: { x: 90, y: 310, rotation: -5, scale: 1 },
  walkman: { x: 740, y: 330, rotation: 6, scale: 1 },
  handheld: { x: 940, y: 330, rotation: -4, scale: 1.3 },
  sitePlan: { x: 180, y: 20, rotation: -12, scale: 1 },
  contract: { x: 610, y: 20, rotation: 5, scale: 1 },
  pen: { x: 630, y: 235, rotation: 18, scale: 1 },
  labelBro: { x: 100, y: 410, rotation: -8, scale: 1 },
  mug: { x: 120, y: 650, rotation: -12, scale: 1 },
  cradle: { x: 470, y: 685, rotation: 2, scale: 1 },
  'calibration-tour-1': { x: 735, y: 590, rotation: -5 },
  'calibration-tour-2': { x: 900, y: 610, rotation: 3 },
  'calibration-tour-3': { x: 1065, y: 590, rotation: -3 },
};

export function ProductionTrailer() {
  const [reset, setReset] = useState(0);
  return <section className="production-trailer">
    <header className="production-trailer__brief">
      <div><strong>Production trailer</strong><span>Setting prototype · fictional backstage workspace</span></div>
      <p>Sample dates · media not connected · shared scale refinements pending</p>
      <button onClick={() => setReset(value => value + 1)}>Reset scene</button>
    </header>
    <div className="production-trailer__stage">
      <div className="production-trailer__wall" aria-hidden="true">
        <div className="production-trailer__window"><i /><span>STAGE B / SERVICE ROAD</span></div>
        <div className="production-trailer__notice"><b>PRODUCTION</b><span>LOAD IN → SOUND CHECK → DOORS</span><hr /><span>RADIO / CH 04<br />KEEP FIRE LANE CLEAR<br />ARTIST CHECK-IN AT TRAILER</span></div>
        <div className="production-trailer__board"><b>SITE LOGISTICS</b><i /><span>CREW COPY / WORKING PLAN</span></div>
        <div className="production-trailer__wall-label">02 / ARTIST LIAISON</div>
      </div>
      <PerspectiveDesk key={reset} only={MVP_INITIAL_IDS} objectPlacements={TRAILER_PLACEMENTS}
        showSettings={false} room={false} deskWidthMm={1200} deskDepthMm={900} deskHeightMm={740}
        deskEdgeMm={14} eyeHeightMm={1780} viewerSetbackMm={510} headTiltDegrees={82}
        horizontalFieldOfViewDegrees={72} roomLip={-65} lampX={-40} lampY={125}
        lampLowerAngle={-142.6818247177271} lampUpperAngle={110.41274403236815}
        lampEnamel="green" shadowStrength={0.38} lampIntensity={0.7}>
        <div className="production-trailer__billing" aria-hidden="true"><small>ON THE BOOKING DESK</small><strong>Funkadelic<br />Astronaut</strong></div>
        <div className="production-trailer__cue production-trailer__cue--music">LISTEN / DEMO</div>
        <div className="production-trailer__cue production-trailer__cue--video">WATCH / LIVE SET</div>
        <div className="production-trailer__cue production-trailer__cue--dates">NEXT SHOWS · LAYOUT SAMPLES</div>
        {BENCH_EXTRAS.filter(item => MVP_PASS_IDS.includes(item.id)).map(item => <Movable key={item.id} id={item.id} {...TRAILER_PLACEMENTS[item.id]} width={item.width} label={item.name}>{item.content}</Movable>)}
        <div className="production-trailer__ashtray" role="img" aria-label="Small used metal ashtray"><i /><i /><i /></div>
        <svg className="production-trailer__cable" viewBox="0 0 1440 1080" aria-hidden="true"><path d="M1445 440 C1300 415 1390 920 1350 970 S1340 1090 1355 1110" /></svg>
        <div className="production-trailer__tape" aria-hidden="true">TRAILER 02 — PLEASE RETURN</div>
      </PerspectiveDesk>
    </div>
  </section>;
}
