const assert=require('node:assert/strict'),test=require('node:test');
const {roomSetup,roomFraming}=require('../src/geometry/roomSetup.ts');
const {floorCamera}=require('../src/foundations/Room/floorSurface.ts');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('floor Perspective adapter preserves world eye, lens and principal point',()=>{
 for(const angle of [40,74.5,90,115])for(const height of [500,770,1100])for(const fov of [55,110]){
  const {camera,stand}=roomSetup({eyeHeightMm:1650,viewerSetbackMm:660,headTiltDegrees:angle,deskHeightMm:height});
  const f=roomFraming(camera,.8,180,fov),floor=floorCamera(camera,stand,f.deskShare,f.lip),a=angle*Math.PI/180;
  near(floor.camera.depth*Math.sin(a),1980);near(floor.camera.targetY+floor.camera.depth*Math.cos(a),792);
  near(floor.camera.depth*floor.share,camera.depth*f.deskShare);near(floor.lip*floor.share,f.lip*f.deskShare);
 }
});
test('floor reference objects keep their real sizes, one artwork scale, and clear the wall',()=>{
 const {FLOOR_REFERENCES:{plant,bin}}=require('../src/experience/debug/ScaleBench/referenceDimensions.ts');
 assert.equal(bin.height,360);assert.equal(bin.diameter,290);assert.ok(bin.y-bin.diameter/2>=10);
 assert.equal(plant.height,950);assert.equal(plant.potHeight,320);assert.ok(plant.y-plant.canopyRadius>=20);
 near(plant.artwork*bin.diameter/bin.artwork,plant.potDiameter);
});


test('cylinder side artwork joins the projected rim and base tangentially',()=>{
 const {cylinderSide}=require('../src/components/3D/Wastebasket/cylinder.ts');
 for(const b of [{x:40,y:-300,scale:1.3},{x:-80,y:240,scale:1.2}]){
  const values=cylinderSide({x:0,y:0,scale:1},115,b,145).match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi).map(Number);
  const [ax,ay,bx,by]=values;
  near(Math.hypot(ax-180,ay-180),115);
  near(Math.hypot(bx-180-b.x,by-180-b.y),145*b.scale);
  near((ax-180)*(bx-ax)+(ay-180)*(by-ay),0);
 }
});
