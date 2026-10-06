const assert = require('node:assert/strict');
const test = require('node:test');

// Perspective.tsx and DeskObjects.tsx hold maths the desk relies on, but Node
// strips types only from .ts and cannot read JSX. This file compiles .tsx with
// esbuild (installed with Vite and Storybook) and stubs stylesheets and assets.
const fs = require('node:fs');
const { registerHooks } = require('node:module');
const { fileURLToPath } = require('node:url');
const { transformSync } = require('esbuild');
registerHooks({
  resolve(specifier, context, next) {
    try { return next(specifier, context); } catch (error) {
      for (const suffix of ['.ts', '.tsx']) try { return next(specifier + suffix, context); } catch {}
      throw error;
    }
  },
  load(url, context, next) {
    if (url.endsWith('.json')) return { format: 'module', source: `export default ${fs.readFileSync(fileURLToPath(url), 'utf8')}`, shortCircuit: true };
    if (!/\.(ts|tsx|js|mjs|cjs)$/.test(url)) return { format: 'module', source: `export default ${JSON.stringify(url)}`, shortCircuit: true };
    if (!url.endsWith('.tsx')) return next(url, context);
    const file = fileURLToPath(url);
    const { code } = transformSync(fs.readFileSync(file, 'utf8'), { loader: 'tsx', format: 'esm', jsx: 'automatic', sourcefile: file });
    return { format: 'module', source: code, shortCircuit: true };
  },
});

const { unprojectFrom, stand } = require('../src/behaviors/Perspective/Perspective.tsx');
const { DESK_OBJECTS } = require('../src/experience/Desk/DeskObjects.tsx');
const { UNITS_PER_MM } = require('../src/geometry/physicalScale.ts');
const { roomSetup, roomFraming } = require('../src/geometry/roomSetup.ts');
const { projectFloorPoint } = require('../src/foundations/Room/floorGeometry.ts');

const radians = degrees => degrees * Math.PI / 180;
const near = (a, b, tolerance = 1e-6) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);

const WIDTH = 1440;
const TILTS = [0, 5, 12, 20, 30];
const PLANES = [
  { left: 0, across: 1440, ratio: 960 / 1440, bottom: 960 },
  { left: 37, across: 720, ratio: 0.5, bottom: 812 },
  { left: -120, across: 375, ratio: 1, bottom: 2000 },
];

/* The forward camera, written independently of Perspective: the plane tips away
   about its target row by `tilt`, and the eye is `depth` units off that row. */
function screenOf(plane, { tilt, depth, width, targetY }, x, y) {
  const perUnit = plane.across / width, height = width * plane.ratio, target = targetY ?? height;
  const back = y - target, k = depth / (depth - back * Math.sin(tilt));
  return {
    left: plane.left + plane.across / 2 + (x - width / 2) * k * perUnit,
    top: plane.bottom - (height - target) * perUnit + back * Math.cos(tilt) * k * perUnit,
  };
}

test('a desk point projected to the screen and unprojected comes back where it started, at every tilt and plane size', () => {
  for (const degrees of TILTS) for (const plane of PLANES) for (const depth of [2400, 8000]) {
    const height = WIDTH * plane.ratio;
    for (const targetY of [undefined, height * 0.4]) {
      const view = { tilt: radians(degrees), depth, width: WIDTH, targetY };
      for (const x of [0, WIDTH / 3, WIDTH]) for (const y of [0, height / 2, height]) {
        const screen = screenOf(plane, view, x, y);
        const back = unprojectFrom(plane, view, screen.left, screen.top);
        near(back.x, x, 0.5); near(back.y, y, 0.5);
        // It is in fact exact, not merely within half a unit.
        near(back.x, x); near(back.y, y);
      }
    }
  }
});

test('a pointer above the horizon lands on the far edge of the plane, the documented fallback, not at infinity', () => {
  for (const degrees of TILTS.filter(d => d > 0)) for (const plane of PLANES) {
    const height = WIDTH * plane.ratio, perUnit = plane.across / WIDTH, depth = 2400, tilt = radians(degrees);
    const view = { tilt, depth, width: WIDTH };
    // On screen the horizon is depth/tan(tilt) units above the hinge (the front edge here).
    const horizon = plane.bottom - depth / Math.tan(tilt) * perUnit;
    // Exactly on the horizon rounding decides which side a point falls, so only points clearly past it are checked.
    for (const top of [horizon - 0.5, horizon - 1, horizon - 10000]) {
      const point = unprojectFrom(plane, view, plane.left + plane.across / 4, top);
      near(point.y, 0);
      assert.ok(Number.isFinite(point.x));
    }
    // Just below the horizon is still a real, finite point on the surface beyond the far edge.
    const below = unprojectFrom(plane, view, plane.left, horizon + 1);
    assert.ok(Number.isFinite(below.y) && below.y < -height);
  }
});

