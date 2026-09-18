/** Physical dimensions are millimetres. Artwork coordinates stay local to each
 * drawing; CSS viewport fitting/preview zoom must never alter this conversion. */
export const DESK_MM = { width: 1200, depth: 800, height: 750 } as const;
export const UNITS_PER_MM = 1.2;
export const mmToUnits = (millimetres: number) => millimetres * UNITS_PER_MM;
export const unitsToMm = (units: number) => units / UNITS_PER_MM;
export const DESK_SIZE = {
  width: mmToUnits(DESK_MM.width),
  depth: mmToUnits(DESK_MM.depth),
  height: mmToUnits(DESK_MM.height),
} as const;
/** Full lamp artwork bounds, including its articulated arm; not its base footprint. */
export const LAMP_MM = { artworkWidth: 480, bulbHeight: 350 } as const;
export const LAMP_WIDTH = mmToUnits(LAMP_MM.artworkWidth);
export const LAMP_HEIGHT = mmToUnits(LAMP_MM.bulbHeight);
/** User-approved rounded paper dimensions, portrait (not exact US Letter). */
export const PAPER_MM = { width: 220, height: 280 } as const;
