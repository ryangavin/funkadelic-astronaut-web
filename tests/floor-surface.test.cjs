const assert=require('node:assert/strict'),test=require('node:test');
const {roomSetup,roomFraming}=require('../src/geometry/roomSetup.ts');
const {floorCamera}=require('../src/foundations/Room/floorSurface.ts');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('floor Perspective adapter preserves world eye, lens and principal point',()=>{
 for(const angle of [40,74.5,90,115])for(const height of [500,770,1100])for(const fov of [55,110]){
  const {camera,stand}=roomSetup({cameraMode:'physical',eyeHeightMm:1650,viewerSetbackMm:660,headTiltDegrees:angle,deskHeightMm:height});
  const f=roomFraming(camera,true,.8,180,fov),floor=floorCamera(camera,stand,f.deskShare,f.lip),a=angle*Math.PI/180;
  near(floor.camera.depth*Math.sin(a),1980);near(floor.camera.targetY+floor.camera.depth*Math.cos(a),792);
  near(floor.camera.depth*floor.share,camera.depth*f.deskShare);near(floor.lip*floor.share,f.lip*f.deskShare);
 }
});
test('floor references are layered elevated artwork, with wall-clear footprint and canopy',()=>{
 const fs=require('node:fs');const source=fs.readFileSync('src/debug/ScaleBench/FloorReferences.tsx','utf8');
 assert.match(source,/elevatedLayer/);assert.doesNotMatch(source,/<Solid/);assert.match(source,/<Wastebasket/);assert.doesNotMatch(source,/faces:|RoomFloorMesh|<polygon/);
 const {FLOOR_REFERENCES:{plant,bin}}=require('../src/debug/ScaleBench/referenceDimensions.ts');
 assert.equal(bin.height,360);assert.equal(bin.diameter,290);assert.ok(bin.y-bin.diameter/2>=10);
 assert.equal(plant.height,950);assert.equal(plant.potHeight,320);assert.ok(plant.y-plant.canopyRadius>=20);
 near(plant.artwork*bin.diameter/bin.artwork,plant.potDiameter);
 const art=fs.readFileSync('src/components/3D/Wastebasket/Wastebasket.tsx','utf8');
 assert.match(art,/wastebasket__wall/);assert.match(art,/wastebasket__top/);assert.doesNotMatch(art,/coffee|dregs|<polygon/);
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
