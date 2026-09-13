/* Temporary art-direction overlay. Remove this script to remove all layout drafts.
   Export describes intent; it is deliberately not a production configuration file. */
(() => {
  const C=window.LayoutStudioCore;
  if(!C || document.querySelector('#layout-studio')) return;
  const storageKey=`fa-layout-studio-v1:${location.pathname}`, panelKey='fa-layout-panel-v1';
  const clone=v=>JSON.parse(JSON.stringify(v));
  const read=k=>{try{return JSON.parse(localStorage.getItem(k));}catch{return null;}};
  let storageFailed=false;
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));storageFailed=false;}catch{storageFailed=true;}};
  const legacy=window.typographyDrafts;
  const saved=read(storageKey);
  let draft=C.validate(saved?.draft), legacyDraft=legacy?.get() || {}, originals=new Map();
  // Retain old draft keys verbatim. Migration only writes the new studio key.
  if(!saved) {
    const ribbons=read('fa-ribbons-v1') || {};
    for(const t of C.targets.filter(t=>t.ribbon)) {
      const v=ribbons[t.ribbon]; if(!v) continue;
      draft.all[t.id]={frequency:v.frequency,amplitude:v.amplitude,ribbonRotation:v.rotation,ribbonX:v.x,ribbonY:v.y};
    }
    draft=C.validate(draft);
  } else if(saved.legacyTypography) legacyDraft=saved.legacyTypography;
  let member=window.bandGalleryStudio?.current() || 'band', scope='all', selected='wordmark', preview=true, picking=false;
  let undo=[], redo=[], gesture=null, choosing=false;
  const styles=document.createElement('style'); styles.id='layout-studio-drafts';document.head.append(styles);
  // Word groups contain the original text and its painted jitter glyphs. Jitter stays inside.
  for(const id of ['funk','astro']) {
    const text=document.querySelector(`.${id}-word`);
    if(!text || text.parentElement.matches('[data-layout-word]')) continue;
    const group=document.createElementNS('http://www.w3.org/2000/svg','g');group.dataset.layoutWord=id;
    text.before(group);group.append(text);
    for(const glyph of [...group.parentElement.querySelectorAll(':scope > .moving-glyph')]) {
      if(glyph.querySelector(`.${id}-word`)) group.append(glyph);
    }
  }
  const targets=C.targets.filter(t=>document.querySelector(t.selector));
  const byId=id=>targets.find(t=>t.id===id);
  if(!byId(selected)) selected=targets[0]?.id;
  if(!selected) return;
  const activeScope=()=>innerWidth<=760?'mobile':'desktop';
  const unit=()=>innerWidth/(innerWidth<=760?390:1440);
  const entryKey=t=>C.key(t,member);
  const snapshot=()=>({draft:clone(draft),legacyTypography:clone(legacyDraft)});
  function checkpoint(){undo.push(snapshot());if(undo.length>80)undo.shift();redo=[];}
  function save(){write(storageKey,snapshot());}
  function effective(t){return C.effective(draft,entryKey(t),activeScope());}
  function selector(t){return t.member?`#learn[data-member="${member}"] ${t.selector}`:t.selector;}
  // The initial overview previously had no data-member; make its identity explicit.
  const band=document.querySelector('#learn');if(band && !band.dataset.member) band.dataset.member='band';
  const lengths=new Map();
  for(const node of document.querySelectorAll('.funk-word.print-jitter,.astro-word.print-jitter')) lengths.set(node,node.getAttribute('textLength'));
  const baseline=new Map();
  let rebuilding=false;
  function apply() {
    styles.textContent='';
    legacy?.set(legacyDraft);legacy?.preview(preview);
    for(const [node,length] of lengths) if(length!==null)node.setAttribute('textLength',length);
    const rules=[], u=unit(); baseline.clear();
    // Read all baselines before applying any overlay rule, avoiding accumulated transforms.
    for(const t of targets) {
      const node=document.querySelector(t.selector);if(!node)continue;
      const css=getComputedStyle(node), box=node.getBoundingClientRect();
      baseline.set(t.id,{transform:css.transform,box:{x:box.x+scrollX,y:box.y+scrollY,width:box.width,height:box.height},font:css.fontFamily});
    }
    if(preview) for(const t of targets) {
      if(t.ribbon) continue;
      const v=effective(t), node=document.querySelector(t.selector);if(!node || !Object.keys(v).length)continue;
      const css={}, sel=selector(t), px=n=>`${n*(t.svg?1:u)}px`;
      const textSelector=t.svg?`${sel} text`:t.id==='biography'||t.id==='story'?`${sel} p`:sel;
      const add=(s,c)=>{if(Object.keys(c).length)rules.push(`${s}{${Object.entries(c).map(([k,v])=>`${k}:${v} !important`).join(';')}}`);};
      if(['x','y','rotation','scale','scaleX','scaleY'].some(k=>v[k]!==undefined)) {
        const base=baseline.get(t.id)?.transform;
        css.transform=`translate(${px(v.x||0)},${px(v.y||0)}) rotate(${v.rotation||0}deg) scale(${(v.scale??1)*(v.scaleX??1)},${(v.scale??1)*(v.scaleY??1)}) ${base==='none'?'':base||''}`;
        css['transform-origin']=t.svg?'0 0':'center center';
      }
      if(v.width!==undefined){css.width=px(v.width);css['max-width']='none';}
      const text={};
      if(v.size!==undefined)text['font-size']=px(v.size);
      if(v.line!==undefined)text['line-height']=v.line;
      if(v.tracking!==undefined)text['letter-spacing']=`${v.tracking}em`;
      if(v.weight!==undefined)text['font-weight']=v.weight;
      add(textSelector,text);
      if(v.paragraph!==undefined)add(`${sel} p + p`,{'margin-top':px(v.paragraph)});
      if(v.paragraph!==undefined)add(`${sel} p`,{'margin-bottom':'0'});
      if(v.glyph!==undefined)add(`${sel} .display-letter`,{transform:`scaleX(${v.glyph})`});
      if(v.gap!==undefined)add(`${sel} .display-letter`,{'margin-inline':`${v.gap}em`});
      if(v.iconSize!==undefined) {
        const links=t.id==='streaming'?`${sel} > a`:sel;
        add(links,{width:px(v.iconSize),height:px(v.iconSize),'min-width':px(v.iconSize),'min-height':px(v.iconSize)});
        add(`${links} .streaming-logo`,{width:px(v.iconSize),height:px(v.iconSize)});
      }
      if(v.spacing!==undefined)css.gap=px(v.spacing);
      if(v.length!==undefined)node.querySelector('text.print-jitter')?.setAttribute('textLength',v.length);
      add(sel,css);
    }
    styles.textContent=rules.join('\n');
    const ribbons={};
    if(preview) for(const t of targets.filter(t=>t.ribbon)) {
      const v=effective(t), result={};
      for(const [key,name] of [['frequency','frequency'],['amplitude','amplitude'],['ribbonX','x'],['ribbonY','y'],['ribbonRotation','rotation']]) if(v[key]!==undefined)result[name]=v[key];
      if(Object.keys(result).length)ribbons[t.ribbon]=result;
    }
    window.ribbonStudio?.preview(ribbons);
    // Rebuild SVG glyphs only after text metrics change, not on every highlight frame.
    if(!rebuilding){rebuilding=true;requestAnimationFrame(()=>{window.dispatchEvent(new Event('layout-studio-typechange'));rebuilding=false;});}
  }
  const host=document.createElement('div');host.id='layout-studio';
  host.style.cssText='position:fixed;inset:0;z-index:2147483646;pointer-events:none';
  const root=host.attachShadow({mode:'open'});
  root.innerHTML=`<style>
    :host{font:13px/1.4 system-ui,sans-serif;color:#f7f5ee}*{box-sizing:border-box}[hidden]{display:none!important}
    aside{pointer-events:auto;position:absolute;right:12px;top:12px;width:min(366px,calc(100vw - 24px));max-height:calc(100dvh - 24px);overflow:auto;background:rgb(23 28 37 / var(--opacity,.94));padding:16px;border:1px solid #6b7586;border-radius:12px;box-shadow:0 8px 35px #0007}
    header{display:flex;align-items:center;justify-content:space-between;cursor:grab;touch-action:none}h2{font:600 18px system-ui;margin:0}p,small{color:#ccd1da}p{margin:9px 0}label{display:block;margin-top:8px}button,input,select,textarea{font:inherit;color:inherit;background:#293240;border:1px solid #727c8b;border-radius:5px;padding:6px;min-width:0}select,textarea{width:100%}button{cursor:pointer}button:hover{background:#43516a}button:disabled{opacity:.45;cursor:default}:focus-visible{outline:2px solid #c8ed8d;outline-offset:2px}.row{display:flex;gap:6px;flex-wrap:wrap;margin:9px 0}.field{margin-top:10px}.pair{display:grid;grid-template-columns:1fr 85px;gap:8px}.pair input{width:100%}input[type=range]{accent-color:#c8ed8d;padding:0}textarea{height:140px}#opacity{width:100%}#status{min-height:18px;color:#d6eead}#launcher{position:absolute;bottom:12px;right:12px;pointer-events:auto}#highlight{position:fixed;border:2px dashed #c8ed8d;box-shadow:0 0 0 1px #142211;pointer-events:none}#selection-label{position:absolute;left:0;bottom:100%;background:#1b2c1c;color:#efffe0;white-space:nowrap;padding:2px 5px}#drag{position:fixed;pointer-events:auto;cursor:move;touch-action:none;width:28px;height:28px;border-radius:50%;background:#c8ed8d;color:#142211;padding:0}#nudge{padding:7px;border:1px solid #727c8b;border-radius:5px;cursor:move}#nudge:focus{outline:2px solid #c8ed8d}details{margin:12px 0}input[type=checkbox]{vertical-align:middle} @media print{:host{display:none}}
  </style>
  <button id="launcher">Layout · D</button>
  <div id="highlight" hidden><span id="selection-label"></span></div><button id="drag" hidden aria-label="Drag selected target">✥</button>
  <aside hidden role="region" aria-label="Layout studio">
    <header><h2 tabindex="0" title="Drag panel; arrow keys move panel">Layout studio</h2><button id="close" aria-label="Close Layout studio">×</button></header>
    <p>Temporary design draft · saved in this browser.</p>
    <label>Target<select id="target"></select></label>
    <label>Band introduction<select id="member"><option value="band">The band</option><option value="ryan">Ryan Gavin</option><option value="kevin">Kevin O’Neill</option><option value="sam">Sam Luba</option></select></label>
    <label>Scope<select id="scope"><option value="all">Shared · both layouts</option><option value="desktop">Desktop · above 760px</option><option value="mobile">Mobile · up to 760px</option></select></label>
    <p id="context"></p>
    <div class="row"><button id="pick">Pick from page</button><button id="locate">Show target</button></div>
    <div id="nudge" tabindex="0" role="group" aria-label="Nudge selected target with arrow keys">Nudge: focus here, use arrows · Shift = 10×</div>
    <div id="fields"></div>
    <div class="row"><button id="undo">Undo</button><button id="redo">Redo</button><button id="reset">Reset selected scope</button></div>
    <label><input id="defaults" type="checkbox"> Preview site defaults (keep draft)</label>
    <details><summary>Panel & handoff</summary>
      <label>Panel opacity<input id="opacity" type="range" min="25" max="100" value="94"></label>
      <button id="dock">Reset panel position</button>
      <div class="row"><button id="export">Export JSON</button><button id="copy">Copy JSON</button></div>
      <label>Import / export handoff<textarea id="json" spellcheck="false" placeholder="Paste a Layout studio export here"></textarea></label>
      <button id="import">Import handoff</button>
    </details>
    <p id="status" role="status"></p>
  </aside>`;
  document.body.append(host);
  const $=id=>root.getElementById(id), panel=root.querySelector('aside');
  targets.forEach(t=>$('target').add(new Option(t.label,t.id)));
  const status=text=>$('status').textContent=text;
  let position=read(panelKey)||read('fa-ribbon-panel-v1')||{x:null,y:null,opacity:94};
  if(!Number.isFinite(position.opacity))position.opacity=94;
  position.opacity=Math.max(25,Math.min(100,position.opacity));
  if(!Number.isFinite(position.x)||!Number.isFinite(position.y))position.x=position.y=null;
  function place(){
    panel.style.setProperty('--opacity',position.opacity/100);$('opacity').value=position.opacity;
    if(position.x===null){panel.style.left='';panel.style.top='12px';panel.style.right='12px';return;}
    position.x=Math.max(0,Math.min(position.x,innerWidth-panel.offsetWidth));position.y=Math.max(0,Math.min(position.y,innerHeight-panel.offsetHeight));
    panel.style.left=`${position.x}px`;panel.style.top=`${position.y}px`;panel.style.right='auto';
  }
  function currentValue(t,field) {
    const v=C.effective(draft,entryKey(t),scope);if(v[field]!==undefined)return v[field];
    if(t.ribbon){const map={ribbonX:'x',ribbonY:'y',ribbonRotation:'rotation'};return window.ribbonStudio.defaults[t.ribbon][map[field]||field];}
    const node=document.querySelector(t.selector), css=getComputedStyle(node), u=t.svg?1:unit();
    const text=getComputedStyle((t.svg?node.querySelector('text'):node.querySelector('p'))||node);
    if(['x','y','rotation'].includes(field))return 0;
    if(['scale','scaleX','scaleY'].includes(field))return 1;
    if(field==='width')return parseFloat(css.width)/u || node.getBoundingClientRect().width/u;
    if(field==='size')return parseFloat(text.fontSize)/u;
    if(field==='line')return parseFloat(text.lineHeight)/parseFloat(text.fontSize)||1.4;
    if(field==='weight')return parseFloat(text.fontWeight)||400;
    if(field==='tracking')return parseFloat(text.letterSpacing)/parseFloat(text.fontSize)||0;
    if(field==='paragraph')return parseFloat(text.marginBottom)/u ||0;
    if(field==='iconSize')return node.querySelector('.streaming-logo')?.getBoundingClientRect().width/unit()||48;
    if(field==='spacing')return parseFloat(css.gap)/unit()||0;
    if(field==='glyph')return parseFloat(css.getPropertyValue('--cutout-stretch'))||1;
    if(field==='gap')return .07;
    if(field==='length')return Number(node.querySelector('text.print-jitter')?.getAttribute('textLength'))||755;
    return 0;
  }
  function updateButtons(){ $('undo').disabled=!undo.length;$('redo').disabled=!redo.length; }
  function render() {
    const t=byId(selected);$('target').value=selected;$('member').value=member;$('scope').value=scope;
    $('member').parentElement.hidden=!t.member;
    $('nudge').hidden=!!t.ribbon;
    $('context').textContent=t.ribbon?'Ribbon values scale with the page.':`Lengths use ${t.svg?'SVG':activeScope()==='mobile'?'390-wide mobile':'1440-wide desktop'} reference units. ${scope!=='all'&&scope!==activeScope()?'This scope is inactive at the current width.':''}`;
    $('fields').replaceChildren();
    for(const field of t.fields) {
      const [label,min,max,step]=C.fields[field], row=document.createElement('div');row.className='field';
      const own=draft[scope][entryKey(t)]?.[field]!==undefined;
      row.innerHTML=`<label for="${field}-number">${label}${own?' · draft':''}</label><div class="pair"><input type="range" id="${field}-range" aria-label="${label}" min="${min}" max="${max}" step="${step}"><input type="number" id="${field}-number" min="${min}" max="${max}" step="${step}"></div>`;
      const value=Math.round(currentValue(t,field)*1000)/1000;
      row.querySelectorAll('input').forEach(input=>{
        input.value=value;input.disabled=!preview;
        input.addEventListener('focus',()=>gesture=null);
        input.addEventListener('pointerdown',()=>gesture=null);
        input.addEventListener('change',()=>gesture=null);
        input.addEventListener('input',()=>{
          const value=Number(input.value);if(input.value===''||!Number.isFinite(value)||value<min||value>max)return;
          if(gesture!==input){checkpoint();gesture=input;}
          edit(field,value);row.querySelectorAll('input').forEach(other=>{if(other!==input)other.value=value;});
        });
      });
      $('fields').append(row);
    }
    updateButtons();place();
  }
  function edit(field,value){
    const id=entryKey(byId(selected));draft[scope][id]={...draft[scope][id],[field]:value};
    draft=C.validate(draft);save();apply();updateButtons();status(storageFailed?'Browser storage unavailable. Export to keep your draft.':'Draft saved locally. Production styles are unchanged.');
  }
  function toggle(open){panel.hidden=!open;$('launcher').hidden=open;picking=false;$('pick').textContent='Pick from page';if(open){render();root.querySelector('h2').focus();}else{$('highlight').hidden=true;$('drag').hidden=true;$('launcher').focus();}}
  async function showMember(id){
    choosing=true;status('Loading introduction…');await window.bandGalleryStudio?.select(id);
    member=window.bandGalleryStudio?.current()||band?.dataset.member||'band';choosing=false;
    apply();render();status(member===id?'Introduction selected.':'Photo unavailable; kept the current introduction.');
  }
  $('target').onchange=()=>{selected=$('target').value;render();};
  $('member').onchange=()=>showMember($('member').value);
  $('scope').onchange=()=>{scope=$('scope').value;render();};
  $('launcher').onclick=()=>toggle(true);$('close').onclick=()=>toggle(false);
  $('locate').onclick=()=>document.querySelector(byId(selected).selector)?.scrollIntoView({block:'center',behavior:'instant'});
  $('pick').onclick=()=>{picking=!picking;$('pick').textContent=picking?'Click a page element…':'Pick from page';};
  document.addEventListener('click',event=>{
    if(!picking||event.composedPath().includes(host))return;
    const candidates=targets.filter(t=>{const n=document.querySelector(t.selector);return n && (n===event.target||n.contains(event.target));});
    candidates.sort((a,b)=>{const x=document.querySelector(a.selector).getBoundingClientRect(),y=document.querySelector(b.selector).getBoundingClientRect();return x.width*x.height-y.width*y.height;});
    if(!candidates.length){status('Choose a title, icon, astronaut, biography, or ribbon.');return;}
    event.preventDefault();event.stopImmediatePropagation();selected=candidates[0].id;picking=false;$('pick').textContent='Pick from page';render();
  },true);
  $('reset').onclick=()=>{checkpoint();delete draft[scope][entryKey(byId(selected))];save();apply();render();status('Selected scope restored to inherited settings.');};
  function travel(from,to){if(!from.length)return;to.push(snapshot());const state=from.pop();draft=C.validate(state.draft);legacyDraft=state.legacyTypography;save();apply();render();}
  $('undo').onclick=()=>travel(undo,redo);$('redo').onclick=()=>travel(redo,undo);
  $('defaults').onchange=()=>{preview=!$('defaults').checked;apply();render();status(preview?'Showing saved draft.':'Showing production defaults. Draft retained.');};
  $('nudge').onkeydown=event=>{
    const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];if(!delta||!preview)return;
    event.preventDefault();if(!event.repeat)checkpoint();const t=byId(selected),v=C.effective(draft,entryKey(t),scope),step=event.shiftKey?10:1;
    if(delta[0])edit('x',(v.x||0)+delta[0]*step);if(delta[1])edit('y',(v.y||0)+delta[1]*step);render();$('nudge').focus();
  };
  let targetDrag=null,panelDrag=null;
  $('drag').onpointerdown=event=>{
    if(event.button!==0||!preview)return;const t=byId(selected);if(t.ribbon)return;
    checkpoint();const v=C.effective(draft,entryKey(t),scope),node=document.querySelector(t.selector);
    const factor=t.svg?node.ownerSVGElement.getBoundingClientRect().width/node.ownerSVGElement.viewBox.baseVal.width:unit();
    targetDrag={x:event.clientX,y:event.clientY,startX:v.x||0,startY:v.y||0,factor};$('drag').setPointerCapture(event.pointerId);event.preventDefault();
  };
  $('drag').onpointermove=event=>{if(!targetDrag)return;const d=targetDrag;edit('x',d.startX+(event.clientX-d.x)/d.factor);edit('y',d.startY+(event.clientY-d.y)/d.factor);};
  $('drag').onpointerup=$('drag').onpointercancel=()=>{targetDrag=null;render();};
  const handle=root.querySelector('header');
  handle.onpointerdown=event=>{if(event.button!==0||event.target.closest('button'))return;const r=panel.getBoundingClientRect();panelDrag={x:event.clientX-r.x,y:event.clientY-r.y};handle.setPointerCapture(event.pointerId);event.preventDefault();};
  handle.onpointermove=event=>{if(!panelDrag)return;position.x=event.clientX-panelDrag.x;position.y=event.clientY-panelDrag.y;place();};
  handle.onpointerup=handle.onpointercancel=()=>{panelDrag=null;write(panelKey,position);};
  root.querySelector('h2').onkeydown=event=>{const d={ArrowLeft:[-16,0],ArrowRight:[16,0],ArrowUp:[0,-16],ArrowDown:[0,16]}[event.key];if(!d)return;event.preventDefault();const r=panel.getBoundingClientRect();position.x=r.x+d[0];position.y=r.y+d[1];place();write(panelKey,position);};
  $('opacity').oninput=()=>{position.opacity=Number($('opacity').value);place();write(panelKey,position);};
  $('dock').onclick=()=>{position.x=position.y=null;place();write(panelKey,position);};
  function handoff(){
    const measurements=targets.filter(t=>!t.member||member===(band?.dataset.member||'band')).map(t=>{
      const node=document.querySelector(t.selector),r=node.getBoundingClientRect(),parent=node.closest('.scene,.hero')||document.body,pr=parent.getBoundingClientRect();
      return {target:t.id,member:t.member?member:undefined,selector:t.selector,visible:!!r.width&&!!r.height,reference:baseline.get(t.id),rendered:{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height},section:parent.id,relativeToSection:{leftPercent:(r.x-pr.x)/pr.width*100,topPercent:(r.y-pr.y)/pr.height*100,widthPercent:r.width/pr.width*100},font:getComputedStyle(node).fontFamily};
    });
    return {schemaVersion:1,kind:'funkadelic-layout-draft',purpose:'Temporary design handoff. Adopt final intent into production CSS/HTML; do not load this as production layout configuration.',draft:clone(draft),legacyTypography:clone(legacyDraft),context:{path:location.pathname,viewport:{width:innerWidth,height:innerHeight},referenceWidths:{desktop:1440,mobile:390},breakpoint:760,currentMember:member,activeScope:activeScope(),previewing:preview?'draft':'site defaults',units:'Lengths are responsive reference pixels (SVG words use SVG units); x/y/rotation/scale are temporary adjustments relative to unmodified layout. Ribbon fields carry their own percentage units.'},targets:targets.map(({id,label,selector,member,ribbon})=>({id,label,selector,perMember:!!member,ribbon})),measurements};
  }
  $('export').onclick=()=>{const text=JSON.stringify(handoff(),null,2);$('json').value=text;const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='funkadelic-layout-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Exported design handoff. Nothing was adopted into site defaults.');};
  $('copy').onclick=async()=>{const text=JSON.stringify(handoff(),null,2);$('json').value=text;try{await navigator.clipboard.writeText(text);status('Handoff copied.');}catch{status('Select and copy the handoff text below.');$('json').focus();$('json').select();}};
  $('import').onclick=()=>{try{const data=JSON.parse($('json').value),next=C.importHandoff(data);checkpoint();draft=next;if(data.legacyTypography)legacyDraft=data.legacyTypography;save();apply();render();status('Imported draft. Undo restores the previous draft.');}catch(error){status(`Import not applied: ${error.message}`);}};
  document.addEventListener('keydown',event=>{
    const editing=event.composedPath().some(n=>n instanceof Element&&(n.matches('input,textarea,select')||n.isContentEditable));
    if(event.key==='Escape'&&!panel.hidden){toggle(false);event.preventDefault();return;}
    if(editing||event.repeat||event.ctrlKey||event.metaKey||event.altKey)return;
    if(event.key.toLowerCase()==='d'){event.preventDefault();toggle(panel.hidden);}
  });
  if(band)new MutationObserver(()=>{if(choosing)return;member=band.dataset.member||'band';apply();if(!panel.hidden)render();}).observe(band,{attributes:true,attributeFilter:['data-member']});
  addEventListener('resize',()=>{apply();if(!panel.hidden){render();place();}});
  let last=0;
  function highlight(time){
    if(time-last>80){last=time;
      const t=byId(selected),n=document.querySelector(t.selector),r=n?.getBoundingClientRect(),shown=!panel.hidden&&r?.width>0&&r?.height>0;
      $('highlight').hidden=!shown;$('drag').hidden=!shown||!preview||!!t.ribbon;
      if(shown){Object.assign($('highlight').style,{left:`${r.x}px`,top:`${r.y}px`,width:`${r.width}px`,height:`${r.height}px`});$('selection-label').textContent=t.label;Object.assign($('drag').style,{left:`${r.x+r.width/2-14}px`,top:`${r.y-14}px`});}
    }
    requestAnimationFrame(highlight);
  }
  apply();save();render();requestAnimationFrame(highlight);
})();
