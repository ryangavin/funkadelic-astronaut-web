import { DESK_OBJECTS } from './DeskObjects';
import type { PerspectiveDeskProps } from './PerspectiveDesk';
import type { Outlook } from '../../foundations/Room/DeskRoom';
import { Shopfront } from '../../components/3D/Outlook/Shopfront';
import { Street, StreetFacade, STREET } from '../../components/3D/Outlook/Street';
import { Backstage, BACKSTAGE_DEPTH, CabinSlider, MarqueeSide } from '../../components/3D/Outlook/Backstage';
import { CableCoil, CaseLid, FloorBox, FloorProps, TapeRoll } from '../../components/3D/FloorProps/FloorProps';

/**
 * Where the promoter's desk is, other than in the room it is in now.
 *
 * A setting here is not a backdrop. It is the same three real things the room
 * is always made of — a floor, a wall and the surface the work is done on —
 * measured differently, because a production cabin and a café window are not
 * the same size as an office and are not made of the same stuff. So a setting
 * is a bundle of millimetres and materials, handed to the same PerspectiveDesk
 * the main desk uses, with the same cast of objects on it. Nothing here draws
 * anything. Nothing here is a label explaining what to click, and nothing here
 * is a prop with no height: a thing either stands on the surface and throws a
 * shadow from the lamp like everything else, or it is not in the room.
 *
 * Both settings carry the same cast, because the question a setting asks is
 * about the place and not about the roster, and two rooms holding different
 * things cannot be compared.
 */

/** The cast both settings are judged with: the band's two devices, its dossier, and the promoter's paperwork. */
const SETTING_CAST = ['dossier', 'walkman', 'handheld', 'sitePlan', 'setTimes', 'contract', 'pen', 'labelBro', 'mug'] as const;

const missing = SETTING_CAST.filter(id => !DESK_OBJECTS.some(object => object.id === id));
if (missing.length) throw new Error(`Setting cast names objects the desk does not have: ${missing.join(', ')}`);

/**
 * A festival production cabin, the morning of load-in.
 *
 * The surface is not a desk: it is a 1220 by 760 folding table, the trestle
 * every production office on every site has four of, at 740 off the floor with
 * its top in a folded steel channel. The top is a printed woodgrain film, so
 * its figure repeats and it has no pores — which is the whole difference
 * between a table you were given and a desk you own, and the reason this room
 * feels temporary.
 *
 * Behind it the cabin is lined in melamine-faced sheet, 1220 wide, laid
 * squarely with a shadow gap between one sheet and the next, and the wall stops
 * at 2100 because a cabin is lower than a room — which you feel before you can
 * say why. The window is wide and shallow and sits just above the table, the
 * way a sliding cabin window does. Underfoot is grey vinyl plank.
 *
 * The eye is somebody standing over the table rather than sitting at it,
 * because in a production office nobody sits down.
 */
/* The cabin's one window: a slider over the far end of the table, onto the trackway behind the stage. */
const CABIN_WINDOW: Outlook = {
  opening: { widthMm: 1200, sillMm: 880, headMm: 1580, offsetMm: -150 },
  glazing: <CabinSlider widthMm={1200} heightMm={700} />,
  ground: <Backstage widthMm={30000} />,
  groundWidthMm: 30000,
  groundDepthMm: BACKSTAGE_DEPTH,
  facade: <MarqueeSide widthMm={30000} heightMm={9000} />,
  facadeHeightMm: 9000,
};

