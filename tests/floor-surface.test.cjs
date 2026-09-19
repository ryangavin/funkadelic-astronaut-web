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
test('floor references are layered Solid artwork, with wall-clear footprint and canopy',()=>{
 const fs=require('node:fs');const source=fs.readFileSync('src/debug/ScaleBench/FloorReferences.tsx','utf8');
 assert.match(source,/<Solid/);assert.match(source,/<Wastebasket/);assert.doesNotMatch(source,/faces:|RoomFloorMesh|<polygon/);
 const {FLOOR_REFERENCES:{plant,bin}}=require('../src/debug/ScaleBench/referenceDimensions.ts');
 assert.equal(bin.height,360);assert.equal(bin.diameter,290);assert.ok(bin.y-bin.diameter/2>=10);
 assert.equal(plant.height,950);assert.equal(plant.potHeight,320);assert.ok(plant.y-plant.canopyRadius>=20);
 near(plant.artwork*bin.diameter/bin.artwork,plant.potDiameter);
 const art=fs.readFileSync('src/components/3D/Wastebasket/Wastebasket.tsx','utf8');
 assert.match(art,/wastebasket__wall/);assert.match(art,/wastebasket__top/);assert.doesNotMatch(art,/coffee|dregs|<polygon/);
});

test('layered sides split in the linear height coordinates used by Solid',()=>{
 const {tabletopSplit}=require('../src/debug/ScaleBench/referenceDimensions.ts');
 for(const tableHeight of [200,750])for(const height of [320,840,950]){
  const split=tabletopSplit(height,tableHeight);
  near(height*split,Math.min(tableHeight,height));
 }
 near(tabletopSplit(950,750),750/950);
});
