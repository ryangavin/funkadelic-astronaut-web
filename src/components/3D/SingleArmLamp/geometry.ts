import { mmToUnits } from '../../../geometry/physicalScale.ts';

/** A single rigid arm; all construction measurements are millimetres. */
export const SINGLE_ARM_MM = { arm: 350, baseHeight: 25, baseRadius: 90, shadeRadius: 65, shadeReach: 45 } as const;
export const ARM_LIMITS = { min: 15, max: 85 } as const;
export const clampArm = (angle: number) => Math.max(ARM_LIMITS.min, Math.min(ARM_LIMITS.max, Number.isFinite(angle) ? angle : 60));
export const wrapShade = (angle: number) => Number.isFinite(angle) ? ((angle % 360) + 360) % 360 : 0;
export type LampPoint3 = { x: number; y: number; height: number };

/** Local artwork uses desk units, so 720 drawing units span exactly 600 mm. */
export function singleArmGeometry(armAngle = 60, shadeAngle = 0) {
  const elevation = clampArm(armAngle) * Math.PI / 180;
  const bearing = -135 * Math.PI / 180;
  const length = mmToUnits(SINGLE_ARM_MM.arm);
  const base = { x: 450, y: 400, height: mmToUnits(SINGLE_ARM_MM.baseHeight) };
  const neck = { x: base.x + length * Math.cos(elevation) * Math.cos(bearing), y: base.y + length * Math.cos(elevation) * Math.sin(bearing), height: base.height + length * Math.sin(elevation) };
  const swivel = (wrapShade(shadeAngle) - 135) * Math.PI / 180;
  const reach = mmToUnits(SINGLE_ARM_MM.shadeReach);
  const bulb = { x: neck.x + reach * Math.cos(swivel), y: neck.y + reach * Math.sin(swivel), height: neck.height - mmToUnits(20) };
  return { base, neck, bulb };
}
