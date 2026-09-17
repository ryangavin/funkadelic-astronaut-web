import { Profiler, useCallback, useEffect, useRef, useState, type ProfilerOnRenderCallback } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PerspectiveDesk } from '../../pages/Desk/PerspectiveDesk';
import { attribute, dragLag, draggables, sweep, watchHandDrag, type Attribution, type DragLag, type FrameCost, type HandDrag, type Verdict } from './probe';
import './DeskPerf.css';

/*
  The bench, with the desk under it. Drag something by hand and the readout
  names what that cost; press a button and it does the dragging itself.

  The React counter is there to be ignored, which is the point of it. Every
  measurement so far has put React's share of a frame at well under a
  millisecond while the frame itself ran to seventy, so a run that shows a
  slow desk beside a quiet profiler is the expected shape, not a broken
  instrument — it says the time is going into drawing, and that the thing to
  take away next is a layer of the drawing rather than a render.
*/
function Bench() {
  const desk = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<FrameCost[]>([]);
  const [layers, setLayers] = useState<Attribution[]>([]);
  const [verdict, setVerdict] = useState<Verdict>();
  const [lags, setLags] = useState<DragLag[]>([]);
  const [running, setRunning] = useState('');
  /* Two runs are only comparable at the same size. Every number here is
     rasterisation, so drawing the desk half as wide roughly quarters the work —
     which is how the same desk measured 17ms in one window and 30ms in another
     on the same afternoon, and neither reading was wrong. */
  const [drawn, setDrawn] = useState('');
  const [commits, setCommits] = useState({ count: 0, totalMs: 0, worstMs: 0 });

  /* Counted into a ref, never into state: the desk is inside this component, so
     a profiler that set state would re-render the thing it is profiling and go
     round forever. The tally is read out once the run is over. */
  const tally = useRef({ count: 0, totalMs: 0, worstMs: 0 });
  const onRender: ProfilerOnRenderCallback = useCallback((_id, _phase, actual) => {
    const was = tally.current;
    tally.current = { count: was.count + 1, totalMs: was.totalMs + actual, worstMs: Math.max(was.worstMs, actual) };
  }, []);

  /*
    The readout for a real drag. It is kept in a ref and painted straight onto
    the panel rather than held in state: sixty renders a second of the bench,
    over the desk it is measuring, would be the bench reporting on itself.
  */
  const readout = useRef<HTMLParagraphElement>(null);
  const worstSeen = useRef(0);
  const held = useRef('');
  useEffect(() => watchHandDrag(desk.current ?? document.body, drag => {
    const line = readout.current;
    if (!line) return;
    /* The reading has to outlive the drag, or it is gone by the time anyone looks up. */
    if (!drag) {
      if (held.current) { line.textContent = `${held.current} — worst ${worstSeen.current.toFixed(1)}ms behind the pointer. Drag again to retake it.`; held.current = ''; }
      return;
    }
    if (!held.current) worstSeen.current = 0;
    held.current = drag.label;
    /* A reading taken while the hand is barely moving is noise: a pixel of
       trailing divided by a pixel of travel says a whole frame. */
    if (drag.speedPxPerFrame > 2 && drag.msBehind > worstSeen.current) worstSeen.current = drag.msBehind;
    line.textContent = `${drag.label}: ${drag.trailingPx}px behind at ${drag.speedPxPerFrame}px a frame — ${drag.msBehind}ms (worst ${worstSeen.current.toFixed(1)}ms), frame ${drag.frameMs}ms`;
    line.toggleAttribute('data-slow', worstSeen.current > 33);
  }), []);

  const root = () => desk.current ?? document.body;
  const run = async (what: string, job: () => Promise<void>) => {
    setRunning(what);
    const box = (desk.current ?? document.body).getBoundingClientRect();
    setDrawn(`${Math.round(box.width)}×${Math.round(box.height)} at dpr ${devicePixelRatio} — ${(box.width * box.height * devicePixelRatio ** 2 / 1e6).toFixed(1)} megapixels`);
    /* Let the button's own repaint land before the clock starts. */
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    tally.current = { count: 0, totalMs: 0, worstMs: 0 };
    try { await job(); } finally {
      setCommits(tally.current);
      setRunning('');
    }
  };

  const everything = () => run('Dragging each thing in turn…', async () => {
    setLayers([]);
    setLags([]);
    const { costs, undrawn } = await sweep(root());
    setRows(costs);
    setVerdict(undrawn
      ? { kind: 'not-drawing', says: 'Nothing on this desk cost more than a frame, which never happens while it is really being drawn — this window was not compositing. Bring it to the front and run it again.' }
      : undefined);
  });

  const trailing = () => run('Seeing how far each thing trails the pointer…', async () => {
    setLayers([]);
    const found: DragLag[] = [];
    for (const label of draggables(root())) found.push(await dragLag(root(), label));
    found.sort((a, b) => b.msToCommit - a.msToCommit);
    setLags(found);
  });

  const blame = (label: string) => run(`Taking the desk apart under the ${label}…`, async () => {
    const { asIs, layers: found, verdict: said } = await attribute(root(), label);
    setRows([asIs]);
    setLayers(found);
    setVerdict(said);
  });

  const worst = rows.find(row => row.label !== 'nothing — the desk at rest');

  return <div className="desk-perf">
    <aside className="desk-perf__panel">
      <h2>Where the frame goes</h2>
      <p className="desk-perf__hint">
        Two different questions, and a desk can fail either one. <em>Dragging</em> is how long a frame
        took, paint to paint — 16.7ms is sixty a second. <em>Behind the pointer</em> is how stale each of
        those frames was, which is what makes a drag feel heavy even at a full sixty. One frame behind is
        the floor; nothing can be drawn sooner than the next paint.
      </p>
      <div className="desk-perf__actions">
        <button type="button" onClick={everything} disabled={!!running}>Drag everything</button>
        <button type="button" onClick={trailing} disabled={!!running}>How far behind the pointer</button>
        <button type="button" onClick={() => blame('Desk lamp')} disabled={!!running}>Blame a layer: lamp</button>
        {worst && <button type="button" onClick={() => blame(worst.label)} disabled={!!running}>Blame a layer: {worst.label.toLowerCase()}</button>}
      </div>
      <p className="desk-perf__status" role="status">{running || (rows.length ? 'Done.' : 'Nothing measured yet.')}</p>
      {drawn && <p className="desk-perf__size">Desk drawn at {drawn}. Only compare runs taken at the same size.</p>}

      {/* The one measurement here that is not synthetic, and so the only one
          entitled to disagree with the others. */}
      <p className="desk-perf__hand" ref={readout}>Drag something on the desk by hand.</p>

      {!!rows.length && <table className="desk-perf__table">
        <caption>Dragging</caption>
        <thead><tr><th scope="col">What moved</th><th scope="col">Frame</th><th scope="col">fps</th><th scope="col">Worst</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.label} data-slow={row.medianMs > 33 ? '' : undefined} data-tight={row.medianMs > 17 && row.medianMs <= 33 ? '' : undefined}>
          <th scope="row">{row.label}</th><td>{row.medianMs}ms</td><td>{row.fps}</td><td>{row.worstMs}ms</td>
        </tr>)}</tbody>
      </table>}

      {!!layers.length && <table className="desk-perf__table">
        <caption>…and what each layer of the drawing was worth</caption>
        <thead><tr><th scope="col">Taken away</th><th scope="col">Frame</th><th scope="col">Saved</th></tr></thead>
        <tbody>{layers.map(row => <tr key={row.label} data-slow={row.savedPct >= 25 ? '' : undefined}>
          <th scope="row">{row.label.replace(/^without /, '')}</th><td>{row.medianMs}ms</td><td>{row.savedMs > 0 ? `${row.savedMs}ms · ${row.savedPct}%` : '—'}</td>
        </tr>)}</tbody>
      </table>}

      {!!lags.length && <table className="desk-perf__table">
        <caption>…and how far each trails the pointer</caption>
        <thead><tr><th scope="col">What moved</th><th scope="col">To the DOM</th><th scope="col">Worst</th></tr></thead>
        <tbody>{lags.map(row => <tr key={row.label} data-slow={row.msToCommit > 17 ? '' : undefined} data-tight={row.msToCommit > 8 && row.msToCommit <= 17 ? '' : undefined}>
          <th scope="row">{row.label}</th>
          <td>{row.followed ? `${row.msToCommit}ms` : 'never moved'}</td>
          <td>{row.worstMsToCommit}ms{row.overAFrame ? ` · ${row.overAFrame} over a frame` : ''}</td>
        </tr>)}</tbody>
      </table>}

      {verdict && <p className="desk-perf__verdict" data-kind={verdict.kind}>{verdict.says}</p>}

      <p className="desk-perf__react">
        React, over the same run: <strong>{commits.count}</strong> commits,
        <strong> {commits.totalMs.toFixed(1)}ms</strong> all told,
        worst <strong>{commits.worstMs.toFixed(1)}ms</strong>.
      </p>
    </aside>
    <div className="desk-perf__desk" ref={desk}>
      <Profiler id="desk" onRender={onRender}><PerspectiveDesk showSettings={false} /></Profiler>
    </div>
  </div>;
}

const meta = {
  title: 'Behaviors/Desk Perf',
  component: Bench,
  parameters: { layout: 'fullscreen' },
  /* Kept out of the test run. It mounts the whole desk to measure it, which is
     slower than the runner's patience, and there is nothing here to assert: the
     bench reports what a frame cost on the machine it ran on, and that is not a
     thing a test can be right or wrong about. */
  tags: ['!test', '!autodocs'],
} satisfies Meta<typeof Bench>;
export default meta;

/**
 * Drag something and watch the frame time, or let the bench drag everything
 * itself. The second row of buttons takes the desk apart a layer at a time
 * under whichever thing is slowest, which is what names the cost.
 */
export const Bench_: StoryObj<typeof meta> = { name: 'Bench' };
