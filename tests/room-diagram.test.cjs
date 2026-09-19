const assert = require('node:assert/strict');
const test = require('node:test');
const { roomSetup } = require('../src/geometry/roomSetup.ts');
const { diagramGeometry, projectDiagram } = require('../src/debug/RoomDiagram/geometry.ts');
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-8,`${a} vs ${b}`);
test('diagram derives exact eye, center, gaze and lamp coordinates in floor-relative millimetres',()=>{
  for(const tilt of [45,74.47588900324574,110]) {
    const setup=roomSetup({cameraMode:'physical',deskWidthMm:1200,deskDepthMm:800,deskHeightMm:750,eyeHeightMm:1650,viewerSetbackMm:650,headTiltDegrees:tilt});
    const light={x:720,y:480,height:420,on:true,lamp:{base:{x:720,y:0,height:30,radius:88},elbow:{x:720,y:200,height:276,radius:9.6},neck:{x:720,y:480,height:480,radius:8.8}}};
    const scene=diagramGeometry({setup,extents:{span:3600,front:480,wallHeight:2880}},light);
    near(scene.eye.x,0);near(scene.eye.y,650);near(scene.eye.z,1650);near(scene.center.y,400);near(scene.center.z,750);near(scene.pitch,tilt);
    near(scene.lamp.bulb.x,0);near(scene.lamp.bulb.y,400);near(scene.lamp.bulb.z,1100);near(scene.lamp.base.z,775);near(scene.lamp.shadeRadius,130*.8/1.2);
    near(scene.span,3000);near(scene.floorDepth,1200);near(scene.wallHeight,2400);
    near(Math.atan2(scene.eye.z-scene.target.z,scene.eye.y-scene.target.y)*180/Math.PI,scene.pitch);
  }
});
test('diagram orbit preserves geometry and offers a true overhead and side projection',()=>{
  const point={x:100,y:200,z:300};
  const overhead=projectDiagram(point,0,90);near(overhead.x,100);near(overhead.y,200);
  const side=projectDiagram(point,-90,0);near(side.x,200);near(side.y,-300);
});
