import { useRoomSceneGeometry } from '../../foundations/Room/Room';
import { elevatedLayer, type StudyCamera } from '../../behaviors/Perspective/elevation';
import { FloorPlacement } from '../../foundations/Room/RoomFloorSurface';
import { floorCamera } from '../../foundations/Room/floorSurface';
import { mmToUnits } from '../../geometry/physicalScale';
import { Wastebasket } from '../../components/3D/Wastebasket/Wastebasket';
import { BASE_LAYER, layerTransform } from '../../components/3D/Wastebasket/cylinder';
import { FLOOR_REFERENCES } from './referenceDimensions';
function projection(object:{x:number;y:number;artwork:number},camera:StudyCamera,height:number) {
  const width=mmToUnits(object.artwork);
  return elevatedLayer(mmToUnits(height),{x:camera.width/2+mmToUnits(object.x)-width/2,y:mmToUnits(object.y)-width/2,width,drawingWidth:360,drawingHeight:360},camera);
}
function Plant({above,tableHeight,camera}:{above:boolean;tableHeight:number;camera:StudyCamera}) {
  const object=FLOOR_REFERENCES.plant,at=(height:number)=>projection(object,camera,height);
  return <div className={`scale-plant scale-plant--${above?'above':'below'}`} style={{position:'relative',aspectRatio:1}}>
    {Array.from({length:11},(_,i)=>{
      const angle=i*137.5,height=620+(i%4)*110,top=at(height),cut=at(Math.min(height,tableHeight));
      if(top.scale<=0 || (above && height<=tableHeight))return null;
      const start=above?cut:BASE_LAYER,end=above?top:cut;
      return <svg key={i} data-plant-layer-height={height} viewBox="0 0 360 360" style={{position:'absolute',inset:0,width:'100%',overflow:'visible'}} aria-hidden="true">
        <circle data-stem-start="" cx={180+start.x} cy={180+start.y} r="0"/><path data-plant-stem="" d={`M${180+start.x} ${180+start.y}L${180+end.x} ${180+end.y}`} stroke="#506e42" strokeWidth="2"/>
        {(above ? height>tableHeight : height<=tableHeight) && <g data-leaf-height={height} transform={layerTransform(top)}><path transform={`rotate(${angle} 180 180)`} d="M180 180Q142 120 180 -40Q226 112 180 180Z" fill={i%2?'#466c43':'#62854c'}/><path transform={`rotate(${angle} 180 180)`} d="M180 180L180 -25" stroke="#91a46a" strokeOpacity=".45" fill="none"/></g>}
      </svg>;
    })}
    <Wastebasket layer={{above,split:Math.min(1,tableHeight/320),top:at(320),cut:at(Math.min(320,tableHeight))}} color="#af7354" interior="#473529" label="Terracotta pot, 320 mm tall and 310 mm across" className="scale-plant__pot"/>
  </div>;
}
export function FloorReferences({above=false}:{above?:boolean}) {
  const scene=useRoomSceneGeometry();
  if(!scene)return null;
  const {camera,stand}=scene.setup,tableHeight=stand/1.2,floor=floorCamera(camera,stand,1,0).camera,bin=FLOOR_REFERENCES.bin;
  return <>
    <FloorPlacement x={FLOOR_REFERENCES.plant.x} y={FLOOR_REFERENCES.plant.y} width={FLOOR_REFERENCES.plant.artwork}><Plant above={above} tableHeight={tableHeight} camera={floor}/></FloorPlacement>
    <FloorPlacement x={bin.x} y={bin.y} width={bin.artwork}><Wastebasket layer={{above,split:Math.min(1,tableHeight/bin.height),top:projection(bin,floor,bin.height),cut:projection(bin,floor,Math.min(bin.height,tableHeight))}}/></FloorPlacement>
  </>;
}
