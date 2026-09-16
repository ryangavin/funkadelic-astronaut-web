import type React from 'react';
import { useState } from 'react';
import { Spill, Spilled } from '../../behaviors/Spill/Spill';
import { Weathered } from '../../behaviors/Weathered/Weathered';
import { AdmissionTicket, TOUR_ADMISSION_TICKET_PROPS } from '../../components/AdmissionTicket/AdmissionTicket';
import { DESK_WIDTH, Desk, type DeskWood } from '../../components/Desk/Desk';
import { GuitarPick } from '../../components/GuitarPick/GuitarPick';
import { Handheld } from '../../components/Handheld/Handheld';
import { CoffeeRing } from '../../components/Mug/CoffeeRing';
import { Mug } from '../../components/Mug/Mug';
import { Pen } from '../../components/Pen/Pen';
import { Pin } from '../../components/Pin/Pin';
import { Polaroid } from '../../components/Polaroid/Polaroid';
import { Stage, type StageProps } from '../../components/Stage/Stage';
import { SocialSticker } from '../../components/Sticker/SocialSticker';
import { StickyNote } from '../../components/StickyNote/StickyNote';
import { TourPass } from '../../components/TourPass/TourPass';
import { NYACK_FESTIVAL_TOUR_PASS_PROPS } from '../../components/TourPass/TourPass.data';
import { Cassette } from '../../components/Walkman/Cassette';
import { Walkman } from '../../components/Walkman/Walkman';
import { Wordmark } from '../../components/Wordmark/Wordmark';
import { Handbill } from '../../experiments/BandIntro/Handbill';
import { BAND_HANDBILL_BACK, BAND_HANDBILL_FRONT } from '../../experiments/BandIntro/Handbill.band';
import { MiniZine } from '../../experiments/BandIntro/MiniZine';
import { BAND_ZINE_PAGES } from '../../experiments/BandIntro/MiniZine.band';
import { Distressed } from '../../foundations/Distressed/Distressed';
import { BAND_PACKET, BandDossier, DEMO_TAPE, LIVE_SET } from '../../sections/BandDossier/BandDossier';
import { LISTEN_INKS, LISTEN_LINKS, SOCIAL_LINKS } from '../Home/Home';
import '../../styles/fonts.css';
import './PromoterDesk.css';

/** The desk's design size: 1440 across, and deep enough for the spill. */
export const DESK_HEIGHT = 1200;

/** The folder's proportions, from the Folder component: two leaves of 720 in 1440, 915 tall. */
const FOLDER_RATIO = 915 / 1440;

/**
 * Where everything lies, in desk units from the top left, with each thing's
 * width and tilt. The spilled things are given where they land; packed, they
 * gather in the closed folder. Every value is also a prop, so the story's
 * controls can nudge the composition.
 */
export const DESK_LAYOUT = {
  dossierX: 360,
  dossierY: 40,
  dossierWidth: 840,
  dossierRotation: -1.5,
  walkmanX: 40,
  walkmanY: 330,
  walkmanWidth: 300,
  walkmanRotation: -8,
  tapeX: 100,
  tapeY: 612,
  tapeWidth: 170,
  tapeRotation: 14,
  handheldX: 50,
  handheldY: 790,
  handheldWidth: 440,
  handheldRotation: 2.5,
  mugX: 1250,
  mugY: 30,
  mugWidth: 170,
  mugRotation: 34,
  ringX: 1216,
  ringY: 196,
  ringWidth: 160,
  ringRotation: 20,
  sheetX: 470,
  sheetY: 250,
  sheetWidth: 400,
  sheetRotation: -3.5,
  ballpointX: 1250,
  ballpointY: 680,
  ballpointWidth: 240,
  ballpointRotation: 75,
  markerX: 40,
  markerY: 206,
  markerWidth: 230,
  markerRotation: -15,
  pickX: 300,
  pickY: 706,
  pickWidth: 44,
  pickRotation: 40,
  socialsX: 70,
  socialsY: 1040,
  socialsRotation: 0,
  handbillX: 520,
  handbillY: 760,
  handbillWidth: 250,
  handbillRotation: -8,
  zineX: 760,
  zineY: 640,
  zineWidth: 440,
  zineRotation: 3,
  ticketX: 820,
  ticketY: 1010,
  ticketWidth: 420,
  ticketRotation: 2,
  passX: 1180,
  passY: 780,
  passWidth: 250,
  passRotation: 7,
  printX: 1215,
  printY: 380,
  printWidth: 200,
  printRotation: 8,
};
export type DeskLayout = typeof DESK_LAYOUT;

