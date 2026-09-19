import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {roomSetup,roomFraming} from '../src/geometry/roomSetup.ts';
import {projectFloorPoint} from '../src/foundations/Room/floorGeometry.ts';
const id='debug-scale-bench--physical-setup';
assert.ok(process.env.PREVIEW_URL,'Set owned PREVIEW_URL');
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1262,height:900}});
 await page.goto(`${process.env.PREVIEW_URL}/storybook/iframe.html?id=${id}&viewMode=story`);
 await page.locator('.wall-window').waitFor();
 const args=()=>page.evaluate(id=>window.__STORYBOOK_PREVIEW__.storyStore.args.get(id),id);
 const input=async(name,key,value)=>{
  await page.getByRole('spinbutton',{name,exact:true}).fill(String(value));
  await page.waitForFunction(({id,key,value})=>Object.is(window.__STORYBOOK_PREVIEW__.storyStore.args.get(id)[key],value),{id,key,value});
  await page.waitForFunction(({name,value})=>Number(document.querySelector(`input[aria-label="${name}"]`).value)===value,{name,value});
 };
 for(const [name,key,value] of [['Window height (mm)','windowHeightMm',800],['Window sill height (mm)','windowSillHeightMm',900],['Head tilt from horizontal (degrees)','headTiltDegrees',40],['Wall distance (mm)','viewerSetbackMm',1600],['Horizontal field of view (degrees)','horizontalFieldOfViewDegrees',100]])await input(name,key,value);
 await page.getByRole('checkbox',{name:'Show FPS overlay'}).check();
 await page.waitForFunction(id=>window.__STORYBOOK_PREVIEW__.storyStore.args.get(id).showPerformance===true,id);
 for(const [angle,eye,height] of [[40,1650,750],[74.5,2100,900],[115,2400,650]]) {
  await input('Wall distance (mm)','viewerSetbackMm',angle===115?650:1600);
  await input('Head tilt from horizontal (degrees)','headTiltDegrees',angle);
  await input('Eye height (mm)','eyeHeightMm',eye);
  await input('Desk height (mm)','deskHeightMm',height);
  const a=await args(),{camera,stand}=roomSetup(a),f=roomFraming(camera,true,a.deskShare,a.roomLip,a.horizontalFieldOfViewDegrees);
  const frame=await page.locator('.room').boundingBox();
  for(const [x,y,z] of [[0,1000,900],[1100,0,1700]]) {
   const actual=await page.locator('.wall-window').evaluate((svg,{x,y})=>{const mark=document.createElementNS('http://www.w3.org/2000/svg','rect');for(const [key,value] of Object.entries({x,y,width:.001,height:.001}))mark.setAttribute(key,String(value));svg.append(mark);const q=mark.getBoundingClientRect();mark.remove();return{x:q.x,y:q.y};},{x,y});
   const expected=projectFloorPoint({x:(x-550)*1.2,y:0,z:z*1.2},camera,stand,f.deskShare,f.lip,.5);
   assert.ok(Math.abs(actual.x-frame.x-expected.x*frame.width/1440)<.5,`window anchored x at ${angle}: ${actual.x} vs ${frame.x+expected.x*frame.width/1440}`);
   assert.ok(Math.abs(actual.y-frame.y-expected.y*frame.height/810)<.5,`window anchored z at ${angle}: ${actual.y} vs ${frame.y+expected.y*frame.height/810}`);
  }
  if(angle===40)await page.screenshot({path:'/tmp/wall-window-low.png'});
  if(angle===74.5)await page.screenshot({path:'/tmp/wall-window-high.png'});
 }
 const valid=await page.locator('.wall-window').getAttribute('style');
 await input('Window height (mm)','windowHeightMm',-1);
 await page.getByRole('alert').waitFor();assert.equal(await page.locator('.wall-window').getAttribute('style'),valid);
 await page.evaluate(id=>window.__STORYBOOK_ADDONS_CHANNEL__.emit('resetStoryArgs',{storyId:id}),id);
 await page.waitForFunction(()=>document.querySelector('input[aria-label="Window height (mm)"]').value==='1000');
 assert.equal((await args()).windowHeightMm,1000);
 assert.equal(await page.getByRole('checkbox',{name:'Show FPS overlay'}).isChecked(),false);
 assert.equal(await page.getByRole('alert').count(),0);
 console.log('PASS actual Storybook args persist numeric/window/FPS edits and reset; window agrees with shared world projection at3poses; invalid edit retains window.');
}finally{await browser.close();}
