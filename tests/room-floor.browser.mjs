import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {roomSetup,roomFraming} from '../src/geometry/roomSetup.ts';
import {deskLegs,projectFloorPoint} from '../src/foundations/Room/floorGeometry.ts';
assert.ok(process.env.PREVIEW_URL,'Set PREVIEW_URL to the owned unified preview');
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 await page.goto(`${process.env.PREVIEW_URL}/storybook/iframe.html?id=debug-scale-bench--physical-setup&viewMode=story`);
 await page.locator('[data-floor-object="Wastebasket"]').first().waitFor();
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
  for(const name of ['Potted plant','Wastebasket','Desk leg 1'])assert.ok(await page.locator(`[data-floor-object="${name}"]`).count());
  assert.ok(!/NaN|Infinity/.test(await page.locator('.room__floor-geometry').first().innerHTML()));
 }
 const before=await page.locator('.room__floor-geometry').first().innerHTML();
 await input('Eye height (mm)',700);assert.equal(await page.getByRole('alert').count(),1);
 assert.equal(await page.locator('.room__floor-geometry').first().innerHTML(),before);
 console.log('PASS physical feet match transformed floor at four camera/lens poses; scale props and invalid fallback retained');
} finally {await browser.close();}
