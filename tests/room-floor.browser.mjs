import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {roomSetup,roomFraming} from '../src/geometry/roomSetup.ts';
import {deskLegs,projectFloorPoint} from '../src/foundations/Room/floorGeometry.ts';
assert.ok(process.env.PREVIEW_URL,'Set PREVIEW_URL to the owned unified preview');
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 await page.goto(`${process.env.PREVIEW_URL}/storybook/iframe.html?id=debug-scale-bench--physical-setup&viewMode=story`);
 await page.getByRole('img',{name:'Wastebasket, 360 mm tall and 290 mm across'}).waitFor();
 const input=async(name,value)=>{const field=page.getByRole('spinbutton',{name,exact:true});await field.fill(String(value));await field.blur();};
 for(const [angle,fov,wall,height] of [[74.5,110,660,770],[40,110,1600,770],[90,85,660,750],[115,85,660,750]]) {
  await input('Horizontal field of view (degrees)',fov);await input('Wall distance (mm)',wall);await input('Head tilt from horizontal (degrees)',angle);await input('Desk height (mm)',height);
  assert.equal(await page.getByRole('alert').count(),0);
  const {camera,stand,edge}=roomSetup({cameraMode:'physical',eyeHeightMm:1650,viewerSetbackMm:wall,headTiltDegrees:angle,deskHeightMm:height});
  const framing=roomFraming(camera,true,.8,180,fov),legs=deskLegs(camera.width,camera.surfaceHeight,stand,edge);
  const frame=await page.locator('.room').boundingBox();
  for(const leg of legs) {
   const expected=projectFloorPoint({x:leg.x,y:leg.y,z:0},camera,stand,framing.deskShare,framing.lip,.5);
   const actual=await page.locator('.desk-room__floor').evaluate((floor,leg)=>{
    const marker=document.createElement('i');marker.style.cssText=`position:absolute;left:calc(50% + ${leg.x} * var(--desk-room-unit));top:calc(${leg.y} * var(--desk-room-unit));width:0;height:0`;
    floor.append(marker);const b=marker.getBoundingClientRect();marker.remove();return{x:b.x,y:b.y};
   },leg);
   assert.ok(Math.abs(actual.x-frame.x-expected.x*frame.width/1440)<.1,'foot x matches real floor');
   assert.ok(Math.abs(actual.y-frame.y-expected.y*frame.height/810)<.1,'foot y matches real floor');
  }
  assert.ok(await page.locator('[data-floor-object="Desk leg 1"]').count());
  assert.equal(await page.getByRole('img',{name:'Wastebasket, 360 mm tall and 290 mm across'}).count(),1);
  assert.equal(await page.locator('.scale-plant--below').count(),1);
  const binFoot=await page.getByRole('img',{name:'Wastebasket, 360 mm tall and 290 mm across'}).evaluate(svg=>{
    const rect=svg.closest('.solid').querySelector('.solid__stands').getBoundingClientRect();return{x:rect.x,y:rect.y};
  });
  const expectedBin=projectFloorPoint({x:1440,y:186,z:0},camera,stand,framing.deskShare,framing.lip,.5);
  assert.ok(Math.abs(binFoot.x-frame.x-expectedBin.x*frame.width/1440)<.2,'Solid bin foot matches world floor x');
  assert.ok(Math.abs(binFoot.y-frame.y-expectedBin.y*frame.height/810)<.2,'Solid bin foot matches world floor y');
  assert.ok(!/NaN|Infinity/.test(await page.locator('.room__floor-geometry').first().innerHTML()));
 }
 // The pot clears this desk, but raised leaves overlap its edge. Their painted
 // layer must actually win browser hit testing over the tabletop.
 await input('Desk width (mm)',2000);await input('Head tilt from horizontal (degrees)',90);
 await input('Desk height (mm)',750);await input('Horizontal field of view (degrees)',110);
 const overlap=await page.evaluate(()=>{
   const desk=document.querySelector('.desk__top').getBoundingClientRect();
   const leaves=[...document.querySelectorAll('.scale-plant--above [data-leaf-height] > path:first-child')];
   for(const leaf of leaves){
     leaf.style.pointerEvents='visiblePainted';
     const box=leaf.getBBox(),matrix=leaf.getScreenCTM();
     for(let x=box.x+1;x<box.x+box.width;x+=3)for(let y=box.y+1;y<box.y+box.height;y+=3){
       const local=new DOMPoint(x,y);if(!leaf.isPointInFill(local))continue;
       const p=local.matrixTransform(matrix);
       if(p.x>desk.left+1&&p.x<desk.right-1&&p.y>desk.top+1&&p.y<desk.bottom-1){
         const hit=document.elementFromPoint(p.x,p.y);
         if(hit?.closest('.scale-plant--above'))return true;
       }
     }
   }
   return false;
 });
 assert.ok(overlap,'raised leaf is painted above overlapping tabletop');
 const before=await page.locator('.room__floor-geometry').first().innerHTML();
 await input('Eye height (mm)',700);assert.equal(await page.getByRole('alert').count(),1);
 assert.equal(await page.locator('.room__floor-geometry').first().innerHTML(),before);
 console.log('PASS physical feet match transformed floor at four camera/lens poses; scale props and invalid fallback retained');
} finally {await browser.close();}