/*
  What a production cabin keeps on its floor, which is everything that has
  nowhere else to go: the band's flight cases against the wall either side of
  the table, a guitar case laid down, a slab of water, the spare feeds coiled
  where they were dropped, and gaffer everywhere. In millimetres from the
  middle of the wall and out from it; the table's ends are at ±610.
*/
const CABIN_FLOOR = <FloorProps>
  <CableCoil x={-1150} y={1350} color="#e0772a" rotation={20} />
  <CableCoil x={950} y={1450} radius={190} rotation={-40} />
  <TapeRoll x={-760} y={1130} />
  <TapeRoll x={780} y={1120} color="#e5d23c" />
  <TapeRoll x={850} y={1180} color="#2d5bbd" radius={50} />
  {/* Against the wall on the left: the FOH rack with the in-ear case on it, and the merch trunk. */}
  <FloorBox x={-1000} y={300} width={560} depth={520} height={600} side="#1b1b1b"><CaseLid width={560} depth={520} stencil="FOH" tape="#e5d23c" tapeText="RACK 2" /></FloorBox>
  <FloorBox x={-1010} y={310} width={420} depth={360} height={260} base={600} rotation={-7} side="#1f2b44"><CaseLid width={420} depth={360} ply="#2b3f6b" stencil="IEM" /></FloorBox>
  <FloorBox x={-1000} y={870} width={560} depth={460} height={420} rotation={4} side="#5d1f1a"><CaseLid width={560} depth={460} ply="#7a2a22" stencil="F.A." tape="#f4f1e8" tapeText="MERCH" /></FloorBox>
  <FloorBox x={-760} y={1400} width={390} depth={265} height={250} rotation={12} side="#cfd8dc"><g><rect width={390} height={265} fill="#e4ecef" />{Array.from({ length: 24 }, (_, i) => <circle key={i} cx={33 + (i % 6) * 65} cy={33 + Math.floor(i / 6) * 66} r={27} fill="#8fc3e6" stroke="#2c6fb0" strokeWidth="6" />)}<rect width={390} height={265} fill="none" stroke="#9eb0b8" strokeWidth="10" /></g></FloorBox>
  {/* On the right: the backline trunk along the wall, a grey drum-hardware case, and a guitar laid down in front. */}
  <FloorBox x={1000} y={330} width={1050} depth={560} height={560} rotation={90} side="#161616"><CaseLid width={1050} depth={560} stencil="FUNKADELIC ASTRONAUT" tape="#e0772a" tapeText="BACKLINE 03" /></FloorBox>
  <FloorBox x={1000} y={960} width={520} depth={420} height={380} rotation={-5} side="#4a4d50"><CaseLid width={520} depth={420} ply="#6b6f73" stencil="HW" tape="#f4f1e8" tapeText="DRUMS" /></FloorBox>
  <FloorBox x={950} y={1500} width={1100} depth={400} height={150} rotation={72} side="#2a1c14"><g><rect width={1100} height={400} rx={190} fill="#2e211a" /><rect x={30} y={30} width={1040} height={340} rx={170} fill="none" stroke="#5a4636" strokeWidth="14" />{[280, 820].map(x => <rect key={x} x={x - 40} y={10} width={80} height={46} rx={10} fill="#bfb08a" />)}<rect x={500} y={150} width={110} height={100} rx={20} fill="#1a120d" /><rect x={120} y={110} width={220} height={130} rx={12} fill="#e5d23c" transform="rotate(-8 230 175)" /></g></FloorBox>
</FloorProps>;

export const PRODUCTION_TRAILER: PerspectiveDeskProps = {
  only: SETTING_CAST,
  showSettings: false,

  /* The trestle: 1220 x 760, 740 off the floor, in its steel channel. */
  deskWidthMm: 1220,
  deskDepthMm: 760,
  deskHeightMm: 740,
  deskEdgeMm: 26,
  wood: 'walnut',
  deskSurface: 'laminate',

  /* Standing over it. */
  eyeHeightMm: 4500,
  viewerSetbackMm: 1330,
  headTiltDegrees: 76,
  horizontalFieldOfViewDegrees: 27,

  /* The cabin: sheet lining, a low ceiling, grey plank, and a long shallow window over the table. */
  wall: 'panel',
  floor: 'limed',
  outlook: CABIN_WINDOW,
  floorContent: CABIN_FLOOR,
  daylight: 0.25,
  wallHeightMm: 4000,
  roomSpanMm: 6000,
  windowHeightMm: 900,
  windowSillHeightMm: 1900,
  roomBlur: 0.6,
  roomDim: 0.12,
  deskShare: 0.36,
  roomLip: 45,

  /* One clip-on over the far end, which is all the light a cabin has that isn't fluorescent. */
  lampX: 430,
  lampY: 55,
  lampWidth: 480,
  lampEnamel: 'green',
  lampLowerAngle: -142.6818247177271,
  lampUpperAngle: 110.41274403236815,
  shadowStrength: 0.34,

  /*
    Laid out the way a table is worked at rather than arranged: the dossier
    landed where it was put down at the left, the two devices in the middle
    where the hands are, the paperwork gathered to the right under the lamp,
    and the mug off the near right corner where it cannot be knocked into
    anything that matters.
  */
  objectPlacements: {
    dossier: { x: 40, y: 470, rotation: -3 },
    walkman: { x: 870, y: 190, rotation: -7 },
    handheld: { x: 920, y: 350, rotation: 4 },
    sitePlan: { x: 560, y: 150, rotation: -9 },
    setTimes: { x: 870, y: 480, rotation: 5 },
    contract: { x: 1170, y: 150, rotation: 3 },
    pen: { x: 1190, y: 590, rotation: 16 },
    labelBro: { x: 630, y: 630, rotation: -6 },
    mug: { x: 1240, y: 700, rotation: -14 },
  },
};

