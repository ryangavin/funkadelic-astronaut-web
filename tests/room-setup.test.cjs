const assert = require('node:assert/strict');
const test = require('node:test');
const { roomSetup, roomFraming, DEFAULT_HEAD_TILT_DEGREES } = require('../src/geometry/roomSetup.ts');
const { lightingSetup, DEFAULT_LIGHT_TUNING } = require('../src/geometry/lightingSetup.ts');
const { projectElevation } = require('../src/behaviors/Perspective/elevation.ts');
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test('legacy physical dimensions and camera defaults preserve existing Room', () => {
  assert.deepEqual(roomSetup({}, 84, 8000), { camera: { angle: 84, depth: 8000, width: 1440, surfaceHeight: 960 }, stand: 900, edge: 12 });
  assert.equal(roomSetup({ eyeHeightMm: 1, viewerSetbackMm: -1 }, 84, 8000).camera.angle, 84);
});
test('eye and setback derive one physical camera without changing unit scale', () => {
  for (const [eye, desk, setback] of [[1650, 750, 900], [1800, 900, 420], [1650, 750, 0]]) {
    const { camera, stand } = roomSetup({ cameraMode: 'physical', eyeHeightMm: eye, deskHeightMm: desk, viewerSetbackMm: setback, deskWidthMm: 1600, deskDepthMm: 1000 });
    near(camera.angle, DEFAULT_HEAD_TILT_DEGREES);
    near(camera.depth, (eye - desk) / Math.sin(DEFAULT_HEAD_TILT_DEGREES * Math.PI / 180) * 1.2);
    near(camera.depth * Math.sin(camera.angle * Math.PI / 180), (eye - desk) * 1.2);
    assert.equal(camera.width, 1920); assert.equal(camera.surfaceHeight, 1200); assert.equal(stand, desk * 1.2);
  }
});
test('legacy camera can round trip through physical eye coordinates', () => {
  for (const angle of [15, 45, 60, 84, 90]) {
    const depth = 3200, radians = angle * Math.PI / 180;
    const { camera } = roomSetup({ cameraMode: 'physical', eyeHeightMm: 750 + depth * Math.sin(radians) / 1.2, headTiltDegrees: angle, viewerSetbackMm: 400 + depth * Math.cos(radians) / 1.2 });
    near(camera.angle, angle); near(camera.depth, depth);
  }
});
test('physical projection agrees with direct 3D and its surface inverse at lower/overhead views', () => {
  for (const angle of [15, 45, 65, 90]) for (const width of [960, 1920]) for (const surfaceHeight of [600, 1200]) {
    const camera = { angle, depth: 2400, width, surfaceHeight };
    const tilt = (90 - angle) * Math.PI / 180, c = Math.cos(tilt), s = Math.sin(tilt);
    const screen = (x, y, h) => { const k = camera.depth / (camera.depth - (y - surfaceHeight) * s - h * c); return { x: width / 2 + (x - width / 2) * k, y: surfaceHeight + ((y - surfaceHeight) * c - h * s) * k }; };
    for (const x of [100, width / 2, width - 100]) for (const y of [50, surfaceHeight - 50]) {
      const plane = projectElevation(x, y, 100, camera);
      const actual = screen(plane.x, plane.y, 0), expected = screen(x, y, 100);
      near(actual.x, expected.x); near(actual.y, expected.y);
      const flat = screen(x, y, 0), up = flat.y - surfaceHeight;
      const back = up * camera.depth / (camera.depth * c + up * s);
      near(back + surfaceHeight, y);
      near(width / 2 + (flat.x - width / 2) * (camera.depth - back * s) / camera.depth, x);
    }
  }
});
test('invalid setups reject explicitly; eye-plane artwork hides without infinity/inversion', () => {
  for (const bad of [0, -1, Infinity, NaN]) for (const key of ['deskWidthMm', 'deskDepthMm', 'deskHeightMm']) assert.throws(() => roomSetup({ [key]: bad }), RangeError);
  for (const eyeHeightMm of [700, 750, NaN, Infinity]) assert.throws(() => roomSetup({ cameraMode: 'physical', eyeHeightMm, viewerSetbackMm: 10 }), RangeError);
  assert.throws(() => roomSetup({ cameraMode: 'physical', eyeHeightMm: 1700 }), /both/);
  assert.throws(() => roomSetup({ cameraMode: 'physical', eyeHeightMm: 1700, viewerSetbackMm: -1 }), RangeError);
  for (const angle of [0, -1, 91, NaN]) assert.throws(() => roomSetup({}, angle, 8000), RangeError);
  const camera = roomSetup({ cameraMode: 'physical', eyeHeightMm: 850, viewerSetbackMm: 100 }).camera;
  for (const h of [120, 121, 1000]) {
    const result = projectElevation(100, 200, h, camera);
    assert.equal(result.scale, 0); assert.ok(Object.values(result).every(Number.isFinite));
  }
});
test('lighting preserves defaults and permits experimental values beyond aesthetic ranges', () => {
  assert.deepEqual(lightingSetup(), DEFAULT_LIGHT_TUNING);
  assert.equal(lightingSetup({ poolSpread: 12, floorShadowTemper: 8 }).poolSpread, 12);
  for (const input of [{ shadowScaleLimit: .9 }, { shadowAttenuation: 0 }, { poolSpread: -1 }, { floorPoolSpread: Infinity }]) assert.throws(() => lightingSetup(input), RangeError);
});

