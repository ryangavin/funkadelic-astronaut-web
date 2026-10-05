import { Profiler, createContext, useContext, type ProfilerOnRenderCallback, type ReactNode } from 'react';

/*
  Who re-rendered, and what it cost them.

  The bench could already say how long a frame took and how much of it was the
  drawing. What it could not say is the thing everyone's instinct reaches for
  first: how much of this was React, and which parts of it. "681 commits over
  the run" is a number nobody can act on — it does not say whether that was one
  thing rendering six hundred times or six hundred things rendering once, and
  those want opposite fixes.

  So anything worth counting wraps itself in `Tallied`, and a bench that wants
  to know provides a tally. Off a bench there is no tally, the wrapper renders
  its children and nothing else happens: no Profiler is mounted, so the
  composition is exactly what it was.
*/

export type Tally = (id: string, phase: 'mount' | 'update' | 'nested-update', ms: number) => void;

export const RenderTally = createContext<Tally | null>(null);

export function useRenderTally() {
  return useContext(RenderTally);
}

/** One thing worth counting. Free — and absent — when nobody is counting. */
export function Tallied({ id, children }: { id: string; children: ReactNode }) {
  const tally = useRenderTally();
  if (!tally) return <>{children}</>;
  const report: ProfilerOnRenderCallback = (_id, phase, actual) => tally(id, phase, actual);
  return <Profiler id={id} onRender={report}>{children}</Profiler>;
}

export type Rendered = { id: string; renders: number; totalMs: number; worstMs: number };

/**
 * A running count, kept in a plain object rather than in state: the bench sits
 * over the thing it is measuring, so a tally that re-rendered on every render it
 * counted would be reporting on itself.
 */
export function makeTally() {
  const seen = new Map<string, Rendered>();
  const tally: Tally = (id, _phase, ms) => {
    const at = seen.get(id) ?? { id, renders: 0, totalMs: 0, worstMs: 0 };
    seen.set(id, { id, renders: at.renders + 1, totalMs: at.totalMs + ms, worstMs: Math.max(at.worstMs, ms) });
  };
  return {
    tally,
    clear: () => seen.clear(),
    /** Dearest first, which is the order worth reading. */
    read: (): Rendered[] => [...seen.values()]
      .map(one => ({ ...one, totalMs: +one.totalMs.toFixed(1), worstMs: +one.worstMs.toFixed(1) }))
      .sort((a, b) => b.renders - a.renders || b.totalMs - a.totalMs),
  };
}
