const assert = require('node:assert/strict');
const test = require('node:test');
const { roomCoverage } = require('../src/geometry/roomCoverage.ts');

// Project the generated bounds forward independently and check the crop corners.
test('automatic background covers the frame across physical camera and desk ranges', () => {
  for (const eye of [1000, 1650, 2400]) for (const setback of [0, 650, 3000])
    for (const width of [360, 1440, 3600]) for (const share of [0.5, 0.8, 1]) {
      const stand = 900, deskDepth = 960, lip = 180;
      const above = eye * 1.2 - stand;
      const depth = Math.hypot(above, setback * 1.2);
      const angle = Math.atan2(above, setback * 1.2) * 180 / Math.PI;
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
