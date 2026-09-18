import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';

export const DEFAULT_SHADOW_STRENGTH = 0.36;

export type LightOccluderPoint = { x: number; y: number; height: number; radius: number };
export type LampOccluder = { base: LightOccluderPoint; elbow: LightOccluderPoint; neck: LightOccluderPoint };
export type DeskLight = { x: number; y: number; height: number; on: boolean; shadowStrength?: number; lamp?: LampOccluder };

/*
  The light is a store rather than a piece of state, and the difference is the
  whole performance of the desk.

  Held as state, every step of a lamp being dragged was a new context value, so
  every shadow on the desk re-rendered — nine silhouettes of sixteen slices
  each, rebuilt and diffed sixty times a second. That was measured at some
  forty-five milliseconds a frame, and it was never the drawing: writing all
  hundred and forty-four of those transforms straight to the DOM every frame
  costs nothing at all. What cost was React deciding to.

  So the provider hands down one object that never changes identity, and what is
  inside it changes instead. A thing that must re-render when the light moves
  still can, with `useDeskLight`. A thing that only needs to redraw itself takes
  `useDeskLightEffect` and writes its own attributes, and React never hears
  about the lamp at all.
*/
type LightStore = {
  get: () => DeskLight | null;
  set: (light: DeskLight | null) => void;
  subscribe: (listener: () => void) => () => void;
};

function makeStore(): LightStore {
  let current: DeskLight | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => current,
    set: light => {
      current = light;
      for (const listener of [...listeners]) listener();
    },
    subscribe: listener => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}

const Store = createContext<LightStore | null>(null);

/** One desk lamp owns the light reference in this study. Geometry uses desk units. */
export function DeskLighting({ children }: { children: ReactNode }) {
  const [store] = useState(makeStore);
  return <Store.Provider value={store}>{children}</Store.Provider>;
}

/**
 * The light as it stands, for anything whose markup genuinely differs with it.
 * It re-renders on every change, which on a desk full of shadows is what the
 * store exists to avoid — prefer `useDeskLightEffect` for anything that only
 * needs to move what it has already drawn.
 */
export function useDeskLight(): DeskLight | null {
  const store = useContext(Store);
  return useSyncExternalStore(
    store?.subscribe ?? (() => () => {}),
    store?.get ?? (() => null),
    () => null,
  );
}

/**
 * One part of the light, for something that turns on a little of it — whether
 * the lamp is lit, say — and should sit still while the lamp is merely carried
 * about. It re-renders only when what is selected actually changes.
 */
export function useDeskLightPart<T>(select: (light: DeskLight | null) => T): T {
  const store = useContext(Store);
  const chosen = useRef(select);
  chosen.current = select;
  return useSyncExternalStore(
    store?.subscribe ?? (() => () => {}),
    () => chosen.current(store?.get() ?? null),
    () => chosen.current(null),
  );
}

/**
 * Run something whenever the light changes, without re-rendering for it. This
 * is how a shadow keeps up with the lamp: it draws its own shape once and then
 * writes its own attributes, which is free, instead of being rebuilt, which is
 * not. It runs after every render of its own component too, so a thing that has
 * been moved on the desk redraws its shadow with it.
 *
 * That last part is a trap worth naming, since it has cost a desk its frame
 * rate once already. Running after every render is right for a shadow whose own
 * object has moved, and wrong for everything else: a caller that re-renders for
 * reasons of its own rewrites its geometry anyway, at the value it already had,
 * and an attribute written back unchanged still marks its element to be drawn
 * again. What that costs is not the write — it is whatever else shares the
 * layer it dirtied. So anything using this wants to be sure it re-renders only
 * when what it draws has really changed; on this desk each cast shadow is
 * memoised per object, and the room is memoised whole.
 */
export function useDeskLightEffect(run: (light: DeskLight | null) => void) {
  const store = useContext(Store);
  const latest = useRef(run);
  latest.current = run;
  /* After each render, because the caller's own props move the shadow too. */
  useLayoutEffect(() => { latest.current(store?.get() ?? null); });
  /* The subscription outlives those renders. */
  useLayoutEffect(() => store?.subscribe(() => latest.current(store.get())), [store]);
}

/** The lamp registers its bulb; consumers never need to know the lamp's artwork geometry. */
export function useRegisterDeskLight(light: DeskLight | null) {
  const store = useContext(Store);
  const x = light?.x, y = light?.y, height = light?.height, on = light?.on, shadowStrength = light?.shadowStrength, lamp = light?.lamp;
  useEffect(() => {
    if (!store || x === undefined || y === undefined || height === undefined || on === undefined) return;
    store.set({ x, y, height, on, shadowStrength, lamp });
    return () => store.set(null);
  }, [store, x, y, height, on, shadowStrength, lamp]);
}
