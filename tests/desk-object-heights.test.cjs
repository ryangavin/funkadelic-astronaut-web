const assert = require('node:assert/strict');
const test = require('node:test');
const { DESK_OBJECT_SIZES } = require('../src/experience/Desk/deskObjectSizes.ts');

/* The Rolodex's drawing comes to 107.947 mm against the 107.95 it declares. */
const TOLERANCE_MM = 0.01;
const standing = Object.entries(DESK_OBJECT_SIZES).filter(([, size]) => size.solid);

test('some desk objects stand in a Solid', () => {
  assert.ok(standing.length > 0);
});

for (const [id, { widthMm, heightMm, solid }] of standing) {
  test(`the ${id} stands in its Solid as tall as the height its shadow is cast from`, () => {
    /* A Solid's height is a fraction of its drawing's width; units per mm cancel out. */
    const solidMm = solid.height * widthMm;
    assert.ok(Math.abs(solidMm - heightMm) <= TOLERANCE_MM, `${id}: Solid stands ${solidMm} mm, shadow is cast from ${heightMm} mm`);
  });
}