export type PromoterDeskProps = Partial<DeskLayout> &
  Pick<StageProps, 'minScale' | 'maxScale'> & {
    /** Whether the press package starts open. Clicking it opens and closes it. */
    open?: boolean;
    /** Called when the visitor opens or closes the package. */
    onToggle?: (open: boolean) => void;
    wood?: DeskWood;
    className?: string;
    style?: React.CSSProperties;
  };

/** The tab on the folder's edge, from the Folder component: 9% down the leaf, 52% of its height, 58 units wide, set 44 out past the edge. */
const TAB = { top: 9, height: 52, width: 58, out: 44 };

/** The promoter's running order for the day, a draft off the office printer, with the band's slot pencilled in. */
function RunSheet({ rotation }: { rotation: number }) {
  return (
    <Weathered className="run-sheet" grain wear={0.25} style={{ '--run-sheet-rotation': `${rotation}deg` } as React.CSSProperties}>
      <div className="run-sheet__page">
        <Distressed className="run-sheet__stamp">
          <span className="run-sheet__stamp-ink">Draft</span>
        </Distressed>
        <h2 className="run-sheet__title">Nyack Neighborhood Music &amp; Arts Festival</h2>
        <p className="run-sheet__meta">Main stage · Saturday, September 26, 2026 · running order v3</p>
        <table className="run-sheet__slots">
          <tbody>
            <tr>
              <th scope="row">2:00 pm</th>
              <td>Opener — tbd</td>
            </tr>
            <tr>
              <th scope="row">3:15 pm</th>
              <td>tbd (hold for the school band?)</td>
            </tr>
            <tr>
              <th scope="row">4:30 pm</th>
              <td>Changeover · DJ</td>
            </tr>
            <tr className="run-sheet__slot--band">
              <th scope="row">6:00 pm</th>
              <td>Funkadelic Astronaut · 45 min</td>
            </tr>
            <tr>
              <th scope="row">7:30 pm</th>
              <td>Headliner — tbd</td>
            </tr>
            <tr>
              <th scope="row">9:00 pm</th>
              <td>Curfew</td>
            </tr>
          </tbody>
        </table>
        <span className="run-sheet__pen" aria-hidden="true">
          confirm!! → call Sam
        </span>
        <span className="run-sheet__circle" aria-hidden="true" />
      </div>
    </Weathered>
  );
}

/**
 * The promoter's desk, the way a visitor first sees the site: a wooden top
 * with the band's press package lying closed on it, their name across the
 * cover, beside the promoter's own things: a cassette player with the demo
 * in it, a games console with the live set on the disc, the running order for
 * the day, coffee. Click the package and it swings open, the members' pile
 * and the one-sheet in the well, and the loose things inside spill out across
 * the desk: the handbill, the zine, the tour ticket, a pass and a print, each
 * of them the real thing to pick up. Click the tab to put it all back. Laid
 * out at 1440 by 1200 on a Stage, so it scales as one piece.
 */
