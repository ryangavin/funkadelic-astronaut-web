import { Profiler, useCallback, useEffect, useMemo, useRef, useState, type ProfilerOnRenderCallback } from 'react';
import type React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PerspectiveDesk } from '../../pages/Desk/PerspectiveDesk';
import { DESK_OBJECTS } from '../../pages/Desk/DeskObjects';
import { MovableLive } from '../Movable/Movable';
import { RenderTally, makeTally, type Rendered } from './tally';
import { attribute, census, dragLag, draggables, frameSeries, splitFrames, sweep, wastedWork, watchHandDrag, type Attribution, type Census, type DragLag, type FrameCost, type FrameSplit, type HandDrag, type Series, type Verdict, type Wasted } from './probe';
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

  That claim is no longer an assertion. Every run here is now broken down by
  the browser itself — script, style and layout, and whatever is left, which is
  the drawing — so the profiler and the frame split can be read side by side
  and disagree in public if they ever do.

  And one question neither of them can answer: how much of what we did was
  worth doing at all. `What is redrawn for nothing` counts every attribute and
  every custom property written during a drag and how many of them wrote the
  value that was already there. A write that changes nothing still marks its
  element to be drawn again, and what that costs is not the write — it is
  everything else that lives in the layer it dirtied.
*/
/*
  The same desk with one thing on it.

  A desk of fifteen things is the honest subject and a poor instrument: when a
  drag costs more than it should, everything under it is a suspect, and taking
  suspects away one at a time is what the layer buttons do badly and slowly. So
  this is the same composition — the same room, the same lamp, the same camera,
  the same object at its own size and place — with the rest of the desk simply
  not there. A reading here can be set beside a reading from the full desk,
  because nothing about how the thing is drawn has changed.
*/
function OneThing({ id }: { id: string }) {
  /*
    The desk is asked for this one thing rather than handed it, so the thing is
    drawn exactly as the composition draws it — and, more to the point, so it
    still gets its shadow. A shadow is drawn in the lighting layer and not by the
    object, so a bench that mounted the object itself got a thing casting
    nothing, which quietly made a comparison of two shadows a comparison of
    neither. That mistake was made here once already.
  */
  const only = useMemo(() => [id], [id]);
  return <PerspectiveDesk only={only} showSettings={false} />;
}

