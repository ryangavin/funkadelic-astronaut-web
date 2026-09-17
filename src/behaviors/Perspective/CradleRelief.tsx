import { useEffect, useState } from 'react';
import { CRADLE_BALLS, CRADLE_PERIOD_MS, CRADLE_RADIUS, CRADLE_RAILS, CRADLE_REST, CRADLE_SWING, NewtonsCradle } from '../../components/3D/NewtonsCradle/NewtonsCradle';
import type { Place } from '../Movable/Movable';
import { projectElevation } from './elevation';
import type { StudyCamera } from './DeskObjectStudy';
import './CradlePerspective.css';

export function CradleRelief({ place, camera, width = 240 }: { place: Place; camera: StudyCamera; width?: number }) {
  const [swinging, setSwinging] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!swinging) { setElapsed(0); return; }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => { setElapsed(now - start); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [swinging]);
  const turn = (place.rotation ?? 0) * Math.PI / 180;
  const unit = width / 720;
  // Width is the existing 120 mm. These elevations are explicit estimates:
  // base top 8 mm, rail centre 90 mm, resting ball centre 20 mm.
  const point = (x: number, y: number, heightMm: number) => {
    const lx = (x - 360) * unit;
    const ly = (y - 300) * unit;
    const cx = place.x + width / 2;
    const cy = place.y + 600 * unit / 2;
    const projected = projectElevation(cx + lx * Math.cos(turn) - ly * Math.sin(turn), cy + lx * Math.sin(turn) + ly * Math.cos(turn), heightMm * 2, camera);
    const dx = projected.x - cx;
    const dy = projected.y - cy;
    return { x: 360 + (dx * Math.cos(turn) + dy * Math.sin(turn)) / unit, y: 300 + (-dx * Math.sin(turn) + dy * Math.cos(turn)) / unit, scale: projected.scale };
  };
  const line = (a: ReturnType<typeof point>, b: ReturnType<typeof point>) => `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
  const phase = elapsed / CRADLE_PERIOD_MS * 2 * Math.PI;
  const balls = CRADLE_BALLS.map((x, index) => {
    const travel = swinging ? (index === 0 ? -Math.max(0, Math.sin(phase)) : index === 4 ? Math.max(0, -Math.sin(phase)) : 0) * CRADLE_SWING : 0;
    const horizontalMm = travel / 6;
    // Constant string length: a displaced ball rises, with both anchors fixed.
    const height = 90 - Math.sqrt(70 ** 2 - horizontalMm ** 2);
    return { x, at: point(x + travel, CRADLE_REST, height) };
  });
  const base = point(360, 300, 8);
  return (
              <div className="cradle-perspective-study__object cradle-relief">
                <NewtonsCradle sound={false} onSwing={setSwinging} />
                <svg className="cradle-perspective-study__posts" viewBox="0 0 720 600" aria-hidden="true">
                  <rect x="20" y="30" width="680" height="540" rx="34" fill="#110d0a" />
                  <rect x="20" y="30" width="680" height="540" rx="34" fill="url(#cradle-base)" stroke="#534036" strokeWidth="2" transform={`translate(${base.x} ${base.y}) scale(${base.scale}) translate(-360 -300)`} />
                  {CRADLE_RAILS.map(y => (
                    <g key={y}>
                      {[70, 650].map(x => <path key={x} d={line(point(x, y, 8), point(x, y, 90))} stroke="#949aa1" strokeWidth="19" strokeLinecap="round" />)}
                      <path d={line(point(70, y, 90), point(650, y, 90))} stroke="#bdc2ca" strokeWidth="14" strokeLinecap="round" />
                      {[70, 650].map(x => { const cap = point(x, y, 90); return <circle key={x} cx={cap.x} cy={cap.y} r={16 * cap.scale} fill="url(#cradle-rail)" />; })}
                    </g>
                  ))}
                  {balls.map(({ x, at }) => (
                    <g key={x}>
                      {CRADLE_RAILS.map(y => <path key={y} d={line(point(x, y, 90), at)} stroke="#d8dbdf" strokeWidth="2" />)}
                      <circle cx={at.x} cy={at.y} r={CRADLE_RADIUS * at.scale} fill="url(#cradle-ball)" />
                      <circle cx={at.x - 14 * at.scale} cy={at.y - 18 * at.scale} r={9 * at.scale} fill="#fff" opacity="0.7" />
                    </g>
                  ))}
                </svg>
              </div>
  );
}
