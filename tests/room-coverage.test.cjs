const assert = require('node:assert/strict');
const test = require('node:test');
const { roomFraming } = require('../src/geometry/roomSetup.ts');
const { roomCoverage } = require('../src/geometry/roomCoverage.ts');

// Project the generated bounds forward independently and check the crop corners.
test('automatic background covers the frame across physical camera and desk ranges', () => {
  for (const eye of [1000, 1650, 2400]) for (const setback of [0, 650, 3000])
    for (const width of [360, 1440, 3600]) for (const referenceShare of [0.5, 0.8, 1]) for (const physical of [false, true]) {
      const stand = 900, deskDepth = 960;
      const above = eye * 1.2 - stand;
      const depth = Math.hypot(above, setback * 1.2);
      const angle = Math.atan2(above, setback * 1.2) * 180 / Math.PI;
      const { deskShare: share, lip } = roomFraming({ width, depth }, physical, referenceShare, 180);
      const bounds = roomCoverage({ angle, depth, deskWidth: width, deskDepth, stand, deskShare: share, lip });
      const tilt = (90 - angle) * Math.PI / 180, c = Math.cos(tilt), s = Math.sin(tilt);
      const project = (y, z) => ({ y: depth * y / (depth - z), halfWidth: depth * bounds.span / 2 / (depth - z) });
      const seam = project(stand * s - deskDepth * c, -stand * c - deskDepth * s);
      const top = lip - width / share * 9 / 16, bottom = lip;
      assert.ok(Object.values(bounds).every(Number.isFinite));
      if (bottom > seam.y) {
        const near = project(stand * s + bounds.front * c, -stand * c + bounds.front * s);
        assert.ok(near.y >= bottom - 1e-6);
        assert.ok(near.halfWidth >= width / share / 2 - 1e-6);
      }
      if (top < seam.y) {
        const upper = project(stand * s - deskDepth * c - bounds.wallHeight * s, -stand * c - deskDepth * s + bounds.wallHeight * c);
        assert.ok(upper.y <= top + 1e-6);
        assert.ok(upper.halfWidth >= width / share / 2 - 1e-6);
      }
      if (seam.y >= top && seam.y <= bottom) assert.ok(seam.halfWidth >= width / share / 2 - 1e-6);
    }
});

const { roomSurfaceExtents } = require('../src/geometry/roomCoverage.ts');
const setup = { angle: 54.162347, depth: 1332.066, deskWidth: 1440, deskDepth: 960, stand: 900, deskShare: 0.8, lip: 180 };
test('near-table overhead cameras fail cheaply before allocating material arrays', () => {
  for (const clearance of [1.2, 0.12, 0.00012]) {
    assert.throws(() => roomSurfaceExtents({ ...setup, angle: 90, depth: clearance }), /renderer capacity exceeded.*rendering resource limit/);
  }
});
test('renderer budget also guards explicit dimensions and filtered course counts', () => {
  for (const overrides of [{ span: 1e9 }, { front: 1e9 }, { wallHeight: 1e9 }, { front: 96 * 129 }]) {
    assert.throws(() => roomSurfaceExtents(setup, overrides), /renderer capacity exceeded/);
  }
  assert.deepEqual(roomSurfaceExtents(setup, { span: 2640, front: 400, wallHeight: 2880 }), { span: 2640, front: 400, wallHeight: 2880 });
  assert.ok(roomSurfaceExtents(setup).span > 2640);
});


test('absolute pitched cameras cover frame rays on both sides of overhead', () => {
  const { roomSetup, roomFraming } = require('../src/geometry/roomSetup.ts');
  for (const wallDistance of [0,400,800,1300]) for (const headTiltDegrees of [65,90,115]) {
    const {camera,stand}=roomSetup({cameraMode:'physical',eyeHeightMm:1650,viewerSetbackMm:wallDistance,headTiltDegrees});
    const framing=roomFraming(camera,true,.8,60);
    const inputs={angle:camera.angle,depth:camera.depth,deskWidth:camera.width,deskDepth:camera.surfaceHeight,stand,...framing,targetY:camera.targetY,frameAnchor:.5};
    // At the wall a pitched-up frame can look through/behind that plane. There
    // is no finite visible wall/floor backdrop for those rays; retain the guard.
    if (wallDistance===0 && headTiltDegrees!==115) { assert.throws(()=>roomSurfaceExtents(inputs), /capacity/); continue; }
    const bounds=roomSurfaceExtents(inputs);
    const pitch=camera.angle*Math.PI/180,c=Math.sin(pitch),s=Math.cos(pitch),d=camera.depth;
    const half=camera.width/framing.deskShare/2;
    for (const u of [-half,half]) for (const v of [framing.lip-half*9/16,framing.lip+half*9/16]) {
      const eyeY=wallDistance*1.2, H=1080;
      const floorK=(H+stand)/(v*s+d*c), y=eyeY+floorK*(v*c-d*s);
      const floorHit=floorK>0 && y>=0 && y<=camera.surfaceHeight+bounds.front+1e-6 && Math.abs(u*floorK)<=bounds.span/2+1e-6;
      const wallK=eyeY/(d*s-v*c), z=H-wallK*(v*s+d*c);
      const wallHit=wallK>0 && z>=-stand && z<=bounds.wallHeight-stand+1e-6 && Math.abs(u*wallK)<=bounds.span/2+1e-6;
      assert.ok(floorHit || wallHit, `uncovered ray ${wallDistance}/${headTiltDegrees}/${u}/${v}`);
    }
  }
});
