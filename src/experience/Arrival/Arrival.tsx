import type React from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PerspectiveDesk, type PerspectiveDeskProps } from '../Desk/PerspectiveDesk';
import { DeskBridge, type DeskControl } from './DeskBridge';
import { ARRIVAL_LINKS, type ArrivalLinkId } from './links';
import { SiteBar } from './SiteBar';
import { TitleScreen } from './TitleScreen';
import { WallHeader } from './WallHeader';
import './Arrival.css';

export type ArrivalHeader = 'bar' | 'wall' | 'none';
type Phase = 'title' | 'entering' | 'desk';

export type ArrivalProps = {
  /** How the name and the links stay on screen over the desk. */
  header?: ArrivalHeader;
  /** Whether the visit starts on the title, or straight on the desk. */
  title?: boolean;
  /** The desk as a composition has it arranged. */
  desk?: PerspectiveDeskProps;
};

/*
  The desk is the dearest thing on the page to render, and nothing up here
  changes it: the header lighting up a link, or the title going away, must not
  draw it again. Held, with props that keep their identity, it renders once.
*/
const StillDesk = memo(PerspectiveDesk);

/** How much nearer the desk is while the title is up; going in is this closing to nothing. */
const DESK_NEAR = 1.12;
const ENTER_MS = 1150;

/** A box on the desk as it will be once the desk has come back to its own size, from how it looks while it is near. */
function settled(box: DOMRect, desk: DOMRect) {
  const cx = desk.left + desk.width / 2, cy = desk.top + desk.height / 2;
  return { x: cx + (box.left + box.width / 2 - cx) / DESK_NEAR, y: cy + (box.top + box.height / 2 - cy) / DESK_NEAR, width: box.width / DESK_NEAR };
}

/**
 * The band's site as a whole: a title that says whose it is, a header that
 * keeps saying so, and the promoter's desk to play with underneath.
 *
 * Going in is one move. The flyer on the title is put down on the desk where
 * the same flyer lies, the name goes up into the header, and the desk, which
 * was held close behind the title, settles back to where the eye stands.
 */
export function Arrival({ header = 'bar', title = true, desk }: ArrivalProps) {
  const [phase, setPhase] = useState<Phase>(title ? 'title' : 'desk');
  useEffect(() => { setPhase(title ? 'title' : 'desk'); }, [title]);
  const [control, setControl] = useState<DeskControl | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const titleScreen = useRef<HTMLElement>(null);
  const bridge = useMemo(() => <DeskBridge onChange={setControl} />, []);
  const deskProps = useMemo(() => ({ ...desk, showSettings: false, showCamera: false }), [desk]);

  const enter = useCallback(() => {
    if (phase !== 'title') return;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const page = root.current, screen = titleScreen.current;
    if (still || !page || !screen) return setPhase('desk');
    const set = (element: HTMLElement, name: string, value: string) => element.style.setProperty(name, value);

    /* The flyer goes down onto the one lying on the desk. */
    const flyer = screen.querySelector<HTMLElement>('.title-screen__flyer');
    const poster = page.querySelector<HTMLElement>('[role="group"][aria-label="Band poster"]');
    const deskBox = page.querySelector<HTMLElement>('.arrival__desk')?.getBoundingClientRect();
    if (flyer && poster && deskBox) {
      const from = flyer.getBoundingClientRect();
      const to = settled(poster.getBoundingClientRect(), deskBox);
      set(flyer, '--fly-x', `${to.x - (from.left + from.width / 2)}px`);
      set(flyer, '--fly-y', `${to.y - (from.top + from.height / 2)}px`);
      /* The flyer is tilted on the title; what is measured is its bounding box, and the sheet is narrower than that. */
      const turned = Math.cos(5 * Math.PI / 180) + (from.height / from.width) * Math.sin(5 * Math.PI / 180);
      set(flyer, '--fly-scale', `${(to.width / from.width) * turned * 0.9}`);
    }

    /* And the name goes up to wherever the header prints it. */
    const name = screen.querySelector<HTMLElement>('.title-screen__name');
    const target = page.querySelector<HTMLElement>('.site-bar__name, .wall-banner');
    if (name && target) {
      const from = name.getBoundingClientRect(), to = target.getBoundingClientRect();
      set(name, '--name-x', `${to.left - from.left}px`);
      set(name, '--name-y', `${to.top - from.top}px`);
      set(name, '--name-scale', `${Math.min(to.width / from.width, to.height / from.height)}`);
    }

    setPhase('entering');
    window.setTimeout(() => setPhase('desk'), ENTER_MS);
  }, [phase]);

  const onLink = useCallback((id: ArrivalLinkId) => {
    const link = ARRIVAL_LINKS.find(each => each.id === id);
    if (link?.object) {
      if (control?.held === link.object) return control.release();
      return control?.inspect(link.object);
    }
    if (id === 'press') {
      control?.release();
      root.current?.querySelector<HTMLButtonElement>('button[aria-label="Open the press package"]')?.click();
    }
  }, [control]);

  const active = ARRIVAL_LINKS.find(link => link.object && link.object === control?.held)?.id;
  const home = title ? () => { control?.release(); setPhase('title'); } : undefined;

  return (
    <div ref={root} className="arrival" data-header={header} data-phase={phase} style={{ '--desk-near': DESK_NEAR, '--enter-ms': `${ENTER_MS}ms` } as React.CSSProperties}>
      {header !== 'none' && <div className="arrival__header" inert={phase === 'title' ? true : undefined}>
        {header === 'bar' ? <SiteBar active={active} onLink={onLink} onHome={home} /> : <WallHeader active={active} onLink={onLink} onHome={home} />}
      </div>}
      <div className="arrival__desk" inert={phase === 'title' ? true : undefined}>
        <StillDesk {...deskProps}>{bridge}</StillDesk>
      </div>
      {phase !== 'desk' && <TitleScreen ref={titleScreen} className="arrival__title" onEnter={enter} />}
    </div>
  );
}