test('dragging across the screen moves a thing by the desk distance under the pointer, more per pixel the further back it is', () => {
  const plane = PLANES[0], depth = 2400;
  const drag = (view, from, dx, dy) => {
    const a = unprojectFrom(plane, view, from.left, from.top);
    const b = unprojectFrom(plane, view, from.left + dx, from.top + dy);
    return { x: b.x - a.x, y: b.y - a.y };
  };
  for (const degrees of TILTS) {
    const tilt = radians(degrees), view = { tilt, depth, width: WIDTH };
    const hinge = screenOf(plane, view, WIDTH / 2, 960);
    // Seen flat, or sideways along the hinge, a pixel is a unit: nothing there is foreshortened.
    near(drag(view, hinge, 25, 0).x, 25);
    near(drag(view, hinge, 25, 0).y, 0);
    // Up the screen from the hinge, the drag undoes the foreshortening: 1/cos(tilt) units a pixel, to first order.
    near(drag(view, hinge, 0, -1e-4).y / -1e-4, 1 / Math.cos(tilt), 1e-6);
    // Further back things are drawn smaller, so the same 25 px sideways is worth (depth - back·sin)/depth units.
    const far = screenOf(plane, view, WIDTH / 2, 960 - 600);
    near(drag(view, far, 25, 0).x, 25 * (depth + 600 * Math.sin(tilt)) / depth);
    if (degrees === 0) near(drag(view, far, 0, -25).y, -25);
    else assert.ok(-drag(view, far, 0, -25).y > -drag(view, hinge, 0, -25).y);
  }
});

/* stand() reads the plane box and two points through getBoundingClientRect, so a plain object will do. */
const planeElement = ({ left, bottom, across, ratio }) => ({ getBoundingClientRect: () => ({ left, bottom, width: across, height: across * ratio }) });

test('a solid rises h·tan(tilt) of its own width wherever it stands, and splays away from the eye\'s line', () => {
  const plane = PLANES[1];
  for (const degrees of TILTS.filter(d => d > 0)) for (const depth of [2400, 8000]) {
    const tilt = radians(degrees), view = { tilt, depth, width: WIDTH };
    for (const height of [0.3, 0.68, 1.2]) for (const objectWidth of [80, 240]) for (const reach of [0.5, 1]) {
      const splays = [];
      for (const x of [200, WIDTH / 2, 1200]) {
        const y = 500;
        const foot = screenOf(plane, view, x, y), edge = screenOf(plane, view, x + objectWidth * reach, y);
        const stood = stand(planeElement(plane), view, foot, edge, reach, height);
        near(stood.rise, height * Math.tan(tilt));
        near(stood.splay, height * Math.cos(tilt) * (x - WIDTH / 2) / depth);
        near(stood.turn, 0);
        splays.push(stood.splay);
      }
      near(splays[1], 0);
      assert.ok(splays[0] < 0 && splays[2] > 0, 'left of the eye\'s line splays left, right of it splays right');
    }
  }
});

test('a solid turned on the desk reports its turn and still rises by the same amount', () => {
  const plane = PLANES[0], view = { tilt: radians(20), depth: 2400, width: WIDTH };
  for (const turn of [-1.2, 0.3, 2.5]) {
    const foot = screenOf(plane, view, 600, 400), edge = screenOf(plane, view, 600 + 100 * Math.cos(turn), 400 + 100 * Math.sin(turn));
    const stood = stand(planeElement(plane), view, foot, edge, 1, 0.5);
    near(stood.turn, turn);
    near(stood.rise, 0.5 * Math.tan(radians(20)));
  }
});

test('every desk object with a Solid stands at the same height as the shadow it casts: solid.height × widthMm = height in mm', () => {
  const solids = DESK_OBJECTS.filter(object => object.solid);
  assert.ok(solids.length >= 4, 'mug, rolodex, label maker and desk phone carry a Solid');
  for (const object of solids) {
    // Within 0.01 mm: the Rolodex's 408/518 drawing ratio of a 137.05 mm width comes to 107.947 mm against 107.95.
    near(object.solid.height * object.widthMm, object.height, 0.01);
    // In desk units the same thing reads solid.height × width = 1.2 × height mm.
    near(object.solid.height * object.width, UNITS_PER_MM * object.height, 0.01 * UNITS_PER_MM);
  }
});

test('the floor and wall drawn by the room meet the desk exactly at its back edge, as the desk itself unprojects it', () => {
  for (const angle of [40, 60, 74.5, 90, 115]) for (const fov of [55, 110]) for (const deskHeightMm of [500, 750]) {
    const { camera, stand: standUnits } = roomSetup({ eyeHeightMm: 1650, viewerSetbackMm: 660, headTiltDegrees: angle, deskHeightMm });
    const { deskShare, lip } = roomFraming(camera, 0.8, 180, fov);
    // The desk plane inside the 1440 × 810 frame the room draws into.
    const scale = 1440 * deskShare / camera.width;
    const plane = { left: 720 - camera.width * scale / 2, across: camera.width * scale, ratio: camera.surfaceHeight / camera.width, bottom: 405 - lip * scale + (camera.surfaceHeight - camera.targetY) * scale };
    const view = { tilt: radians(90 - angle), depth: camera.depth, width: camera.width, targetY: camera.targetY };
    for (const x of [-camera.width / 2, 0, camera.width / 2]) for (const y of [0, camera.surfaceHeight]) {
      // World origin is the wall-floor seam; the desk top is `stand` above it with its back edge at y = 0.
      const screen = projectFloorPoint({ x, y, z: standUnits }, camera, standUnits, deskShare, lip);
      const onDesk = unprojectFrom(plane, view, screen.x, screen.y);
      near(onDesk.x, x + camera.width / 2, 1e-6);
      near(onDesk.y, y, 1e-6);
    }
  }
});
