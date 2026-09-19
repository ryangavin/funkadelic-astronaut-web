import { WASTEBASKET_MM } from '../../components/3D/Wastebasket/dimensions.ts';
/** Wall is y=0. Clearance includes the plant's widest illustrated leaf layer. */
export const FLOOR_REFERENCES = {
  plant: { x: -1200, y: 280, height: 950, potHeight: 320, potDiameter: 310, canopyRadius: 260, artwork: 310 / 290 * 360 },
  bin: { x: 1200, y: 155, ...WASTEBASKET_MM },
} as const;
