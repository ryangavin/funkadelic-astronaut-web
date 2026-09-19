import { FloorReferences } from './FloorReferences';
import { useState } from 'react';
import { RoomDiagramPortal } from '../RoomDiagram/RoomDiagram';
import { Movable, type Place } from '../../behaviors/Movable/Movable';
import { usePlaceStore } from '../../behaviors/Movable/places';
import { Relief } from '../../behaviors/Perspective/Relief';
import { StudyLighting } from '../../behaviors/Perspective/CastShadow';
import { MeterStick, STICK_VARIANTS, type StickVariant, METER_STICK_OUTLINE } from '../../components/3D/MeterStick/MeterStick';
import { Room, ROOM_LAMP, ROOM_LAMP_PLACE, useRoomCamera, type RoomProps } from '../../foundations/Room/Room';
import { mmToUnits } from '../../geometry/physicalScale';

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

export function ScaleBench({ stickVariant = 'meter', ...props }: ScaleBenchProps) {
  const places = usePlaceStore({ [ID]: PLACE, [ROOM_LAMP]: ROOM_LAMP_PLACE });
  const [diagramRoot, setDiagramRoot] = useState<HTMLDivElement | null>(null);
  return <div className="scale-bench"><Room floorContent={<FloorReferences />} floorForeground={<FloorReferences above />} {...props} places={places} shadows={<Stick variant={stickVariant} shadow />}><Stick variant={stickVariant} /><RoomDiagramPortal target={diagramRoot} /></Room><div ref={setDiagramRoot} /></div>;
}