export function PromoterDesk({ open: initiallyOpen = false, onToggle, wood = 'walnut', minScale, maxScale, className = '', style, ...pins }: PromoterDeskProps) {
  const [open, setOpen] = useState(initiallyOpen);
  const at: DeskLayout = { ...DESK_LAYOUT, ...Object.fromEntries(Object.entries(pins).filter(([, value]) => value !== undefined)) };
  const toggle = () => {
    setOpen(!open);
    onToggle?.(!open);
  };

  /* The well is the folder's right half, and the spilled things are placed in it, so
     their desk coordinates are taken from its corner, turned back by the folder's tilt,
     which the well's frame shares. One desk unit in folder units. */
  const wellX = at.dossierX + at.dossierWidth / 2;
  const wellY = at.dossierY;
  const folderHeight = at.dossierWidth * FOLDER_RATIO;
  const centreX = at.dossierX + at.dossierWidth / 2;
  const centreY = at.dossierY + folderHeight / 2;
  const tilt = (at.dossierRotation * Math.PI) / 180;
  const inWell = (x: number, y: number, rotation: number) => {
    const dx = x - centreX;
    const dy = y - centreY;
    return {
      x: centreX + dx * Math.cos(tilt) + dy * Math.sin(tilt) - wellX,
      y: centreY - dx * Math.sin(tilt) + dy * Math.cos(tilt) - wellY,
      rotation: rotation - at.dossierRotation,
    };
  };
  const deskUnit = `calc(var(--folder-unit) * ${DESK_WIDTH / at.dossierWidth})`;

  /* What is stuck to the outside of the cover: the band's name on two strips, a typed
     label, the streaming stickers, the promoter's note to themself, and a coffee ring. */
  const cover = (
    <div className="promoter-desk__cover">
      <div className="promoter-desk__brand">
        <Wordmark fontSize={52} letterSpacing="0.05em" outlineWidth={2} shadowX={3} shadowY={3} paddingX={14} paddingY={4} jitter>
          FUNKADELIC
        </Wordmark>
        <Wordmark fontSize={46} letterSpacing="0.05em" outlineWidth={2} shadowX={3} shadowY={3} paddingX={14} paddingY={4} inkColor="#639ec8" jitter>
          ASTRONAUT
        </Wordmark>
      </div>
      <span className="promoter-desk__typed">Press kit · fall 2026</span>
      <div className="promoter-desk__streams">
        {LISTEN_LINKS.map(({ platform, href, label }, index) => (
          <SocialSticker key={platform} platform={platform} href={href} label={label} ink={LISTEN_INKS[platform]} size={40} rotation={index % 2 ? 5 : -6} target="_blank" rel="noreferrer" />
        ))}
      </div>
      <div className="promoter-desk__note">
        <StickyNote color="canary" rotation={4} size={80}>
          <p>Sept 26 — the 6pm slot?</p>
          <p>Listen to the tape!!</p>
        </StickyNote>
      </div>
      <div className="promoter-desk__ring">
        <CoffeeRing strength={0.35} rotation={-30} />
      </div>
    </div>
  );

  return (
    <Stage className={`promoter-desk-stage ${className}`} style={style} height={DESK_HEIGHT} minScale={minScale} maxScale={maxScale}>
      <Desk className="promoter-desk" wood={wood} height={DESK_HEIGHT} data-open={open ? 'true' : 'false'}>
        {/* Stuck to the desk itself, so they stay reachable whatever lies on top. */}
        <nav aria-label="Socials" className="promoter-desk__socials">
          <Pin x={at.socialsX} y={at.socialsY} rotation={at.socialsRotation}>
            <div className="promoter-desk__socials-row">
              {SOCIAL_LINKS.map(({ platform, href, label }, index) => (
                <SocialSticker key={platform} platform={platform} href={href} label={label} ink="purple" size={48} rotation={[-8, 6, -3][index]} peel={index === 1 ? 2.4 : true} target="_blank" rel="noreferrer" />
              ))}
            </div>
          </Pin>
        </nav>

        <Pin x={at.ringX} y={at.ringY} width={at.ringWidth} rotation={at.ringRotation}>
          <CoffeeRing strength={0.55} />
        </Pin>

        <Pin x={at.sheetX} y={at.sheetY} width={at.sheetWidth}>
          <RunSheet rotation={at.sheetRotation} />
        </Pin>

        <Pin x={at.ballpointX} y={at.ballpointY} width={at.ballpointWidth} rotation={at.ballpointRotation}>
          <Pen kind="ballpoint" ink="#2c4fa3" />
        </Pin>
        <Pin x={at.markerX} y={at.markerY} width={at.markerWidth} rotation={at.markerRotation}>
          <Pen kind="marker" ink="#c9432f" />
        </Pin>
        <Pin x={at.pickX} y={at.pickY} width={at.pickWidth} rotation={at.pickRotation}>
          <GuitarPick color="#9275b2" print="FA" />
        </Pin>

        <Pin x={at.mugX} y={at.mugY} width={at.mugWidth}>
          <Mug glaze="#e9e1cf" coffee={0.65} rotation={at.mugRotation} />
        </Pin>

        <Pin x={at.walkmanX} y={at.walkmanY} width={at.walkmanWidth}>
          <Walkman {...DEMO_TAPE} finish="blue" rotation={at.walkmanRotation} />
        </Pin>
        <Pin x={at.tapeX} y={at.tapeY} width={at.tapeWidth} rotation={at.tapeRotation}>
          <div className="promoter-desk__tape">
            <Cassette label="live at the pond" side="B" progress={0.35} />
          </div>
        </Pin>

        <Pin x={at.handheldX} y={at.handheldY} width={at.handheldWidth}>
          <Handheld video={LIVE_SET.video} title="What to Do · live at Barrier Brewing Co." finish="black" rotation={at.handheldRotation} />
        </Pin>

        <Pin x={at.dossierX} y={at.dossierY} width={at.dossierWidth}>
          <div className="promoter-desk__folder" style={{ '--promoter-desk-folder-height': `${folderHeight}px`, '--promoter-desk-folder-unit': `${at.dossierWidth / 1440}px` } as React.CSSProperties}>
            <button
              type="button"
              className="promoter-desk__open"
              aria-expanded={open}
              aria-label={open ? 'Close the press package' : 'Open the Funkadelic Astronaut press package'}
              onClick={toggle}
              style={{ '--tab-top': `${TAB.top}%`, '--tab-height': `${TAB.height}%`, '--tab-width': `${TAB.width}`, '--tab-out': `${TAB.out}` } as React.CSSProperties}
            />
            <BandDossier open={open} tape={null} rotation={at.dossierRotation} sticker={cover} label="Press Package – Funkadelic Astronaut">
              <Spill open={open} from={{ x: at.dossierWidth / 4, y: folderHeight / 2 }} unit={deskUnit}>
                <Spilled {...inWell(at.printX, at.printY, at.printRotation)} width={at.printWidth} order={0}>
                  <Polaroid {...BAND_PACKET.photo} rotation={0} />
                </Spilled>
                <Spilled {...inWell(at.passX, at.passY, at.passRotation)} width={at.passWidth} order={1}>
                  <TourPass {...NYACK_FESTIVAL_TOUR_PASS_PROPS} rotation={0} />
                </Spilled>
                <Spilled {...inWell(at.ticketX, at.ticketY, at.ticketRotation)} width={at.ticketWidth} order={2}>
                  <AdmissionTicket {...TOUR_ADMISSION_TICKET_PROPS} rotation={0} />
                </Spilled>
                <Spilled {...inWell(at.zineX, at.zineY, at.zineRotation)} width={at.zineWidth} order={3}>
                  <MiniZine pages={BAND_ZINE_PAGES} stock="canary" rotation={0} />
                </Spilled>
                <Spilled {...inWell(at.handbillX, at.handbillY, at.handbillRotation)} width={at.handbillWidth} order={4}>
                  <Handbill front={BAND_HANDBILL_FRONT} back={BAND_HANDBILL_BACK} stock="goldenrod" spot="purple" rotation={0} />
                </Spilled>
              </Spill>
            </BandDossier>
          </div>
        </Pin>

        <p className="promoter-desk__status" role="status" aria-live="polite" aria-label="Press package">
          {open
            ? 'The press package is open. The members’ cards and the one-sheet are in the folder; the handbill, the zine, the tour ticket, a pass and a print are out on the desk.'
            : 'The Funkadelic Astronaut press package is closed on the desk.'}
        </p>
      </Desk>
    </Stage>
  );
}
