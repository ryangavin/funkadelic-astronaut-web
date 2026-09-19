import { useId, type CSSProperties } from 'react';
import { mmToUnits } from '../../../geometry/physicalScale';
import { WALL_WINDOW } from './geometry';
import './WallWindow.css';

/** A layered wall illustration: an open aperture, slender steel joinery and folded divided-light casements. */
export function WallWindow({ height = WALL_WINDOW.height, sill = WALL_WINDOW.sill }: {height?:number;sill?:number}) {
  const id=`wall-window-${useId().replace(/:/g,'')}`;
  const {artWidth,artHeight,artBelow}=WALL_WINDOW;
  const verticalScale=height/WALL_WINDOW.height;
  return <svg className="wall-window" viewBox="-250 -80 1600 1200" preserveAspectRatio="none" aria-hidden="true" focusable="false" style={{'--window-art-width':mmToUnits(artWidth),'--window-art-height':mmToUnits(artHeight*verticalScale),'--window-art-bottom':mmToUnits(sill-artBelow*verticalScale)} as CSSProperties}>
    <defs>
      <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor="#c5d5d0"/><stop offset="1" stopColor="#eeeee1"/></linearGradient>
      <linearGradient id={`${id}-steel`}><stop stopColor="#242725"/><stop offset=".45" stopColor="#494943"/><stop offset="1" stopColor="#191e1d"/></linearGradient>
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
    <path d="M-24 -24 H1124 V1024 H-24Z M10 10 V990 H1090 V10Z" fill={`url(#${id}-steel)`} fillRule="evenodd"/>
    <path d="M12 12 H1088 M12 12 V988 M1088 12 V988" fill="none" stroke="#141b1a" strokeWidth="5"/>
    <path d="M-30 -30 H1130 V-23 H-30Z" fill="#858075"/>
    {/* Casements fold out toward either side, drawn as a few shaded artwork layers. */}
    <path d="M0 8 L-157 106 V952 L0 1000Z" fill="#302c23" opacity=".25" transform="translate(-12 16)"/>
    <path d="M1100 8 L1257 106 V952 L1100 1000Z" fill="#302c23" opacity=".25" transform="translate(12 16)"/>
    {[false,true].map(right=><g key={String(right)} transform={right?'translate(1100 0) scale(-1 1)':undefined}>
      <path d="M0 8 L-155 104 V952 L0 1000Z" fill={`url(#${id}-steel)`} stroke="#151b19" strokeWidth="5"/>
      <path d="M-23 56 L-135 125 V920 L-23 956Z" fill={`url(#${id}-glass)`} stroke="#282e2b" strokeWidth="6"/>
      <path d="M-124 157 L-48 111 V290 L-124 326Z" fill="#e3efdf" opacity=".23"/>
      <path d="M-147 386 L-12 346 M-147 666 L-12 658" stroke="#2b302c" strokeWidth="12"/>
      <path d="M-8 15 V990" stroke="#787b6e" strokeWidth="6"/>
      <path d="M-32 548 V589 L-47 597" fill="none" stroke="#a29c81" strokeWidth="6" strokeLinecap="round"/>
      <path d="M-7 230 V266 M-7 775 V811" stroke="#151a18" strokeWidth="12"/>
    </g>)}
    {/* A slender fixed steel grid leaves the view open between divided lights.
        Open leaves repeat its three-course rhythm at either side. */}
    <path d="M550 8 V1000 M8 338 H1092 M8 662 H1092" fill="none" stroke="#17201e" strokeWidth="20"/>
    <path d="M543 12 V991 M12 331 H1090 M12 655 H1090" fill="none" stroke="#77796c" strokeWidth="3"/>
    {/* Broad sill cap and its shaded fascia. */}
    <path d="M-58 991 H1158 L1200 1046 H-100Z" fill="#82786a"/>
    <path d="M-100 1046 H1200 V1072 H-100Z" fill="#49463e"/>
    <path d="M-95 1046 H1195" stroke="#b2a58f" strokeWidth="6"/>
    <path d="M-62 1075 H1166" stroke="#201e18" strokeOpacity=".2" strokeWidth="15"/>
  </svg>;
}
