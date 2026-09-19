import { WASTEBASKET_MM } from '../../components/3D/Wastebasket/dimensions.ts';
/** Wall is y=0. Clearance includes the plant's widest illustrated leaf layer. */
export const FLOOR_REFERENCES = {
  plant: { x: -1200, y: 280, height: 950, potHeight: 320, potDiameter: 310, canopyRadius: 260, artwork: 310 / 290 * 360 },
  bin: { x: 1200, y: 155, ...WASTEBASKET_MM },
} as const;

/** Fraction along a Solid's projected height where the tabletop cuts its side. */
export function tabletopSplit(height:number,tableHeight:number,eyeHeight:number) {
  if(height<=tableHeight)return 1;
  if(height>=eyeHeight)return 0;
  return (tableHeight/(eyeHeight-tableHeight))/(height/(eyeHeight-height));
}