function Bench({ only }: { only?: string }) {
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
  /* What the frames of whatever was just run were made of, and what of that run was worth doing. */
  const [split, setSplit] = useState<FrameSplit>();
  const [wasted, setWasted] = useState<Wasted>();
  const [made, setMade] = useState<Census>();
  /* Every frame of one drag, in the order they happened. */
  const [series, setSeries] = useState<Series>();
  /* The one experiment here that only a hand can judge: see MovableLive. */
  const [live, setLive] = useState(false);
  /* Who re-rendered, over whatever was last measured. Collected into a plain
     object and read out once, for the same reason the Profiler above is. */
  const counter = useRef(makeTally()).current;
  const [rendered, setRendered] = useState<Rendered[]>([]);

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
  const worstPx = useRef(0);
  /* The busiest frame of the drag: how many pointer reports arrived in one. */
  const mostReports = useRef(0);
  const reportFrames = useRef(0);
  const reportTotal = useRef(0);
  useEffect(() => watchHandDrag(desk.current ?? document.body, drag => {
    const line = readout.current;
    if (!line) return;
    /* The reading has to outlive the drag, or it is gone by the time anyone looks up. */
    if (!drag) {
      if (held.current) {
        const each = reportFrames.current ? (reportTotal.current / reportFrames.current).toFixed(1) : '0';
        const stream = `Pointer reports: ${each} a frame on average, ${mostReports.current} at the busiest.`;
        line.textContent = worstPx.current > 0
          ? `${held.current} — worst ${worstPx.current.toFixed(0)}px behind while properly moving, about ${worstSeen.current.toFixed(0)}ms. ${stream} Drag again to retake it.`
          : `${held.current} — never moved fast enough to measure. ${stream} Drag it briskly across the desk.`;
        held.current = '';
        /* The drag is over, so telling React now costs nothing that was being measured. */
        setRendered(counter.read());
      }
      return;
    }
    if (!held.current) { worstSeen.current = 0; worstPx.current = 0; mostReports.current = 0; reportFrames.current = 0; reportTotal.current = 0; counter.clear(); }
    if (drag.movesThisFrame > 0) { reportFrames.current += 1; reportTotal.current += drag.movesThisFrame; }
    if (drag.movesThisFrame > mostReports.current) mostReports.current = drag.movesThisFrame;
    held.current = drag.label;
    /* Only while the hand is properly moving: see MOVING_ENOUGH. */
    if (drag.worthStating) {
      if (drag.msBehind > worstSeen.current) worstSeen.current = drag.msBehind;
      if (drag.trailingPx > worstPx.current) worstPx.current = drag.trailingPx;
    }
    line.textContent = drag.worthStating
      ? `${drag.label}: ${drag.trailingPx}px behind at ${drag.speedPxPerFrame}px a frame — ${drag.msBehind}ms (worst ${worstPx.current.toFixed(0)}px · ${worstSeen.current.toFixed(0)}ms), frame ${drag.frameMs}ms, ${drag.movesThisFrame} report${drag.movesThisFrame === 1 ? '' : 's'} this frame`
      : `${drag.label}: ${drag.trailingPx}px behind, but only ${drag.speedPxPerFrame}px a frame — move faster for a reading.`;
    line.toggleAttribute('data-slow', worstPx.current > 20);
  }), [counter]);

  const root = () => desk.current ?? document.body;
  const run = async (what: string, job: () => Promise<void>) => {
    setRunning(what);
    const box = (desk.current ?? document.body).getBoundingClientRect();
    setDrawn(`${Math.round(box.width)}×${Math.round(box.height)} at dpr ${devicePixelRatio} — ${(box.width * box.height * devicePixelRatio ** 2 / 1e6).toFixed(1)} megapixels`);
    /* Let the button's own repaint land before the clock starts. */
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    tally.current = { count: 0, totalMs: 0, worstMs: 0 };
    counter.clear();
    /* Every run is broken down, not just the one button that asks for it: the
       question of whether a slow frame was ours or the drawing's comes up for
       all of them, and this costs nothing to have running. */
    const frames = splitFrames();
    try { await job(); } finally {
      setSplit(frames.stop());
      setRendered(counter.read());
      setCommits(tally.current);
      setRunning('');
    }
  };

  const everything = () => run('Dragging each thing in turn…', async () => {
    setLayers([]);
    setLags([]);
    const { costs, undrawn, drawing } = await sweep(root());
    setRows(costs);
    setVerdict(undrawn
      ? { kind: 'not-drawing', says: `Nothing on this desk cost more than a frame — and neither did the control, which puts the room's grain back in the path of every frame and ought to cost twenty milliseconds (${drawing?.plainMs}ms against ${drawing?.loadedMs}ms). This window was not compositing, so the run is void. Bring it to the front and run it again.` }
      : drawing?.available
        ? { kind: 'already-fast', says: `Everything here drags inside the frame budget, and the window really was drawing it: with the control applied, the same drag went from ${drawing.plainMs}ms to ${drawing.loadedMs}ms.` }
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

  /* Counting every write costs enough to change what it is measuring, so this is
     its own run and its own table: the counts belong to it, the milliseconds do not. */
  const idle = (label: string) => run(`Counting what is redrawn for nothing under the ${label}…`, async () => {
    setLayers([]);
    setLags([]);
    setRows([]);
    setVerdict(undefined);
    setWasted(await wastedWork(root(), label));
  });

  const composition = () => setMade(census(root()));

  const everyFrame = (label: string) => run(`Timing every frame under the ${label}…`, async () => {
    setLayers([]);
    setLags([]);
    setRows([]);
    setVerdict(undefined);
    setWasted(undefined);
    setSeries(await frameSeries(root(), label));
  });

  const worst = rows.find(row => row.label !== 'nothing — the desk at rest');

  return <div className="desk-perf">
    <div className="desk-perf__desk" ref={desk}>
      <RenderTally.Provider value={counter.tally}><MovableLive.Provider value={live}>
        <Profiler id="desk" onRender={onRender}>{only ? <OneThing id={only} /> : <PerspectiveDesk showSettings={false} />}</Profiler>
      </MovableLive.Provider></RenderTally.Provider>
    </div>
    <aside className="desk-perf__panel">
      <div className="desk-perf__head">
      <h2>Where the frame goes</h2>
      <p className="desk-perf__hint">
        Two different questions, and a desk can fail either one. <em>Dragging</em> is how long a frame
        took, paint to paint — 16.7ms is sixty a second. <em>Behind the pointer</em> is how stale each of
        those frames was, which is what makes a drag feel heavy even at a full sixty. One frame behind is
        the floor; nothing can be drawn sooner than the next paint. Neither says <em>why</em>, which is
        what the last two buttons are for: one counts the work of a drag that changed nothing, the other
        counts what a repaint of this desk has to go through however little of it moved.
      </p>
      <div className="desk-perf__actions">
        <button type="button" onClick={everything} disabled={!!running}>Drag everything</button>
        <button type="button" onClick={trailing} disabled={!!running}>How far behind the pointer</button>
        <button type="button" onClick={() => blame('Desk lamp')} disabled={!!running}>Blame a layer: lamp</button>
        {worst && <button type="button" onClick={() => blame(worst.label)} disabled={!!running}>Blame a layer: {worst.label.toLowerCase()}</button>}
        {/* Under the worst thing found so far, or, before any run, under an ordinary
            object rather than the lamp: the lamp really does move the light, so every
            shadow on the desk is entitled to be rewritten and nothing stands out. */}
        <button type="button" onClick={() => idle(worst?.label ?? draggables(root()).find(name => name !== 'Desk lamp') ?? 'Desk lamp')} disabled={!!running}>What is redrawn for nothing</button>
        <button type="button" onClick={() => everyFrame(worst?.label ?? draggables(root())[0])} disabled={!!running}>Frame by frame</button>
        <button type="button" onClick={composition} disabled={!!running}>What the drawing is made of</button>
      </div>
      <p className="desk-perf__status" role="status">{running || (rows.length ? 'Done.' : 'Nothing measured yet.')}</p>
      {drawn && <p className="desk-perf__size">Desk drawn at {drawn}. Only compare runs taken at the same size.</p>}

      {/* The one measurement here that is not synthetic, and so the only one
          entitled to disagree with the others. */}
      <p className="desk-perf__hand" ref={readout}>Drag something on the desk by hand.</p>

      {/* Not a measurement. A real hand says the desk trails the pointer by four
          frames while every dispatched drag says it does not, and a hand counting
          pointer reports says one arrives a frame, so there is nothing to skip.
          This takes the owner's state out of the path and leaves the rest alone,
          to be judged the only way that question can be: by dragging. */}
      <label className="desk-perf__toggle">
        <input type="checkbox" checked={live} onChange={event => setLive(event.target.checked)} />
        Write the place straight to the element, and tell React when it is put down
      </label>
      <p className="desk-perf__hint">
        Drag something, tick this, drag it again. While it is on, the shadow of whatever you are
        dragging stays where the thing started until you let go — that is the cost of the shortcut,
        not a fault in it. Turning and resizing are left on the ordinary path.
      </p>
      </div>

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

      {!!wasted && <>
        <table className="desk-perf__table">
          <caption>…and how much of that was putting things back where they already were</caption>
          <thead><tr><th scope="col">Per frame, under the {wasted.label.toLowerCase()}</th><th scope="col">Done</th><th scope="col">For nothing</th></tr></thead>
          <tbody>
            <tr data-slow={wasted.idleAttributes > 0 ? '' : undefined}>
              <th scope="row">Attributes written</th><td>{wasted.attributes}</td><td>{wasted.idleAttributes}</td>
            </tr>
            <tr data-tight={wasted.idleStyles > 0 ? '' : undefined}>
              <th scope="row">Styles and custom properties written</th><td>{wasted.styles}</td><td>{wasted.idleStyles}</td>
            </tr>
            <tr data-tight={wasted.layoutReads > 4 ? '' : undefined}>
              <th scope="row">Boxes measured off the DOM</th><td>{wasted.layoutReads}</td><td>—</td>
            </tr>
          </tbody>
        </table>
        <table className="desk-perf__table">
          <caption>Who wrote it</caption>
          <thead><tr><th scope="col">What was written</th><th scope="col">A frame</th><th scope="col">Changed anything</th></tr></thead>
          <tbody>{wasted.culprits.map(one => <tr key={one.what} data-slow={one.idle ? '' : undefined}>
            <th scope="row">{one.what}</th><td>{one.perFrame}</td><td>{one.idle ? 'never' : 'yes'}</td>
          </tr>)}</tbody>
        </table>
        <table className="desk-perf__table">
          <caption>…and who measured the page mid-frame</caption>
          <thead><tr><th scope="col">What was measured</th><th scope="col">A frame</th></tr></thead>
          <tbody>{wasted.readers.map(one => <tr key={one.what}><th scope="row">{one.what}</th><td>{one.perFrame}</td></tr>)}</tbody>
        </table>
        <p className="desk-perf__hint">
          Counting every write makes each frame of that run dearer than the same drag unwatched, so the
          counts above are exact and the frame times that came with them are the bench’s own. A write
          that never changes anything still marks its element to be drawn again — what it costs is
          whatever else lives in the layer it dirties.
        </p>
      </>}

      {!!made && <table className="desk-perf__table">
        <caption>What a repaint has to go through, drawn at {made.drawn} — {made.megapixels} megapixels</caption>
        <thead><tr><th scope="col">On the desk</th><th scope="col">How many</th></tr></thead>
        <tbody>
          <tr><th scope="row">Elements</th><td>{made.nodes}</td></tr>
          <tr data-slow={made.referenced > 0 ? '' : undefined}><th scope="row">Carrying a referenced SVG filter</th><td>{made.referenced}</td></tr>
          <tr data-tight={made.filtered > 0 ? '' : undefined}><th scope="row">Carrying any filter at all</th><td>{made.filtered}</td></tr>
          <tr data-tight={made.blended > 0 ? '' : undefined}><th scope="row">Blending with what is under them</th><td>{made.blended}</td></tr>
          <tr><th scope="row">Reading back their backdrop</th><td>{made.backdrops}</td></tr>
          <tr><th scope="row">Masked</th><td>{made.masked}</td></tr>
          <tr><th scope="row">With a box shadow</th><td>{made.boxShadows}</td></tr>
          <tr><th scope="row">SVG shapes</th><td>{made.shapes}</td></tr>
          <tr><th scope="row">Turbulence and displacement passes</th><td>{made.turbulence}</td></tr>
          <tr><th scope="row">Blur passes</th><td>{made.blurs}</td></tr>
        </tbody>
      </table>}

      {/* Who re-rendered, and what it cost them. The desk-wide count below says
          how busy React was; this says who was busy, which is the only form of
          that number anyone can act on. */}
      {!!rendered.length && <table className="desk-perf__table">
        <caption>…and what re-rendered while it happened</caption>
        <thead><tr><th scope="col">What</th><th scope="col">Renders</th><th scope="col">All told</th><th scope="col">Worst</th></tr></thead>
        <tbody>{rendered.map(one => <tr key={one.id} data-slow={one.renders > 40 ? '' : undefined} data-tight={one.renders > 10 && one.renders <= 40 ? '' : undefined}>
          <th scope="row">{one.id}</th><td>{one.renders}</td><td>{one.totalMs}ms</td><td>{one.worstMs}ms</td>
        </tr>)}</tbody>
        <tfoot><tr>
          <th scope="row">Everything</th>
          <td>{rendered.reduce((all, one) => all + one.renders, 0)}</td>
          <td>{rendered.reduce((all, one) => all + one.totalMs, 0).toFixed(1)}ms</td>
          <td>—</td>
        </tr></tfoot>
      </table>}

      {/* One drag, frame by frame. A median hides a step and a worst frame calls
          it a blip; laid out in order it is plainly two different drags. */}
      {series && <div className="desk-perf__series">
        <p className="desk-perf__hint">
          Every frame of one drag of the {series.label.toLowerCase()}, in order — median {series.medianMs}ms,
          worst {series.worstMs}ms. The rule is one frame at sixty a second.
        </p>
        <ol aria-label={`Frame times dragging the ${series.label}`}>
          {series.frames.map((ms, index) => <li
            key={index}
            style={{ '--frame': ms } as React.CSSProperties}
            data-over={ms > 20 ? '' : undefined}
            data-step={series.stepAt === index + 1 ? '' : undefined}
          ><span>{`Frame ${index + 1}: ${ms}ms`}</span></li>)}
        </ol>
        <p className="desk-perf__verdict" data-kind={series.stepAt ? 'attributed' : 'already-fast'}>
          {series.stepAt
            ? `It ran at ${series.beforeMs}ms for the first ${series.stepAt} frames and ${series.afterMs}ms for every one after — the same drag, twice. Something about being moved, rather than about where it ended up, made it dearer and kept it that way. Hold it still for the same length of time to see whether the motion is what did it.`
            : 'Level throughout: no frame of this drag was systematically dearer than the first, so whatever it costs, it costs from the start.'}
        </p>
      </div>}

      {/* Where the frame went, from the browser rather than from us. The one
          number worth reading is the last: it is everything the main thread
          cannot account for, which is the drawing. */}
      {split && <p className="desk-perf__react" data-drawing={split.available && split.frames > 0 && split.drawingMs > split.scriptMs ? '' : undefined}>
        {!split.available
          ? 'This browser does not break a frame down, so what follows is React’s own count and nothing else.'
          : split.frames === 0
            ? 'Not one frame of that run had enough work on the main thread for the browser to mention it. Whatever those frames cost, none of it was script, style or layout — all of it was the drawing.'
            : <>Of an average reported frame ({split.frameMs}ms): <strong>{split.scriptMs}ms</strong> of script,
              <strong> {split.styleLayoutMs}ms</strong> of style and layout ({split.forcedMs}ms of it forced early by a
              measurement), and <strong> {split.drawingMs}ms</strong> left over, which is paint, raster and composite.</>}
      </p>}

      <p className="desk-perf__react">
        React, over the same run: <strong>{commits.count}</strong> commits,
        <strong> {commits.totalMs.toFixed(1)}ms</strong> all told,
        worst <strong>{commits.worstMs.toFixed(1)}ms</strong>.
      </p>
    </aside>
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

/**
 * The same bench with the desk cleared: the room, the lamp, and one thing.
 *
 * It is here because the full desk cannot answer “is it this object, or is it
 * this object on a desk with fourteen others”. Everything is drawn exactly as it
 * is in the composition — same size, same place, same camera — so the two
 * readings are comparable, and the difference between them is the rest of the
 * desk. Change which thing is on it from the controls.
 */
export const OneThing_: StoryObj<typeof meta> = {
  name: 'One thing on the desk',
  args: { only: 'dossier' },
  argTypes: { only: { control: 'select', options: DESK_OBJECTS.map(object => object.id), name: 'The one thing' } },
};
