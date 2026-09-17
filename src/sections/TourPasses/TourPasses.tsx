import type { CSSProperties } from 'react';
import { Pin } from '../../components/2D/Pin/Pin';
import { Stage } from '../../components/2D/Stage/Stage';
import { TourPass } from '../../components/2D/TourPass/TourPass';
import { TOUR_DATES } from '../../components/2D/TourPass/TourPass.data';

export const TOUR_PASSES_WIDTH = 1300;
export const TOUR_PASSES_HEIGHT = 580;

/** Coordinates within the row, independent of where the group sits on a page. */
export const TOUR_PASSES_LAYOUT = {
  olivesX: 0,
  olivesY: 20,
  olivesRotation: -2.15,
  olivesWidth: 400,
  nyackX: 450,
  nyackY: 0,
  nyackRotation: 1.5,
  nyackWidth: 400,
  saturnX: 900,
  saturnY: 25,
  saturnRotation: -1,
  saturnWidth: 400,
};

export type TourPassesProps = Partial<typeof TOUR_PASSES_LAYOUT>;

/** The three tour passes as one movable, uniformly scaling composition. */
export function TourPasses(props: TourPassesProps) {
  const at = { ...TOUR_PASSES_LAYOUT, ...Object.fromEntries(Object.entries(props).filter(([, value]) => value !== undefined)) };
  const placements = [
    { x: at.olivesX, y: at.olivesY, width: at.olivesWidth, rotation: at.olivesRotation },
    { x: at.nyackX, y: at.nyackY, width: at.nyackWidth, rotation: at.nyackRotation },
    { x: at.saturnX, y: at.saturnY, width: at.saturnWidth, rotation: at.saturnRotation },
  ];

  return (
    <section aria-label="Tour passes">
      <Stage width={TOUR_PASSES_WIDTH} height={TOUR_PASSES_HEIGHT} style={{ overflow: 'visible' }}>
        <div style={{ position: 'relative', height: TOUR_PASSES_HEIGHT, '--sheet-unit': '1px' } as CSSProperties}>
          {TOUR_DATES.map((pass, index) => (
            <Pin key={pass.dateTime} {...placements[index]}>
              <TourPass {...pass} rotation={0} />
            </Pin>
          ))}
        </div>
      </Stage>
    </section>
  );
}
