const assert = require('node:assert/strict');
const test = require('node:test');
const { lampPlacement } = require('../src/geometry/lampPlacement.ts');
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-8,`${a} vs ${b}`);
test('live lamp placement rotates and scales about its actual artwork pivot, with reversible pointer mapping',()=>{
  for(const rotation of [-120,0,90])for(const scale of [.5,1,2]) {
    const transform=lampPlacement(576,{x:100,y:200,rotation,scale},15);
    const center=transform.world(360,300,30,110);
    near(center.x,100+288*scale);near(center.y,200+240*scale);near(center.height,30*scale);near(center.radius,88*scale);
    const world=transform.world(200,420,420),local=transform.local(world.x,world.y);
    near(local.x,200);near(local.y,420);
  }
});
