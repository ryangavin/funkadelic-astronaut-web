import { mmToUnits } from '../../geometry/physicalScale';
import type { CSSProperties, ReactNode } from 'react';
import { Perspective } from '../../behaviors/Perspective/Perspective';
import type { roomSetup } from '../../geometry/roomSetup';
import { floorCamera } from './floorSurface';
export function RoomFloorSurface({camera,stand,share,lip,anchor,children}:{camera:ReturnType<typeof roomSetup>['camera'];stand:number;share:number;lip:number;anchor:number;children:ReactNode}) {
  const floor=floorCamera(camera,stand,share,lip);
  const top=anchor*100-(floor.lip+floor.camera.targetY)*floor.share/camera.width*1600/9;
  return <div className="room__floor-surface" style={{position:'absolute',left:'50%',top:`${top}%`,width:`${floor.share*100}%`,translate:'-50% 0',pointerEvents:'none','--floor-world-width':camera.width} as CSSProperties}>
    <Perspective {...floor.camera}><div style={{position:'relative',aspectRatio:`${camera.width} / ${camera.surfaceHeight}`}}>{children}</div></Perspective>
  </div>;
}
/** Millimetre placement in the floor plane, centered across the wall. */
export function FloorPlacement({x,y,width,children}:{x:number;y:number;width:number;children:ReactNode}) {
  return <div style={{position:'absolute',left:`calc(50% + ${mmToUnits(x)} / var(--floor-world-width) * 100%)`,top:`calc(${mmToUnits(y)} * 100cqw / var(--floor-world-width))`,width:`calc(${mmToUnits(width)} / var(--floor-world-width) * 100%)`,translate:'-50% -50%'}}>{children}</div>;
}
