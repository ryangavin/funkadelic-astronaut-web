import { Profiler, useCallback, useRef, useState, type ProfilerOnRenderCallback } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PerspectiveDesk } from '../../pages/Desk/PerspectiveDesk';
import { attribute, sweep, type Attribution, type FrameCost, type Verdict } from './probe';
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
  const [running, setRunning] = useState('');
  const [commits, setCommits] = useState({ count: 0, totalMs: 0, worstMs: 0 });

  /* Counted into a ref, never into state: the desk is inside this component, so
     a profiler that set state would re-render the thing it is profiling and go
     round forever. The tally is read out once the run is over. */
  const tally = useRef({ count: 0, totalMs: 0, worstMs: 0 });
  const onRender: ProfilerOnRenderCallback = useCallback((_id, _phase, actual) => {
    const was = tally.current;
    tally.current = { count: was.count + 1, totalMs: was.totalMs + actual, worstMs: Math.max(was.worstMs, actual) };
  }, []);

  const root = () => desk.current ?? document.body;
  const run = async (what: string, job: () => Promise<void>) => {
    setRunning(what);
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
    const { costs, undrawn } = await sweep(root());
    setRows(costs);
    setVerdict(undrawn
      ? { kind: 'not-drawing', says: 'Nothing on this desk cost more than a frame, which never happens while it is really being drawn — this window was not compositing. Bring it to the front and run it again.' }
      : undefined);
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
        Every number is a frame, measured paint to paint. 16.7ms is sixty a second; anything
        past that is a drag you can feel. Nothing here times a render — the renders were never the problem.
      </p>
      <div className="desk-perf__actions">
        <button type="button" onClick={everything} disabled={!!running}>Drag everything</button>
        <button type="button" onClick={() => blame('Desk lamp')} disabled={!!running}>Blame a layer: lamp</button>
        {worst && <button type="button" onClick={() => blame(worst.label)} disabled={!!running}>Blame a layer: {worst.label.toLowerCase()}</button>}
      </div>
      <p className="desk-perf__status" role="status">{running || (rows.length ? 'Done.' : 'Nothing measured yet.')}</p>

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
