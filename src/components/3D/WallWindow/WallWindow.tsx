import { useId, type CSSProperties } from 'react';
import { mmToUnits } from '../../../geometry/physicalScale';
import { WALL_WINDOW } from './geometry';
import './WallWindow.css';

/** A layered wall illustration: an open aperture, shaded joinery and folded casements. */
export function WallWindow({ height = WALL_WINDOW.height, sill = WALL_WINDOW.sill }: {height?:number;sill?:number}) {
  const id=`wall-window-${useId().replace(/:/g,'')}`;
  const {artWidth,artHeight,artBelow}=WALL_WINDOW;
  const verticalScale=height/WALL_WINDOW.height;
  return <svg className="wall-window" viewBox="-250 -80 1600 1200" preserveAspectRatio="none" aria-hidden="true" focusable="false" style={{'--window-art-width':mmToUnits(artWidth),'--window-art-height':mmToUnits(artHeight*verticalScale),'--window-art-bottom':mmToUnits(sill-artBelow*verticalScale)} as CSSProperties}>
    <defs>
      <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor="#8fbac2"/><stop offset="1" stopColor="#e3e5cf"/></linearGradient>
      <linearGradient id={`${id}-wood`}><stop stopColor="#e1d4b7"/><stop offset=".45" stopColor="#f0e7d0"/><stop offset="1" stopColor="#b3a58c"/></linearGradient>
      <linearGradient id={`${id}-glass`} x2="1" y2="1"><stop stopColor="#b6d4cd" stopOpacity=".75"/><stop offset="1" stopColor="#597d7b" stopOpacity=".45"/></linearGradient>
      <clipPath id={`${id}-opening`}><rect width="1100" height="1000" rx="3"/></clipPath>
    </defs>
    {/* A soft recess, then the view beyond the open frame. */}
    <rect x="-48" y="-42" width="1196" height="1090" rx="8" fill="#211d18" opacity=".45"/>
    <g clipPath={`url(#${id}-opening)`}>
      <rect width="1100" height="1000" fill={`url(#${id}-sky)`}/>
      <path d="M-80 215 Q130 170 295 211 T640 197 T1180 215 L1180 241 Q860 229 650 239 T300 239 T-80 253Z" fill="#f1eee0" opacity=".64"/>
      <path d="M-20 630 Q160 476 345 588 Q585 374 805 531 Q960 437 1140 550 V1040 H-20Z" fill="#94aa8e"/>
      <path d="M-20 796 Q200 623 420 755 Q650 569 825 704 Q994 611 1140 731 V1040 H-20Z" fill="#647f68"/>
      <path d="M905 1060 Q890 830 951 621 M919 887 L1030 761 M929 797 L846 693" fill="none" stroke="#566853" strokeWidth="19"/>
      <g fill="#78916d"><ellipse cx="992" cy="666" rx="117" ry="83"/><ellipse cx="852" cy="696" rx="99" ry="69"/><ellipse cx="1012" cy="778" rx="136" ry="76"/></g>
      <path d="M0 0 H1100 V24 H20 V1000 H0Z" fill="#263a34" opacity=".22"/>
    </g>
    {/* Solid frame and jambs; there is no glass across the central opening. */}
    <path d="M-32 -32 H1132 V1032 H-32Z M12 12 V988 H1088 V12Z" fill={`url(#${id}-wood)`} fillRule="evenodd"/>
    <path d="M12 12 H1088 M12 12 V988 M1088 12 V988" fill="none" stroke="#776f5c" strokeWidth="8"/>
    <path d="M-43 -43 H1143 V-24 H-43Z" fill="#f3e7cf"/>
    {/* Casements fold out toward either side, drawn as a few shaded artwork layers. */}
    <path d="M0 8 L-202 106 V952 L0 1000Z" fill="#302c23" opacity=".25" transform="translate(-12 16)"/>
    <path d="M1100 8 L1302 106 V952 L1100 1000Z" fill="#302c23" opacity=".25" transform="translate(12 16)"/>
    {[false,true].map(right=><g key={String(right)} transform={right?'translate(1100 0) scale(-1 1)':undefined}>
      <path d="M0 8 L-200 104 V952 L0 1000Z" fill={`url(#${id}-wood)`} stroke="#776a53" strokeWidth="5"/>
      <path d="M-23 56 L-172 125 V920 L-23 956Z" fill={`url(#${id}-glass)`} stroke="#948872" strokeWidth="9"/>
      <path d="M-155 157 L-48 111 V428 L-155 468Z" fill="#e3efdf" opacity=".23"/>
      <path d="M-185 522 L-12 510" stroke="#d7c9ad" strokeWidth="22"/>
      <path d="M-8 15 V990" stroke="#f6e9ce" strokeWidth="9"/>
      <path d="M-32 548 V589 L-47 597" fill="none" stroke="#675b42" strokeWidth="9" strokeLinecap="round"/>
      <path d="M-7 230 V266 M-7 775 V811" stroke="#605b4c" strokeWidth="12"/>
    </g>)}
    {/* Broad sill cap and its shaded fascia. */}
    <path d="M-58 991 H1158 L1200 1046 H-100Z" fill="#e0d1b2"/>
    <path d="M-100 1046 H1200 V1072 H-100Z" fill="#a79a7e"/>
    <path d="M-95 1046 H1195" stroke="#f4e6c8" strokeWidth="6"/>
    <path d="M-62 1075 H1166" stroke="#201e18" strokeOpacity=".2" strokeWidth="15"/>
  </svg>;
}
