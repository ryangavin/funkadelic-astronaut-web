/*
  How big each thing on the desk really is, kept apart from how it is drawn so
  the Node tests can read it.

  - `widthMm` is the width of the whole drawing, in millimetres: the artwork
    box, cord and empty room included, not necessarily the thing's footprint.
  - `ratio` is the drawing's depth over its width.
  - `heightMm` is how tall the thing stands; its shadow is cast from this.
  - `solid`, for a thing drawn standing in a Solid, is the Solid's height as a
    fraction of the drawing's width, and where the thing meets the desk.

  A Solid and the shadow have to agree on the height, or the thing fights its
  own shadow: `solid.height × widthMm = heightMm`.
*/
import { PAPER_MM } from '../../geometry/physicalScale.ts';
import { DESK_PHONE_DEPTH, DESK_PHONE_FOOT, DESK_PHONE_HEIGHT, DESK_PHONE_WIDTH, SET_BODY_HEIGHT } from '../../components/3D/DeskPhone/size.ts';
import { LABEL_BRO_FOOT, LABEL_BRO_HEIGHT, LABEL_BRO_RATIO, LABEL_BRO_TALL, LABEL_BRO_WIDTH_MM } from '../../components/3D/LabelBro/size.ts';
import { MUG_DRAWING_MM, MUG_FOOT, MUG_HEIGHT, MUG_TALL } from '../../components/3D/Mug/size.ts';
import { ROLODEX_RATIO, ROLODEX_SOLID, ROLODEX_TALL, ROLODEX_WIDTH_MM } from '../../components/3D/Rolodex/size.ts';

export type DeskObjectSolid = { height: number; foot: { x: number; y: number }; localCoordinates?: boolean };
export type DeskObjectSize = { widthMm: number; ratio: number; heightMm: number; solid?: DeskObjectSolid };

const SHEET: DeskObjectSize = { widthMm: PAPER_MM.width, ratio: PAPER_MM.height / PAPER_MM.width, heightMm: .2 };

export const DESK_OBJECT_SIZES = {
  sitePlan: SHEET,
  poster: SHEET,
  setTimes: SHEET,
  contract: SHEET,
  dossier: { widthMm: 482, ratio: 915 / 1440, heightMm: 1 },
  clock: { widthMm: 90, ratio: 560 / 720, heightMm: 15 },
  cradle: { widthMm: 120, ratio: 600 / 720, heightMm: 90 },
  mug: { widthMm: MUG_DRAWING_MM, ratio: 1, heightMm: MUG_TALL, solid: { height: MUG_HEIGHT, foot: MUG_FOOT } },
  rolodex: { widthMm: ROLODEX_WIDTH_MM, ratio: ROLODEX_RATIO, heightMm: ROLODEX_TALL, solid: ROLODEX_SOLID },
  handheld: { widthMm: 170, ratio: 327 / 720, heightMm: 23 },
  labelBro: { widthMm: LABEL_BRO_WIDTH_MM, ratio: LABEL_BRO_RATIO, heightMm: LABEL_BRO_TALL, solid: { localCoordinates: true, height: LABEL_BRO_HEIGHT, foot: LABEL_BRO_FOOT } },
  pen: { widthMm: 149, ratio: 60 / 720, heightMm: 7 },
  walkman: { widthMm: 112, ratio: 590 / 720, heightMm: 30 },
  phone: { widthMm: DESK_PHONE_WIDTH, ratio: DESK_PHONE_DEPTH / DESK_PHONE_WIDTH, heightMm: SET_BODY_HEIGHT, solid: { height: DESK_PHONE_HEIGHT, foot: DESK_PHONE_FOOT } },
} satisfies Record<string, DeskObjectSize>;

export type DeskObjectId = keyof typeof DESK_OBJECT_SIZES;
