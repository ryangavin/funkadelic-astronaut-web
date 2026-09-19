const assert=require('node:assert/strict');const test=require('node:test');
const {deskLegs,clipHeight,projectFloorPoint}=require('../src/foundations/Room/floorGeometry.ts');
const {roomSetup,roomFraming}=require('../src/geometry/roomSetup.ts');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('four inset legs join floor to underside across desk dimensions',()=>{
 for(const width of [100,1440,2400])for(const depth of [100,960,1600])for(const stand of [600,924,1200]){
  const legs=deskLegs(width,depth,stand,12);assert.equal(legs.length,4);
  for(const leg of legs){near(leg.bottom,0);near(leg.top,stand-12);assert.ok(Math.abs(leg.x)+leg.size/2<=width/2);assert.ok(leg.y-leg.size/2>=0&&leg.y+leg.size/2<=depth);}
 }
});
test('physical floor projection agrees with direct world camera at both sides of overhead and varying FOV',()=>{
 for(const angle of [40,74.5,90,115])for(const fov of [55,110])for(const height of [500,770,1100]){
  const {camera,stand}=roomSetup({cameraMode:'physical',eyeHeightMm:1650,viewerSetbackMm:660,headTiltDegrees:angle,deskHeightMm:height});
  const framing=roomFraming(camera,true,.8,180,fov),a=angle*Math.PI/180,F=720/Math.tan(fov*Math.PI/360);
  for(const point of [{x:0,y:500,z:0},{x:-1440,y:420,z:384},{x:300,y:800,z:stand-12}]){
   const result=projectFloorPoint(point,camera,stand,framing.deskShare,framing.lip,.5);
   const dy=point.y-792,dz=point.z-1980,d=-dy*Math.cos(a)-dz*Math.sin(a);
   near(result.x,720+F*point.x/d);near(result.y,405-144+F*(dy*Math.sin(a)-dz*Math.cos(a))/d);
  }
 }
});
test('tabletop split preserves physical crossings without placing low geometry over desktop',()=>{
 const poly=[{x:0,y:0,z:0},{x:100,y:0,z:100},{x:0,y:100,z:100}];
 const below=clipHeight(poly,50,false),above=clipHeight(poly,50,true);
 assert.ok(below.every(p=>p.z<=50));assert.ok(above.every(p=>p.z>=50));
 assert.deepEqual(below.filter(p=>p.z===50),above.filter(p=>p.z===50));
});
