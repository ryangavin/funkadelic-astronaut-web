import type React from 'react';
import { useRef, useState } from 'react';
import { PERSPECTIVE_DEPTH, PLAN_VIEW, Perspective, STANDING_VIEW, Solid, Standing, surfaceDepth } from '../../behaviors/Perspective/Perspective';
import { Movable, MovableScale, type Place } from '../../behaviors/Movable/Movable';
import { DESK_WIDTH, Desk, type DeskWood } from '../../components/3D/Desk/Desk';
import { DeskClock } from '../../components/3D/DeskClock/DeskClock';
import { DeskLamp, LampLight } from '../../components/3D/DeskLamp/DeskLamp';
import { GuitarPick } from '../../components/3D/GuitarPick/GuitarPick';
import { CoffeeRing } from '../../components/3D/Mug/CoffeeRing';
import { MUG_FOOT, MUG_HEIGHT, Mug } from '../../components/3D/Mug/Mug';
import { NewtonsCradle } from '../../components/3D/NewtonsCradle/NewtonsCradle';
import { Pin } from '../../components/2D/Pin/Pin';
import { Pen } from '../../components/3D/Pen/Pen';
import { Polaroid } from '../../components/2D/Polaroid/Polaroid';
import { Stage, type StageProps } from '../../components/2D/Stage/Stage';
import { SocialSticker } from '../../components/2D/Sticker/SocialSticker';
import { StickyNote } from '../../components/2D/StickyNote/StickyNote';
import { TourPass } from '../../components/2D/TourPass/TourPass';
import { NYACK_FESTIVAL_TOUR_PASS_PROPS } from '../../components/2D/TourPass/TourPass.data';
import { Cassette } from '../../components/3D/Walkman/Cassette';
import { Walkman } from '../../components/3D/Walkman/Walkman';
import { BAND_PACKET, DEMO_TAPE } from '../../sections/BandDossier/BandDossier';
import { SOCIAL_LINKS } from '../Home/Home';
import { SIZES } from './PromoterDesk';
import '../../styles/fonts.css';
import './PerspectiveDesk.css';

/** The frame, 16 x 9, like every other page. */
export const FRAME = { width: DESK_WIDTH, height: 810 } as const;
/**
 * How deep the desk's front edge is, in design pixels. It is a face, not part
 * of the surface, so it is not foreshortened with the top: what you see of it
 * is how far round the front you are looking, and from straight above, nothing.
 */
export const EDGE_FACE = 60;
/** What that face draws at a given view, in design pixels. */
export const edgeAt = (angle: number) => Math.round(EDGE_FACE * Math.sin(((PLAN_VIEW - angle) * Math.PI) / 180));
/** How much of the frame the desktop itself draws, leaving a strip of the room above its far edge. */
const DESK_DRAWN = FRAME.height - edgeAt(STANDING_VIEW) - 57;

/**
 * How deep the desktop is, front to back, in desk units. Depth foreshortens,
 * so to draw {@link DESK_DRAWN} tall at the standing view it has to be deeper
 * than that: about 480 mm of desktop, against the 720 mm across.
 */
export const DESK_DEPTH = surfaceDepth(DESK_DRAWN, { angle: STANDING_VIEW, depth: PERSPECTIVE_DEPTH });

export type ThingId = 'walkman' | 'cassette' | 'mug' | 'clock' | 'cradle' | 'ballpoint' | 'marker' | 'pick' | 'note' | 'print' | 'pass';
/**
 * The things that stand up off the desk rather than lying in it, and have no
 * side of their own drawn yet: they are stood up as cutouts. The mug draws its
 * own side, so it is not one of them.
 */
const STANDS_UP: ThingId[] = ['clock', 'cradle'];

/**
 * Where everything lies, in desk units from the far left and the far edge.
 * Things that stand up are left untilted: a plan drawing stood on its foot
 * cannot be turned about its upright.
 */
