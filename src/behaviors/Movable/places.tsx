import { createContext, useContext, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { Place } from './Movable';

/*
  Where everything on a surface lies, held as a store rather than as state.

  This is the same trick as DeskLighting, for the same reason and with the same
  shape, because the desk has the same problem twice. Held as state, a place is
  owned by whatever renders the surface, so every step of every drag is a render
  of the whole surface: measured on the bench, dragging one sheet of paper
  re-rendered the desk lamp forty-nine times and spent thirty-four milliseconds
  doing it, against one and a half for the sheet actually being moved. Nothing
  about the lamp had changed. It was simply downstream of the thing that had.

  So a place lives here instead, and there are three ways to read it, in
  descending order of what they cost:

    usePlace        re-renders when this one thing moves. For markup that
                    genuinely differs — not for moving something already drawn.
    usePlaceEffect  runs when this one thing moves, and never re-renders. This is
                    how a shadow follows its object.
    usePlaces       the store itself, for reading every place at once at the
                    moment someone asks — saving an arrangement, say — rather
                    than subscribing to all of them forever.

  Subscription is per thing, not per surface. A desk of fifteen things where
  moving one told the other fourteen would have given back most of what this is
  for.
*/

export type PlaceStore = {
  get: (id: string) => Place | undefined;
  /** Every place as it stands. For whoever wants to write the arrangement down. */
  all: () => Record<string, Place>;
  set: (id: string, place: Place) => void;
  /** Put a whole arrangement back, as a saved composition does. Tells everything. */
  reset: (places: Record<string, Place>) => void;
  subscribe: (id: string, listener: () => void) => () => void;
};

export function makePlaces(initial: Record<string, Place> = {}): PlaceStore {
  let places: Record<string, Place> = { ...initial };
  const listeners = new Map<string, Set<() => void>>();
  const tell = (id: string) => {
    for (const listener of [...(listeners.get(id) ?? [])]) listener();
  };
  return {
    get: id => places[id],
    all: () => places,
    set: (id, place) => {
      if (places[id] === place) return;
      places = { ...places, [id]: place };
      tell(id);
    },
    reset: next => {
      const touched = new Set([...Object.keys(places), ...Object.keys(next)]);
      places = { ...next };
      for (const id of touched) tell(id);
    },
    subscribe: (id, listener) => {
      const here = listeners.get(id) ?? new Set();
      listeners.set(id, here);
      here.add(listener);
      return () => { here.delete(listener); };
    },
  };
}

const Places = createContext<PlaceStore | null>(null);

/** The surface's places. Off a surface that keeps any, there is no store and everything falls back to props. */
export function usePlaces() {
  return useContext(Places);
}

export function PlacesProvider({ store, children }: { store: PlaceStore; children: ReactNode }) {
  return <Places.Provider value={store}>{children}</Places.Provider>;
}

/** Where one thing lies, for markup that really is different because of it. Re-renders when it moves. */
export function usePlace(id: string | undefined): Place | undefined {
  const store = usePlaces();
  return useSyncExternalStore(
    listener => (store && id ? store.subscribe(id, listener) : () => {}),
    () => (store && id ? store.get(id) : undefined),
    () => undefined,
  );
}

/**
 * Run something when one thing moves, without re-rendering for it. A shadow
 * draws its shape once and then writes its own attributes, which is free,
 * instead of being rebuilt, which is not.
 *
 * It runs after every render of its own component too, so a thing whose drawing
 * has changed for some other reason redraws with it.
 */
export function usePlaceEffect(id: string | undefined, run: (place: Place | undefined) => void) {
  const store = usePlaces();
  const latest = useRef(run);
  latest.current = run;
  useLayoutEffect(() => { latest.current(store && id ? store.get(id) : undefined); });
  useLayoutEffect(() => {
    if (!store || !id) return;
    return store.subscribe(id, () => latest.current(store.get(id)));
  }, [store, id]);
}

/** One store for a surface, made once. */
export function usePlaceStore(initial: Record<string, Place>) {
  const [store] = useState(() => makePlaces(initial));
  return store;
}
