import { FloorReferences } from './FloorReferences';
import { useState } from 'react';
import { RoomDiagramPortal } from '../RoomDiagram/RoomDiagram';
import { Movable, type Place } from '../../behaviors/Movable/Movable';
import { usePlaceStore } from '../../behaviors/Movable/places';
import { Relief } from '../../behaviors/Perspective/Relief';
import { StudyLighting } from '../../behaviors/Perspective/CastShadow';
import { MeterStick, STICK_VARIANTS, type StickVariant, METER_STICK_OUTLINE } from '../../components/3D/MeterStick/MeterStick';
import { Room, ROOM_LAMP, ROOM_LAMP_PLACE, useRoomCamera, type RoomProps } from '../../foundations/Room/Room';
import { DESK_MM, mmToUnits } from '../../geometry/physicalScale';
import './ScaleBench.css';

const ID = 'meter-stick';
const PLACE: Place = { x: mmToUnits(100), y: mmToUnits(570), rotation: 0 };
const shapes = [{ path: METER_STICK_OUTLINE }];
const pivot = { x: .5, y: .5 };

function Stick({ shadow = false, variant }: { shadow?: boolean; variant: StickVariant }) {
  const dimensions = STICK_VARIANTS[variant];
  const width = mmToUnits(dimensions.length);
  const depth = mmToUnits(dimensions.width);
  const camera = useRoomCamera();
  if (shadow) return <StudyLighting shadowOnly surfaceWidth={camera.width} surfaceHeight={camera.surfaceHeight} place={PLACE} placeId={ID} pivot={pivot} width={width} depth={depth} heightMm={dimensions.height} shapes={shapes} />;
  return <Movable id={ID} {...PLACE} width={width} label={dimensions.label} grab="anywhere" resizable={false}>
    <Relief place={PLACE} placeId={ID} camera={camera} width={width} depth={depth} heightMm={dimensions.height} path={METER_STICK_OUTLINE}>
      <MeterStick variant={variant} />
    </Relief>
  </Movable>;
}

/** Physical scale reference: the real Room, its lamp, and a fixed-scale measuring tool. */
export type ScaleBenchProps = Omit<RoomProps, 'places' | 'shadows' | 'children'> & { stickVariant?: StickVariant };

const inches = (mm: number) => `${(mm / 25.4).toFixed(2)} in`;

/** Both unit systems beside the ruler, so the scene answers "how big is that?" on its own. */
function DeskCaption({ widthMm, depthMm }: { widthMm: number; depthMm: number }) {
  return <dl className="scale-bench__caption" aria-label="Desk dimensions">
    {([['Desk width', widthMm], ['Desk depth', depthMm]] as const).map(([label, mm]) =>
      <div key={label} className="scale-bench__measure">
        <dt>{label}</dt>
        <dd aria-label={`${label} (mm)`}>{mm.toFixed(0)} mm</dd>
        <dd aria-label={`${label} inches`}>{inches(mm)}</dd>
      </div>)}
  </dl>;
}

export function ScaleBench({ stickVariant = 'meter', ...props }: ScaleBenchProps) {
  const places = usePlaceStore({ [ID]: PLACE, [ROOM_LAMP]: ROOM_LAMP_PLACE });
  const [diagramRoot, setDiagramRoot] = useState<HTMLDivElement | null>(null);
  const widthMm = props.deskWidthMm ?? DESK_MM.width;
  const depthMm = props.deskDepthMm ?? DESK_MM.depth;
  return <div className="scale-bench"><Room floorContent={<FloorReferences />} floorForeground={<FloorReferences above />} {...props} places={places} shadows={<Stick variant={stickVariant} shadow />}><Stick variant={stickVariant} /><RoomDiagramPortal target={diagramRoot} /></Room><DeskCaption widthMm={widthMm} depthMm={depthMm} /><div ref={setDiagramRoot} /></div>;
}