export const DESK_LAYOUT = {
  things: {
    mug: { x: 120, y: 80, rotation: -18 },
    clock: { x: 890, y: 120 },
    cradle: { x: 1120, y: 70 },
    walkman: { x: 980, y: 380, rotation: -7 },
    cassette: { x: 1215, y: 560, rotation: 11 },
    print: { x: 95, y: 330, rotation: -6 },
    note: { x: 690, y: 300, rotation: 5 },
    ballpoint: { x: 520, y: 590, rotation: -9 },
    marker: { x: 400, y: 790, rotation: 6 },
    pick: { x: 905, y: 745, rotation: 40 },
    pass: { x: 55, y: 660, rotation: 7 },
  } satisfies Record<ThingId, Place>,
  /** The lamp is clamped to the back edge, out of the frame but for its shade, and its light falls down the desk. */
  lamp: { x: 430, y: -560, rotation: 0 },
  glow: { x: 250, y: -130, rotation: 0 },
  /** The ring where a mug was set down, and the band's stickers stuck to the wood along the front edge. */
  ring: { x: 250, y: 205, rotation: 20 },
  socials: [
    { x: 1120, y: 880, rotation: -8 },
    { x: 1210, y: 874, rotation: 6 },
    { x: 1300, y: 880, rotation: -3 },
  ],
};

/** What lies on what to begin with: first is underneath. Picking a thing up brings it to the top. */
const STACKING: ThingId[] = ['print', 'pass', 'note', 'ballpoint', 'marker', 'pick', 'cassette', 'walkman', 'clock', 'cradle', 'mug'];

const LABELS: Record<ThingId, string> = {
  walkman: 'Walkman',
  cassette: 'Spare cassette',
  mug: 'Mug',
  clock: 'Desk clock',
  cradle: 'Newton’s cradle',
  ballpoint: 'Ballpoint',
  marker: 'Marker',
  pick: 'Guitar pick',
  note: 'Sticky note',
  print: 'Contact print',
  pass: 'Festival pass',
};

