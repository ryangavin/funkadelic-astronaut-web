const assert=require('node:assert/strict');const test=require('node:test');
const {windowLandmarks}=require('../src/components/3D/WallWindow/geometry.ts');
test('window controls preserve centered width and floor-based placement',()=>{
 for(const height of [300,1000,1800])for(const sill of [0,900,2200]){
  const p=windowLandmarks(height,sill);
  assert.equal(p.bottomLeft.x+p.bottomRight.x,0);
  assert.equal(p.bottomRight.x-p.bottomLeft.x,1100);
  assert.equal(p.bottomLeft.z,sill);assert.equal(p.topLeft.z,sill+height);
  assert.ok(Object.values(p).every(point=>point.y===0));
 }
});
