const assert=require('node:assert/strict');
const test=require('node:test');
const {singleArmGeometry,clampArm,wrapShade,SINGLE_ARM_MM}=require('../src/components/3D/SingleArmLamp/geometry.ts');
const {projectElevation}=require('../src/behaviors/Perspective/elevation.ts');
test('single lamp has one constant-length physical arm and independent shade swivel',()=>{
  for(const angle of[15,30,60,85]) for(const yaw of[0,90,180,270]) {
    const {base,neck,bulb}=singleArmGeometry(angle,yaw);
    assert.ok(Math.abs(Math.hypot(neck.x-base.x,neck.y-base.y,neck.height-base.height)-SINGLE_ARM_MM.arm*1.2)<1e-9);
    assert.ok(bulb.height>0);
    assert.deepEqual(neck,singleArmGeometry(angle,0).neck);
    assert.ok(Math.abs(Math.hypot(bulb.x-neck.x,bulb.y-neck.y)-SINGLE_ARM_MM.shadeReach*1.2)<1e-9);
  }
  assert.equal(clampArm(-100),15);assert.equal(clampArm(200),85);assert.equal(wrapShade(-5),355);
});
test('one-arm elevated geometry agrees with real projection in high and low cameras',()=>{
 for(const angle of[25,80,110]) {
  const camera={angle,depth:1800,width:1440,surfaceHeight:960,targetY:480};
  const c=Math.sin(angle*Math.PI/180),s=Math.cos(angle*Math.PI/180);
  const direct=(x,y,h)=>{const k=camera.depth/(camera.depth-(y-480)*s-h*c);return{x:720+(x-720)*k,y:((y-480)*c-h*s)*k}};
  for(const p of Object.values(singleArmGeometry(60,20))) {
   const x=500+p.x,y=p.y-20,flat=projectElevation(x,y,p.height,camera),actual=direct(flat.x,flat.y,0),expected=direct(x,y,p.height);
   assert.ok(Math.abs(actual.x-expected.x)<1e-8);assert.ok(Math.abs(actual.y-expected.y)<1e-8);
  }
 }
});
