import { useId } from 'react';
import './Wastebasket.css';
export { WASTEBASKET_MM } from './dimensions';
/** Layered cylinder artwork, stood on its surface with Solid like the mug. */
export function Wastebasket({color='#77877b',interior='#35473b',label='Wastebasket, 360 mm tall and 290 mm across',className='',layer}:{color?:string;interior?:string;label?:string;className?:string;layer?:{above:boolean;split:number}}) {
  const id=`wastebasket-${useId().replace(/:/g,'')}`;
  if(layer?.above && layer.split>=1)return null;
  const above=layer?.above??false,split=layer?.split??1;
  return <svg className={`wastebasket ${className}`} viewBox="0 0 360 360" role="img" aria-label={label}>
    <defs>
      <linearGradient id={`${id}-side`}><stop offset="0" stopColor="#000" stopOpacity=".45"/><stop offset=".28" stopColor="#fff" stopOpacity=".23"/><stop offset=".65" stopColor="#000" stopOpacity=".05"/><stop offset="1" stopColor="#000" stopOpacity=".5"/></linearGradient>
      <radialGradient id={`${id}-inside`} cx=".6" cy=".65"><stop offset="0" stopColor="#222e27"/><stop offset=".65" stopColor={interior}/><stop offset="1" stopColor="#111b15"/></radialGradient>
      <radialGradient id={`${id}-contact`}><stop offset=".6" stopColor="#21180f" stopOpacity=".3"/><stop offset="1" stopColor="#21180f" stopOpacity="0"/></radialGradient>
      <clipPath id={`${id}-slice`}><rect x="-1000" y={above?-10000:180-360*split} width="2000" height={above?10180-360*split:10000}/></clipPath>
    </defs>
    {!above && <circle cx="180" cy="180" r="145" fill={`url(#${id}-contact)`}/>}
    <g className="wastebasket__side">{!above && <g><circle cx="180" cy="180" r="115" fill={color}/><circle cx="180" cy="180" r="115" fill={`url(#${id}-side)`}/></g>}
      <g className="wastebasket__wall"><g clipPath={`url(#${id}-slice)`}><path d="M35 -180H325L295 180H65Z" fill={color}/><path d="M35 -180H325L295 180H65Z" fill={`url(#${id}-side)`}/></g></g>
    </g>
    {(above ? split<1 : split>=1) && <g className="wastebasket__top"><circle cx="180" cy="180" r="145" fill={color}/><circle cx="180" cy="180" r="145" fill={`url(#${id}-side)`}/><circle cx="180" cy="180" r="133" fill={`url(#${id}-inside)`}/><circle cx="180" cy="180" r="118" fill={interior} opacity=".5"/><circle cx="180" cy="180" r="140" fill="none" stroke="#c0c9bd" strokeOpacity=".55" strokeWidth="3"/><path d="M66 118A130 130 0 0 1 160 51" fill="none" stroke="#d1d6ca" strokeOpacity=".5" strokeWidth="4" strokeLinecap="round"/></g>}
  </svg>;
}
