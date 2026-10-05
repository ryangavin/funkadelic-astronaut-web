const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

test('random registration remains bounded and restores original spacing for reduced motion', () => {
  const attrs = new Map();
  const spanAttrs = new Map([['dx', '7']]);
  const span = { textContent:'A', getAttribute:key=>spanAttrs.get(key)??null, setAttribute:(key,value)=>spanAttrs.set(key,String(value)), removeAttribute:key=>spanAttrs.delete(key) };
  const word = {textContent:'FUNKADELIC', getAttribute:key=>attrs.get(key)??null, setAttribute:(key,value)=>attrs.set(key,String(value)),removeAttribute:key=>attrs.delete(key),querySelectorAll:()=>[span],getNumberOfChars:()=>10};
  const letter = {style:{translate:'',rotate:''}};
  const astronaut = {style:{translate:'',rotate:''}};
  let tick, change, visibility;
  const reduced = {matches:false,addEventListener:(_,cb)=>change=cb};
  const document = {hidden:false,querySelector:()=>astronaut,querySelectorAll:selector=>selector==='.navigation a, .hero > .streaming-links a'?[]:selector==='.display-letter'?[letter]:[word],addEventListener:(_,cb)=>visibility=cb};
  vm.runInNewContext(fs.readFileSync(require.resolve('../print-cadence.js'),'utf8') + fs.readFileSync(require.resolve('../poster-motion.js'),'utf8'),{document,matchMedia:()=>reduced,Math,setInterval:cb=>(tick=cb,1),clearInterval:()=>{}});
  for(let frame=0;frame<200;frame++) {
    tick();
    assert.equal(letter.style.translate,'');assert.equal(letter.style.rotate,'');
    const [ax, ay] = astronaut.style.translate.split(' ').map(parseFloat);
    assert.ok(Math.abs(ax)<=1.6 && Math.abs(ay)<=2.3);
    assert.ok(Math.abs(parseFloat(astronaut.style.rotate))<=.7);
    for(const [name,limit] of [['dx',.45],['dy',.8]]) {
      let displacement=0;
      const values=attrs.get(name).split(' ').map(Number);
      assert.equal(values.length,10);
      values.forEach(delta=>{displacement+=delta;assert.ok(Math.abs(displacement)<=limit+.001)});
    }
    assert.ok(attrs.get('rotate').split(' ').map(Number).every(angle=>Math.abs(angle)<=.55));
    assert.ok(Math.abs(Number(spanAttrs.get('dx'))-7)<=.9);
  }
  reduced.matches=true;change();
  assert.equal(attrs.size,0);assert.equal(spanAttrs.get('dx'),'7');assert.equal(letter.style.translate,'');assert.equal(letter.style.rotate,'');
  assert.equal(astronaut.style.translate,'');assert.equal(astronaut.style.rotate,'');
  reduced.matches=false;change();assert.ok(attrs.has('rotate'));
  document.hidden=true;visibility();assert.equal(attrs.size,0);
  assert.equal(astronaut.style.translate,'');assert.equal(astronaut.style.rotate,'');
});

test('shared link jitter follows hover/focus, resets for reduced motion, and keeps one timer', () => {
  const letter = {style:{translate:'',rotate:''}};
  const otherLetter = {style:{translate:'',rotate:''}};
  const ink = {children:[letter, otherLetter]};
  const icon = {style:{translate:'',rotate:''}};
  let focused = false, change, visibility, nextId = 0;
  const handlers = {}, timers = new Map();
  const link = { querySelector:()=>ink, querySelectorAll:()=>[icon], matches:()=>focused, addEventListener:(name,fn)=>handlers[name]=fn };
  const reduced = {matches:false,addEventListener:(_,fn)=>change=fn};
  const document = {hidden:false,querySelector:()=>null,querySelectorAll:selector=>selector==='.navigation a, .hero > .streaming-links a'?[link]:[],addEventListener:(_,fn)=>visibility=fn};
  vm.runInNewContext(fs.readFileSync(require.resolve('../print-cadence.js'),'utf8') + fs.readFileSync(require.resolve('../poster-motion.js'),'utf8'), {
    document,matchMedia:()=>reduced,Math,
    setInterval:fn=>{timers.set(++nextId,fn);return nextId;},clearInterval:id=>timers.delete(id),
  });
  assert.equal(timers.size,0);
  handlers.pointerenter({pointerType:'touch'}); assert.equal(timers.size,0);
  for(let i=0;i<20;i++) handlers.pointerenter({pointerType:'mouse'});
  assert.equal(timers.size,1);
  const [x,y]=letter.style.translate.split(' ').map(parseFloat);
  assert.ok(Math.abs(x)<=.45 && Math.abs(y)<=.8);
  assert.ok(Math.abs(parseFloat(letter.style.rotate))<=.55);
  assert.notEqual(letter.style.translate, otherLetter.style.translate);
  assert.ok(icon.style.translate);
  handlers.pointerleave(); assert.equal(icon.style.translate,''); assert.equal(otherLetter.style.translate,''); assert.equal(letter.style.translate,''); assert.equal(timers.size,0);
  focused=true; handlers.focus(); assert.equal(timers.size,1);
  reduced.matches=true;change(); assert.equal(timers.size,0); assert.equal(letter.style.rotate,'');
  reduced.matches=false;change(); assert.equal(timers.size,1);
  document.hidden=true;visibility(); assert.equal(timers.size,0); assert.equal(letter.style.translate,'');
  document.hidden=false;visibility(); assert.equal(timers.size,1);
  focused=false;handlers.blur(); assert.equal(timers.size,0); assert.equal(letter.style.translate,'');
});

test('layered streaming icons jitter as one SVG without moving their underlay or face', () => {
  const underlay = {style:{}}, face = {style:{}};
  const ink = {tagName:'svg', style:{}, children:[underlay, face]};
  const handlers = {};
  const link = {querySelector:()=>ink, querySelectorAll:()=>[ink], matches:()=>false, addEventListener:(name, fn)=>handlers[name]=fn};
  const reduced = {matches:false,addEventListener:()=>{}};
  const document = {hidden:false,querySelector:()=>null,querySelectorAll:selector=>selector==='.navigation a, .hero > .streaming-links a'?[link]:[],addEventListener:()=>{}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../print-cadence.js'),'utf8') + fs.readFileSync(require.resolve('../poster-motion.js'),'utf8'), {
    document,matchMedia:()=>reduced,Math,setInterval:()=>1,clearInterval:()=>{},
  });
  handlers.pointerenter({pointerType:'mouse'});
  assert.ok(ink.style.translate);
  assert.deepEqual(underlay.style, {});
  assert.deepEqual(face.style, {});
  handlers.pointerleave();
  assert.equal(ink.style.translate, '');
  assert.equal(ink.style.rotate, '');
});
