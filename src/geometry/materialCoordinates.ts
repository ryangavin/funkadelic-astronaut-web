/** Material coordinates are independent of the rectangular crop drawn this frame. */
export type MaterialOrigin = { x: number; y: number };
export const positiveModulo = (value: number, period: number) => ((value % period) + period) % period;
export function materialRows(origin: number, span: number, size: number) {
  const first = Math.floor(origin / size), end = Math.ceil((origin + span) / size);
  return Array.from({ length: Math.max(0, end - first) }, (_, index) => first + index);
}
const floorWobble = (n: number) => positiveModulo(Math.sin(n * 12.9898) * 43758.5453, 1);
export function floorMaterialJoints(row: number, origin: number, length: number, run: number) {
  if (run <= 0) return [];
  const phase = -run * floorWobble(row * 7 + 1);
  const first = Math.ceil((origin - phase) / run), end = Math.ceil((origin + length - phase) / run);
  return Array.from({ length: Math.max(0, end - first) }, (_, index) => phase + (first + index) * run);
}
const wallWobble = (n: number) => positiveModulo(Math.sin(n * 78.233) * 43758.5453, 1);
export function wallMaterialBricks(origin: MaterialOrigin, width: number, height: number, brick: number, course: number, rate: number) {
  const out: { x: number; y: number; worn: number; lean: number; tone: 'thin' | 'thick' }[] = [];
  for (const row of materialRows(origin.y, height, course)) {
    const shift = positiveModulo(row, 2) * brick / 2;
    const first = Math.floor((origin.x + shift) / brick), end = Math.ceil((origin.x + width + shift) / brick);
    for (let col = first; col < end; col++) {
      if (wallWobble(row * 131 + col * 17 + 1) > rate / 100) continue;
      const kind = wallWobble(row * 29 + col * 53 + 2);
      out.push({ x: col * brick - shift, y: row * course, worn: 0.2 + kind * 0.7, lean: wallWobble(row * 7 + col * 11 + 3), tone: kind < 0.34 ? 'thick' : 'thin' });
    }
  }
  return out;
}

/** A fixed-size filtered grain tile: changing the crop never re-seeds or stretches it. */
export function floorGrainTile(row: number, board: number) {
  const seed = positiveModulo(row, 997) + 7;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="${board}" viewBox="0 0 720 ${board}"><defs><filter id="g" x="-10%" y="-100%" width="120%" height="300%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.0018 0.014" numOctaves="3" seed="${seed}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="70" xChannelSelector="R" yChannelSelector="G"/></filter><pattern id="p" width="720" height="174" patternUnits="userSpaceOnUse"><path d="M0 4H720M0 45H720M0 86H720M0 127H720M0 168H720" stroke="#ffe4be" stroke-opacity=".1" stroke-width="4"/><path d="M0 18H720M0 59H720M0 100H720M0 141H720" stroke="#1e0c02" stroke-opacity=".14" stroke-width="3"/><path d="M0 26L720 32M0 93L720 99M0 160L720 166" stroke="#1e0c02" stroke-opacity=".13" stroke-width="5"/></pattern></defs><path d="M-72 -${board}H792V${board * 2}H-72Z" fill="url(#p)" filter="url(#g)"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
