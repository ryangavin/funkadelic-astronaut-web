import { useRoomSceneGeometry } from '../../foundations/Room/Room';
import { Solid } from '../../behaviors/Perspective/Perspective';
import { FloorPlacement } from '../../foundations/Room/RoomFloorSurface';
import { Wastebasket, WASTEBASKET_MM } from '../../components/3D/Wastebasket/Wastebasket';
import { FLOOR_REFERENCES, tabletopSplit } from './referenceDimensions';
function Plant({above,tableHeight}:{above:boolean;tableHeight:number}) {
  return <div className={`scale-plant scale-plant--${above?'above':'below'}`} style={{position:'relative',aspectRatio:1}}>
    {Array.from({length:11},(_,i)=>{
      const angle=i*137.5,height=620+(i%4)*110,split=tabletopSplit(height,tableHeight);
      if(above && split>=1)return null;
      return <div key={i} style={{position:'absolute',inset:0}}><Solid height={height/FLOOR_REFERENCES.plant.artwork} foot={{x:.5,y:.5}}><svg data-plant-layer-height={height} viewBox="0 0 360 360" style={{display:'block',width:'100%',overflow:'visible'}} aria-hidden="true">
        <g style={{transformOrigin:'180px 180px',transform:'matrix(1,0,calc(var(--solid-splay,0) * -1),var(--solid-rise,0),0,0)'}}><path d={above?`M180 ${180-360*split}L180 -180`:`M180 180L180 ${180-360*split}`} stroke="#506e42" strokeWidth="2"/></g>
        {(above ? height>tableHeight : height<=tableHeight) && <g data-leaf-height={height} style={{translate:'calc(var(--solid-splay,0) * 360px) calc(var(--solid-rise,0) * -360px)'}}><path transform={`rotate(${angle} 180 180)`} d="M180 180Q142 120 180 -40Q226 112 180 180Z" fill={i%2?'#466c43':'#62854c'}/><path transform={`rotate(${angle} 180 180)`} d="M180 180L180 -25" stroke="#91a46a" strokeOpacity=".45" fill="none"/></g>}
      </svg></Solid></div>;
    })}
    <Solid height={320/FLOOR_REFERENCES.plant.artwork} foot={{x:.5,y:.5}}><Wastebasket layer={{above,split:tabletopSplit(320,tableHeight)}} color="#af7354" interior="#473529" label="Terracotta pot, 320 mm tall and 310 mm across" className="scale-plant__pot"/></Solid>
  </div>;
}
export function FloorReferences({above=false}:{above?:boolean}) {
  const scene=useRoomSceneGeometry();
  if(!scene)return null;
  const {stand}=scene.setup,tableHeight=stand/1.2;
  return <>
  <FloorPlacement x={FLOOR_REFERENCES.plant.x} y={FLOOR_REFERENCES.plant.y} width={FLOOR_REFERENCES.plant.artwork}><Plant above={above} tableHeight={tableHeight}/></FloorPlacement>
  <FloorPlacement x={FLOOR_REFERENCES.bin.x} y={FLOOR_REFERENCES.bin.y} width={360}><Solid height={WASTEBASKET_MM.height/360} foot={{x:.5,y:.5}}><Wastebasket layer={{above,split:tabletopSplit(WASTEBASKET_MM.height,tableHeight)}}/></Solid></FloorPlacement>
</>;}
