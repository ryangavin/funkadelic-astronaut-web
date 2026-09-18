/** Artistic light shaping, in desk units where distances are not dimensionless. */
export type LightTuning = {
  poolSpread: number;
  floorPoolSpread: number;
  poolFalloff: number;
  shadowReach: number;
  shadowScaleLimit: number;
  shadowAttenuation: number;
  floorShadowLimit: number;
  floorShadowTemper: number;
};
export const DEFAULT_LIGHT_TUNING: LightTuning = {
  poolSpread: 1.4, floorPoolSpread: 1.1, poolFalloff: 1.6,
  shadowReach: 1440, shadowScaleLimit: 4, shadowAttenuation: 1000,
  floorShadowLimit: 3, floorShadowTemper: 0.42,
};
export function lightingSetup(input: Partial<LightTuning> = {}): LightTuning {
  const result = { ...DEFAULT_LIGHT_TUNING, ...Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) };
  for (const [key, value] of Object.entries(result)) {
    if (!Number.isFinite(value) || value < 0 || (key === 'shadowAttenuation' && value === 0) || (key === 'shadowScaleLimit' && value < 1))
      throw new RangeError(`${key} must be finite and ${key === 'shadowScaleLimit' ? 'at least 1' : key === 'shadowAttenuation' ? 'positive' : 'nonnegative'}`);
  }
  return result;
}
