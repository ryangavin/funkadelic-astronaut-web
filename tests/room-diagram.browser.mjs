import assert from 'node:assert/strict';
import { chromium } from 'playwright';
assert.ok(process.env.PREVIEW_URL, 'Set PREVIEW_URL to the unified preview');
const browser = await chromium.launch({ headless:true });
try {
  const page=await browser.newPage({viewport:{width:1000,height:850}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${process.env.PREVIEW_URL}/storybook/iframe.html?id=debug-scale-bench--physical-setup&viewMode=story`);
  const diagram=page.getByRole('region',{name:'Room geometry diagram'}),drawing=page.locator('.room-diagram__drawing');
  await diagram.waitFor();
  const data=async key=>JSON.parse(await diagram.getAttribute(`data-${key}`));
  const input=async(name,value)=>{const field=page.getByRole('spinbutton',{name,exact:true});await field.fill(value);await field.blur();};
  const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
  near((await data('eye')).z,1650);near((await data('eye')).y,650);
  await input('Eye height (mm)','2200');near((await data('eye')).z,2200);
  await input('Wall distance (mm)','900');near((await data('eye')).y,900);
  const lensEye=await data('eye'),lensTarget=await data('target');
  await input('Horizontal field of view (degrees)','85');
  assert.match(await diagram.textContent(),/Horizontal FOV 85.0°/);
  assert.deepEqual(await data('eye'),lensEye);assert.deepEqual(await data('target'),lensTarget);
  await input('Horizontal field of view (degrees)','180');
  assert.match(await page.getByRole('alert').textContent(),/field of view/);
  assert.match(await diagram.textContent(),/Horizontal FOV 85.0°/);
  await input('Horizontal field of view (degrees)','68.08324751836064');
  const originalEye=await data('eye'),originalTarget=await data('target');
  await input('Head tilt from horizontal (degrees)','85');near((await data('eye')).y,originalEye.y);near((await data('eye')).z,originalEye.z);assert.notDeepEqual(await data('target'),originalTarget);
  const validEye=await data('eye'),validTarget=await data('target');
  await input('Eye height (mm)','');assert.match(await page.getByRole('alert').textContent(),/last valid/);
  assert.deepEqual(await data('eye'),validEye);assert.deepEqual(await data('target'),validTarget);
  await input('Eye height (mm)','2200');await page.getByRole('alert').waitFor({state:'detached',timeout:5000});
  const camera=await page.locator('.room__stand > .perspective').getAttribute('style');
  await drawing.scrollIntoViewIfNeeded();await drawing.focus();await page.keyboard.press('ArrowRight');
  assert.equal(await drawing.getAttribute('data-orbit'),'-18,24');
  let box=await drawing.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+180);await page.mouse.down();await page.mouse.move(box.x+box.width/2+40,box.y+160,{steps:5});await page.mouse.up();
  assert.notEqual(await drawing.getAttribute('data-orbit'),'-18,24');assert.equal(await page.locator('.room__stand > .perspective').getAttribute('style'),camera);
  await page.getByRole('button',{name:'Side',exact:true}).click();assert.equal(await drawing.getAttribute('data-orbit'),'-90,0');
  await drawing.focus();await page.keyboard.press('Home');assert.equal(await drawing.getAttribute('data-orbit'),'-28,24');
  const lamp=page.getByRole('group',{name:'Desk lamp',exact:true});
  await lamp.focus();const first=await data('lamp');const artwork=await page.locator('.desk-lamp__base').getAttribute('transform');
  await page.keyboard.press('ArrowRight');near((await data('lamp')).base.x-first.base.x,10/1.2);
  assert.notEqual(await page.locator('.desk-lamp__base').getAttribute('transform'),artwork);
  const moved=await data('lamp');await page.keyboard.press(']');assert.notDeepEqual((await data('lamp')).neck,moved.neck);
  const switcher=page.getByRole('button',{name:'Turn the lamp off',exact:true});await switcher.focus();const aimed=await data('lamp');await page.keyboard.press('ArrowRight');assert.notDeepEqual((await data('lamp')).neck,aimed.neck);
  await page.keyboard.press('Enter');assert.equal((await data('lamp')).on,false);
  await input('Eye height (mm)','2400');await input('Wall distance (mm)','1800');await input('Head tilt from horizontal (degrees)','55');
  // Pointer aim must also track the live rotated placement.
  const head=page.getByRole('button',{name:'Turn the lamp on',exact:true});await head.scrollIntoViewIfNeeded();box=await head.boundingBox();
  const roomBox=await page.locator('.room').boundingBox();
  const pointer={x:box.x+box.width/2,y:(Math.max(0,roomBox.y,box.y)+Math.min(roomBox.y+roomBox.height,box.y+box.height))/2};
  const beforeAim=await data('lamp');await page.mouse.move(pointer.x,pointer.y);await page.mouse.down();await page.mouse.move(pointer.x+25,pointer.y+15,{steps:5});await page.mouse.up();assert.notDeepEqual((await data('lamp')).neck,beforeAim.neck);
  // Drag its base as well; the diagram follows the same live placement store.
  await page.locator('.room-controls__scene').evaluate(element=>element.scrollTop=0);
  const baseHandle=page.locator('.desk-lamp__base-handle');box=await baseHandle.boundingBox();

  const beforeDrag=await data('lamp');await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2-35,box.y+box.height/2+15,{steps:5});await page.mouse.up();assert.notDeepEqual((await data('lamp')).base,beforeDrag.base);
  for(const viewport of [{width:962,height:760},{width:583,height:760},{width:390,height:844}]){
    await page.setViewportSize(viewport);await drawing.scrollIntoViewIfNeeded();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight+1));
    const side=await page.locator('.room-controls__sidebar').boundingBox();const canvas=await drawing.boundingBox();
    assert.ok(canvas.width>240&&canvas.height>=360,'Diagram remains readable');
    if(viewport.width>520)assert.ok(side.x+side.width<=canvas.x+1,'Desktop keeps controls beside diagram');
    const position=await drawing.boundingBox();await page.locator('.room-controls__sidebar').evaluate(e=>e.scrollTop=e.scrollHeight);assert.deepEqual(await drawing.boundingBox(),position);
  }
  assert.deepEqual(errors,[]);
  console.log('PASS diagram physical controls, shared invalid fallback, independent orbit, live lamp move/turn/aim/switch and 3 responsive layouts');
} finally { await browser.close(); }