/**
 * A café window counter, mid-morning.
 *
 * The surface is a 1500 by 520 oak bar along the glass, at 1050 — standing
 * height, which is what a window counter is, so the eye is perched on a stool
 * rather than sitting at a desk, closer in and looking down harder. That
 * shallow depth is the whole character of the place: everything has to be
 * within a forearm of everything else, papers overlap because there is nowhere
 * for them not to, and the band's dossier takes up a third of the counter.
 *
 * Behind it is 200 by 100 glazed tile in running bond on a thin grout — the
 * wall of every café that has ever had a tiled wall — under a window that
 * starts just above the counter and runs up most of the room.
 *
 * The lamp is the one thing the room's light forces: every shadow here is
 * thrown by it, so it stands at the far end of the counter where a café would
 * actually put one, rather than being pretended away.
 */
/*
  The café's window: the whole wall behind the counter is glass, from a hand
  over the counter to well above the door head, and what it looks onto is a
  high street — pavement, kerb, a zebra across the road and the shops
  opposite. Seen from the stool it is mostly the street's ground, from above.
*/
const CAFE_WINDOW: Outlook = {
  opening: { widthMm: 3400, sillMm: 1090, headMm: 2900 },
  glazing: <Shopfront widthMm={3400} heightMm={1810} transomMm={1400} />,
  ground: <Street widthMm={44000} />,
  groundWidthMm: 44000,
  groundDepthMm: STREET.facade,
  facade: <StreetFacade widthMm={44000} heightMm={16000} />,
  facadeHeightMm: 16000,
};

export const COFFEE_COUNTER: PerspectiveDeskProps = {
  only: SETTING_CAST,
  showSettings: false,

  /* The bar along the glass: 1500 x 520, 1050 off the floor, a solid oak top with a thick rolled edge. */
  deskWidthMm: 1800,
  deskDepthMm: 620,
  deskHeightMm: 1050,
  deskEdgeMm: 40,
  wood: 'oak',
  deskSurface: 'timber',

  /* Perched on a stool, looking down at it. */
  eyeHeightMm: 3300,
  viewerSetbackMm: 814,
  headTiltDegrees: 76,
  horizontalFieldOfViewDegrees: 46,

  /* Tile behind, boards below, and the window starting just over the counter. */
  wall: 'glaze',
  floor: 'walnut',
  outlook: CAFE_WINDOW,
  daylight: 0.45,
  wallHeightMm: 3400,
  roomSpanMm: 9000,
  windowHeightMm: 900,
  windowSillHeightMm: 2100,
  roomBlur: 0.9,
  roomDim: 0.14,
  deskShare: 0.23,
  roomLip: 35,

  lampX: 640,
  lampY: 165,
  lampWidth: 380,
  lampEnamel: 'mustard',
  lampLowerAngle: -142.6818247177271,
  lampUpperAngle: 110.41274403236815,
  shadowStrength: 0.3,

  /*
    Nothing here has room to be tidy. The dossier claims the left third, the
    devices sit in the middle within reach, the paperwork is stacked at the
    right rather than spread, and the mug is where a mug on a window counter
    is: at the near right, on the paperwork's corner.
  */
  objectPlacements: {
    dossier: { x: 380, y: 330, rotation: -4 },
    walkman: { x: 1060, y: 110, rotation: 6 },
    handheld: { x: 1330, y: 200, rotation: -3 },
    sitePlan: { x: 990, y: 330, rotation: -9 },
    setTimes: { x: 1370, y: 360, rotation: 7 },
    contract: { x: 1720, y: 280, rotation: 4 },
    pen: { x: 1140, y: 690, rotation: 12 },
    labelBro: { x: 150, y: 430, rotation: -8 },
    mug: { x: 1800, y: 500, rotation: -12 },
  },
};
