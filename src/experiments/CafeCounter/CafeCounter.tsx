import { PerspectiveDesk } from '../../pages/Desk/PerspectiveDesk';
import type { ObjectPlacements } from '../../pages/Desk/DeskObjects';
import { MVP_INITIAL_IDS, BENCH_EXTRAS, MVP_PASS_IDS } from '../../debug/SizingBench/roster';
import { Movable } from '../../behaviors/Movable/Movable';
import { Pin } from '../../components/2D/Pin/Pin';
import './CafeCounter.css';

// Local composition only; the separate scale study will supply shared object refinements.
const placements: ObjectPlacements = {
  dossier: { x: -185, y: 255, rotation: -5, scale: 1 },
  walkman: { x: 565, y: 375, rotation: -7, scale: 1 },
  handheld: { x: 735, y: 395, rotation: 3, scale: 1.3 },
  sitePlan: { x: 1030, y: 240, rotation: 8, scale: 1 },
  contract: { x: 1160, y: 325, rotation: -3, scale: 1 },
  pen: { x: 1110, y: 625, rotation: -12, scale: 1 },
  labelBro: { x: 1270, y: 540, rotation: 9, scale: 1 },
  mug: { x: 70, y: 570, rotation: -18, scale: 1 },
  cradle: { x: 1350, y: 130, rotation: -6, scale: 1 },
  'calibration-tour-1': { x: 580, y: 545, rotation: -5, scale: 1 },
  'calibration-tour-2': { x: 735, y: 560, rotation: 2, scale: 1 },
  'calibration-tour-3': { x: 890, y: 545, rotation: 7, scale: 1 },
};

export function CafeCounter() {
  return <div className="cafe-counter">
    <header className="cafe-counter__brief"><strong>Setting study / Café window counter</strong><span>Same band, a smaller personal corner. Sample dates · media not connected.</span></header>
    <section className="cafe-counter__scene" aria-label="Café window counter prototype">
      <div className="cafe-counter__window" aria-hidden="true"><div className="cafe-counter__street"><i /><i /><i /><i /></div><div className="cafe-counter__glass" /><div className="cafe-counter__decal">COFFEE · ALL DAY</div><div className="cafe-counter__sill" /></div>
      <PerspectiveDesk only={MVP_INITIAL_IDS} objectPlacements={placements} showSettings={false}
        showCamera={false} showPerformance={false} room={false} wood="oak"
        deskWidthMm={1400} deskDepthMm={850} deskHeightMm={1000} deskEdgeMm={38}
        eyeHeightMm={1950} viewerSetbackMm={450} headTiltDegrees={83} horizontalFieldOfViewDegrees={75}
        deskShare={1.08} roomLip={-90} lampX={-230} lampY={90} lampWidth={576}
        lampLowerAngle={-142.6818247177271} lampUpperAngle={110.41274403236815}
        lampEnamel="green" shadowStrength={0.28}>
        <Pin x={390} y={120} width={690} rotation={-2}><div className="cafe-counter__booking"><small>ON THE SHORTLIST / FESTIVAL BOOKING</small><strong>FUNKADELIC<br />ASTRONAUT</strong><span>Listen. Watch. Make room on the bill.</span></div></Pin>
        <Pin x={565} y={340} width={175} rotation={-4}><div className="cafe-counter__tape">01 / MUSIC</div></Pin>
        <Pin x={760} y={345} width={220} rotation={2}><div className="cafe-counter__tape">02 / LIVE VIDEO</div></Pin>
        <Pin x={585} y={505} width={375} rotation={1}><div className="cafe-counter__tape">03 / NEXT SHOWS · SAMPLES</div></Pin>
        {BENCH_EXTRAS.filter(item => MVP_PASS_IDS.includes(item.id)).map(item => <Movable key={item.id} id={item.id} {...placements[item.id]} width={item.width} label={item.name} z={40} grab="body">{item.content}</Movable>)}
        <Pin x={445} y={635} width={86} rotation={16}><div className="cafe-counter__tin" role="img" aria-label="Decorative Zyn-style pouch tin"><span>ZYN</span><small>POUCHES</small></div></Pin>
        <Pin x={260} y={560} width={230} rotation={-5}><div className="cafe-counter__receipt">FILTER COFFEE<br />TABLE 03<br />————————<br />TAKE YOUR TIME.</div></Pin>
      </PerspectiveDesk>
    </section>
    <footer className="cafe-counter__foot">Atmosphere prototype · Open the original dossier to try the spread. Its shared open arrangement still needs a counter-specific composition pass.</footer>
  </div>;
}