export type PerspectiveDeskProps = Pick<StageProps, 'minScale' | 'maxScale'> & {
  /** Where the eye is, in degrees above the desk: 90 is straight down, 60 is standing at it. */
  angle?: number;
  /** How far the eye is from the desk, in desk units. */
  depth?: number;
  /** Whether the desk lamp starts on. Clicking its shade switches it, and the room goes dark without it. */
  lamp?: boolean;
  onLamp?: (on: boolean) => void;
  /** Called whenever the visitor puts something down, with where everything lies. */
  onArrange?: (placement: Record<ThingId, Place>) => void;
  wood?: DeskWood;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * The same desk as the promoter's, from where you would actually be standing:
 * not hanging over it, but in front of it, looking down at sixty degrees. The
 * wall of the office shows above the far edge and the desk's front edge runs
 * along the bottom of the frame.
 *
 * Nothing on the desk is drawn differently. Every component is still the plan
 * view it always was, still placed and measured in desk units; the whole
 * plane is tipped away from its front edge by `Perspective`, and what lies on
 * it foreshortens together. What stands up on a desk — the mug, the clock,
 * the cradle — is stood back up on its foot, and casts its shadow across the
 * wood. Everything can still be dragged: the pointer is mapped back onto the
 * desk, so a thing follows your hand across the surface, which at the back of
 * the desk is a longer trip than the same travel at the front.
 */
export function PerspectiveDesk({ angle = STANDING_VIEW, depth = PERSPECTIVE_DEPTH, lamp: lampOn = true, onLamp, onArrange, wood = 'walnut', minScale, maxScale, className = '', style }: PerspectiveDeskProps) {
  const surface = useRef<HTMLDivElement>(null);
  const [lamp, setLamp] = useState(lampOn);
  const [placed, setPlaced] = useState<Partial<Record<ThingId, Place>>>({});
  const [stacking, setStacking] = useState<ThingId[]>(STACKING);

  const placeOf = (id: ThingId): Place => placed[id] ?? DESK_LAYOUT.things[id];
  const grab = (id: ThingId) => setStacking((order) => (order[order.length - 1] === id ? order : [...order.filter((other) => other !== id), id]));
  const move = (id: ThingId) => (to: Partial<Place>) => setPlaced((all) => ({ ...all, [id]: { ...placeOf(id), ...to } }));
  const drop = () => onArrange?.(Object.fromEntries(STACKING.map((id) => [id, placeOf(id)])) as Record<ThingId, Place>);
  /* Screen pixels per desk unit, for anything dragged while the desk is flat: the front edge is the desk's full width, tilted or not. */
  const scale = () => (surface.current?.querySelector('.desk__top')?.getBoundingClientRect().width ?? DESK_WIDTH) / DESK_WIDTH;

  /** A thing on the desk, stood up on its foot if that is what it does. */
  const thing = (id: ThingId, width: number, child: React.ReactNode, grabBy: 'body' | 'anywhere' = 'body') => (
    <Movable
      {...placeOf(id)}
      width={width}
      z={10 + stacking.indexOf(id)}
      label={LABELS[id]}
      grab={grabBy}
      onMove={move(id)}
      onGrab={() => grab(id)}
      onDrop={drop}
    >
      {STANDS_UP.includes(id) ? <Standing>{child}</Standing> : child}
    </Movable>
  );

  return (
    <div ref={surface} className={`perspective-desk-stage ${className}`} style={{ '--perspective-desk-edge': `${edgeAt(angle)}px`, ...style } as React.CSSProperties}>
      <MovableScale.Provider value={scale}>
        <Stage height={FRAME.height} minScale={minScale} maxScale={maxScale}>
          <div className="perspective-desk__scene" data-wood={wood} data-lamp={lamp ? 'on' : 'off'}>
            <div className="perspective-desk__wall" aria-hidden="true" />
            <div className="perspective-desk__desk">
              <Perspective angle={angle} depth={depth} width={DESK_WIDTH}>
                <Desk className="perspective-desk" wood={wood} height={DESK_DEPTH} light={lamp ? 1 : 0.55} edge={0}>
                  {/* The lamp's pool on the wood, under everything. */}
                  <Pin {...DESK_LAYOUT.glow} width={SIZES.glow * 2}>
                    <LampLight on={lamp} />
                  </Pin>
                  <Pin {...DESK_LAYOUT.ring} width={SIZES.ring}>
                    <CoffeeRing strength={0.5} />
                  </Pin>
                  <nav aria-label="Socials" className="perspective-desk__socials">
                    {SOCIAL_LINKS.map(({ platform, href, label }, index) => (
                      <Pin key={platform} {...DESK_LAYOUT.socials[index]}>
                        <SocialSticker platform={platform} href={href} label={label} size={SIZES.sticker} backing target="_blank" rel="noreferrer" />
                      </Pin>
                    ))}
                  </nav>

                  {thing('print', SIZES.print, <Polaroid {...BAND_PACKET.photo} rotation={0} />)}
                  {thing('pass', SIZES.pass, <TourPass {...NYACK_FESTIVAL_TOUR_PASS_PROPS} rotation={0} />)}
                  {thing('note', SIZES.note, (
                    <StickyNote color="canary" size={80}>
                      <p>Sept 26 — the 6pm slot?</p>
                      <p>Listen to the tape!! — M.C.</p>
                    </StickyNote>
                  ))}
                  {thing('ballpoint', SIZES.ballpoint, <Pen kind="ballpoint" ink="#2c4fa3" />)}
                  {thing('marker', SIZES.marker, <Pen kind="marker" ink="#c9432f" />)}
                  {thing('pick', SIZES.pick, <GuitarPick color="#9275b2" print="FA" />)}
                  {thing('cassette', SIZES.cassette, <Cassette label="live at the pond" side="B" progress={0.35} />)}
                  {thing('walkman', SIZES.walkman, <Walkman {...DEMO_TAPE} finish="blue" />)}
                  {thing('clock', SIZES.clock, <DeskClock finish="black" />)}
                  {thing('cradle', SIZES.cradle, <NewtonsCradle />, 'anywhere')}
                  {thing('mug', SIZES.mug, (
                    <Solid height={MUG_HEIGHT} foot={MUG_FOOT}>
                      <Mug glaze="#e9e1cf" coffee={0.65} rotation={24} />
                    </Solid>
                  ))}

                  {/* Over everything: the room going dark without the lamp, its light on the desk, and the lamp itself. */}
                  <div className="perspective-desk__night" aria-hidden="true" />
                  <Pin {...DESK_LAYOUT.glow} width={SIZES.glow * 2}>
                    <LampLight on={lamp} className="perspective-desk__glow" />
                  </Pin>
                  <div className="perspective-desk__lamp">
                    <Pin {...DESK_LAYOUT.lamp} width={SIZES.lamp}>
                      <DeskLamp
                        on={lamp}
                        enamel="red"
                        onToggle={(next) => {
                          setLamp(next);
                          onLamp?.(next);
                        }}
                      />
                    </Pin>
                  </div>
                </Desk>
              </Perspective>
              {/* The front edge of the desk: a face you see because you are standing, so it stands up out of the surface. */}
              <div className="perspective-desk__edge" aria-hidden="true" />
            </div>
            <p className="perspective-desk__status" role="status" aria-live="polite">
              The promoter’s desk, seen from where you would stand at it. Everything on it can be moved.
            </p>
          </div>
        </Stage>
      </MovableScale.Provider>
    </div>
  );
}