test('physical lens stays fixed as camera distance or desk width changes', () => {
  const setup = (eye, back, width = 1200) => roomSetup({ cameraMode: 'physical', eyeHeightMm: eye, viewerSetbackMm: back, deskWidthMm: width }).camera;
  const baseline = setup(1650, 650), framing = roomFraming(baseline, true, .75, 100);
  near(framing.deskShare, .75 * Math.hypot(900, 650) / Math.hypot(900, 250));
  for (const camera of [setup(2550, 900), setup(2550, 650), setup(1650, 1300), setup(1650, 650, 2400)]) {
    const f = roomFraming(camera, true, .75, 100);
    near(camera.depth * f.deskShare / camera.width, baseline.depth * framing.deskShare / baseline.width);
    near(f.lip * f.deskShare / camera.width, framing.lip * framing.deskShare / baseline.width);
  }
  near(roomFraming(setup(2550, 900), true, .75, 100).deskShare, framing.deskShare / 2);
  near(roomFraming(setup(1650, 650, 2400), true, .75, 100).deskShare, framing.deskShare * 2);
  assert.deepEqual(roomFraming(setup(2550, 900), false, .75, 100), { deskShare: .75, lip: 100 });
  assert.throws(() => roomFraming({width: 1440, depth: Number.MIN_VALUE}, true, .75, 100), RangeError);
  assert.throws(() => roomFraming({width: 1440, depth: Number.MAX_VALUE}, true, .75, Number.MAX_VALUE), RangeError);
});

test('absolute head tilt is independent of wall distance and preserves the specified eye', () => {
  for (const wallDistance of [0, 400, 800, 1300]) for (const pitchDegrees of [35, 74.47588900324574, 90, 115]) {
    const { camera } = roomSetup({cameraMode:'physical', eyeHeightMm:1650, viewerSetbackMm:wallDistance, headTiltDegrees:pitchDegrees});
    const pitch = camera.angle * Math.PI / 180;
    near(camera.depth * Math.sin(pitch), 1080);
    near(camera.targetY + camera.depth * Math.cos(pitch), wallDistance * 1.2);
    near(camera.angle, pitchDegrees);
    const x=600,y=700,h=100, t=camera.targetY,c=Math.sin(pitch),s=Math.cos(pitch),d=camera.depth;
    const project=(px,py,pz)=>({x:720+(px-720)*d/(d-(py-t)*s-pz*c),y:((py-t)*c-pz*s)*d/(d-(py-t)*s-pz*c)});
    const elevated=projectElevation(x,y,h,camera), actual=project(elevated.x,elevated.y,0), expected=project(x,y,h);
    near(actual.x,expected.x); near(actual.y,expected.y);
  }
  for(const headTiltDegrees of [-180,0,180,Infinity,NaN]) assert.throws(()=>roomSetup({cameraMode:'physical',eyeHeightMm:1650,viewerSetbackMm:650,headTiltDegrees}), /look angle/);
});

test('fixed physical eye and lens preserve world floor/wall landmarks as desk dimensions change', () => {
  for (const pitch of [40, DEFAULT_HEAD_TILT_DEGREES, 90, 115]) {
    const alpha=pitch*Math.PI/180, c=Math.sin(alpha), s=Math.cos(alpha), eyeY=650*1.2, eyeZ=1650*1.2;
    const focal=.75*Math.hypot(900,650)*1.2/1440, principal=-100*.75/1440;
    for (const height of [300,750,1100]) for (const depth of [600,800,1400]) {
      const {camera,stand}=roomSetup({cameraMode:'physical',eyeHeightMm:1650,viewerSetbackMm:650,headTiltDegrees:pitch,deskHeightMm:height,deskDepthMm:depth});
      const f=roomFraming(camera,true,.75,100), scale=f.deskShare/camera.width;
      near(camera.angle,pitch); near(camera.targetY+camera.depth*s,eyeY); near(stand+camera.depth*c,eyeZ);
      for (const [x,y,z] of [[120,0,300],[200,0,1500],[-300,900,0],[250,1300,0]]) {
        const dy=y-camera.targetY, h=z-stand, denominator=camera.depth-dy*s-h*c;
        const actualX=x*camera.depth/denominator*scale;
        const actualY=((dy*c-h*s)*camera.depth/denominator-f.lip)*scale;
        const worldDepth=-(y-eyeY)*s-(z-eyeZ)*c;
        near(actualX,focal*x/worldDepth);
        near(actualY,principal+focal*((y-eyeY)*c-(z-eyeZ)*s)/worldDepth);
      }
    }
  }
});
