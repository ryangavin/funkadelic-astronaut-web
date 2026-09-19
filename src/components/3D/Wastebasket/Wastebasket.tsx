import { BASE_LAYER, cylinderSide, layerTransform, type CylinderLayer } from './cylinder';
import { useId } from 'react';
import './Wastebasket.css';
export { WASTEBASKET_MM } from './dimensions';
/** Mug-style layered cylinder artwork, with explicit projected base and rim planes. */
export function Wastebasket({color='#77877b',interior='#35473b',label='Wastebasket, 360 mm tall and 290 mm across',className='',layer}:{color?:string;interior?:string;label?:string;className?:string;layer?:{above:boolean;split:number;top:CylinderLayer;cut:CylinderLayer}}) {
  const id=`wastebasket-${useId().replace(/:/g,'')}`;
  if(layer?.above && layer.split>=1)return null;
  const above=layer?.above??false,split=layer?.split??1;
  const top=layer?.top??BASE_LAYER,cut=layer?.cut??top;
  if(top.scale<=0)return null;
  const low=above?cut:BASE_LAYER,high=above?top:cut;
  const cutRadius=115+30*split,lowRadius=above?cutRadius:115,highRadius=above?145:cutRadius;
  const wall=cylinderSide(low,lowRadius,high,highRadius);
  return <svg className={`wastebasket ${className}`} viewBox="0 0 360 360" role="img" aria-label={label}>
    <defs>
      <linearGradient id={`${id}-side`} gradientUnits="userSpaceOnUse" x1="35" y1="0" x2="325" y2="0"><stop offset="0" stopColor="#000" stopOpacity=".45"/><stop offset=".28" stopColor="#fff" stopOpacity=".23"/><stop offset=".65" stopColor="#000" stopOpacity=".05"/><stop offset="1" stopColor="#000" stopOpacity=".5"/></linearGradient>
      <radialGradient id={`${id}-inside`} cx=".6" cy=".65"><stop offset="0" stopColor="#222e27"/><stop offset=".65" stopColor={interior}/><stop offset="1" stopColor="#111b15"/></radialGradient>
      <radialGradient id={`${id}-contact`}><stop offset=".6" stopColor="#21180f" stopOpacity=".3"/><stop offset="1" stopColor="#21180f" stopOpacity="0"/></radialGradient>
    </defs>
    {!above && <circle cx="180" cy="180" r="145" fill={`url(#${id}-contact)`}/>}
    <g className="wastebasket__side">
      <circle data-cylinder-base-point="" cx={180+low.x} cy={180+low.y} r="0"/><circle data-cylinder-base="" cx={180+low.x} cy={180+low.y} r={lowRadius*low.scale} fill={color}/>
      <circle cx={180+low.x} cy={180+low.y} r={lowRadius*low.scale} fill={`url(#${id}-side)`}/>
      <path className="wastebasket__wall" d={wall} fill={color}/><path d={wall} fill={`url(#${id}-side)`}/>
      <circle cx={180+high.x} cy={180+high.y} r={highRadius*high.scale} fill={color}/><circle cx={180+high.x} cy={180+high.y} r={highRadius*high.scale} fill={`url(#${id}-side)`}/>
    </g>
    {(above ? split<1 : split>=1) && <g className="wastebasket__top" transform={layerTransform(top)}><circle data-cylinder-rim="" cx="180" cy="180" r="0" fill="none"/><circle data-cylinder-rim-left="" cx="35" cy="180" r="0"/><circle data-cylinder-rim-right="" cx="325" cy="180" r="0"/><circle cx="180" cy="180" r="145" fill={color}/><circle cx="180" cy="180" r="145" fill={`url(#${id}-side)`}/><circle cx="180" cy="180" r="133" fill={`url(#${id}-inside)`}/><circle cx="180" cy="180" r="118" fill={interior} opacity=".5"/><circle cx="180" cy="180" r="140" fill="none" stroke="#c0c9bd" strokeOpacity=".55" strokeWidth="3"/><path d="M66 118A130 130 0 0 1 160 51" fill="none" stroke="#d1d6ca" strokeOpacity=".5" strokeWidth="4" strokeLinecap="round"/></g>}
  </svg>;
}
