import { createContext, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';

export const DEFAULT_SHADOW_STRENGTH = 0.36;

export type LightOccluderPoint = { x: number; y: number; height: number; radius: number };
export type LampOccluder = { base: LightOccluderPoint; elbow: LightOccluderPoint; neck: LightOccluderPoint };
export type DeskLight = { x: number; y: number; height: number; on: boolean; shadowStrength?: number; lamp?: LampOccluder };
const Light = createContext<DeskLight | null>(null);
const Register = createContext<Dispatch<SetStateAction<DeskLight | null>> | null>(null);

/** One desk lamp owns the light reference in this study. Geometry uses desk units. */
export function DeskLighting({ children }: { children: ReactNode }) {
  const [light, setLight] = useState<DeskLight | null>(null);
  return <Register.Provider value={setLight}><Light.Provider value={light}>{children}</Light.Provider></Register.Provider>;
}
export const useDeskLight = () => useContext(Light);

/** The lamp registers its bulb; consumers never need to know the lamp's artwork geometry. */
export function useRegisterDeskLight(light: DeskLight | null) {
  const register = useContext(Register);
  const x = light?.x, y = light?.y, height = light?.height, on = light?.on, shadowStrength = light?.shadowStrength, lamp = light?.lamp;
  useEffect(() => {
    if (!register || x === undefined || y === undefined || height === undefined || on === undefined) return;
    register({ x, y, height, on, shadowStrength, lamp });
    return () => register(null);
  }, [register, x, y, height, on, shadowStrength, lamp]);
}
