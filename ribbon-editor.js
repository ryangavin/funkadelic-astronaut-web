/* Local ribbon studio. Typography is retained by typography-debug.js. */
(() => {
  const model = window.ribbonStudio;
  if (!model) return;
  const sections = [['listen', 'Hero → Video'], ['learn', 'Video → About'], ['live', 'About → Tour']].filter(([id]) => document.getElementById(id));
  if (!sections.length) return;
  let selected = sections[0][0], draft = model.get();
  const fields = [
    ['frequency', 'Frequency · cycles across page', .01],
    ['amplitude', 'Amplitude · % of ribbon height', .1],
    ['rotation', 'Rotation · degrees', .1],
    ['x', 'Horizontal offset · % of page width', .1],
    ['y', 'Vertical offset · % of ribbon height', .1],
  ];
  const host = document.createElement('div');
  host.id = 'ribbon-editor';
  host.style.cssText = 'position:fixed;z-index:10001;inset:0;pointer-events:none';
  const root = host.attachShadow({mode:'open'});
  root.innerHTML = `<style>
    :host {font:13px/1.45 system-ui,sans-serif;color:#f2f0e9} *{box-sizing:border-box} [hidden]{display:none!important}
    aside{pointer-events:auto;position:absolute;top:12px;right:12px;width:min(370px,calc(100vw - 24px));max-height:calc(100dvh - 24px);overflow:auto;overscroll-behavior:contain;background:rgb(23 28 37 / var(--opacity,.9));border:1px solid #50596a;border-radius:14px;box-shadow:0 12px 60px #0008;padding:18px}
    header{display:flex;align-items:center;justify-content:space-between;cursor:grab;touch-action:none} h2{font-size:18px;margin:0} p,small{color:#bac3d0} p{margin:10px 0}
    button,input,select,textarea{font:inherit;color:inherit;background:#282f3c;border:1px solid #596375;border-radius:6px;padding:7px;min-width:0} button{cursor:pointer} button:hover{background:#3a4659} :focus-visible{outline:2px solid #cef091;outline-offset:2px}
    label{display:block} select{width:100%;margin:6px 0 12px} .field{margin:14px 0}.inputs{display:grid;grid-template-columns:1fr 84px;gap:10px;align-items:center;margin-top:5px} input{width:100%}input[type=range]{accent-color:#cef091;padding:0;min-height:28px}.actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0} #status{color:#cef091;min-height:19px} textarea{width:100%;height:130px}
    #launcher{pointer-events:auto;position:absolute;right:12px;bottom:12px;font-size:12px;opacity:.9}@media print{:host{display:none}}
  </style>
  <button id="launcher" title="Ribbon studio (D)">Ribbons · D</button>
  <aside hidden role="region" aria-label="Ribbon studio">
    <header><h2 tabindex="0" title="Drag to move, or use arrow keys">Ribbon studio</h2><button id="close" aria-label="Close ribbon studio">×</button></header>
    <p>Adjust live · saved in this browser.<br>D toggles · Escape closes · Drag the title to move.</p>
    <label>Ribbon<select id="section"></select></label>
    <button id="locate">Show selected ribbon</button>
    <div id="fields"></div>
    <small>Changes use a smooth, regular sine wave. Reset restores this ribbon’s original design. Offsets scale with the page.</small>
    <div class="actions"><button id="reset">Reset this ribbon</button><button id="reset-all">Reset all ribbons</button></div>
    <label>Panel opacity<input id="opacity" type="range" min="20" max="100" value="90"></label>
    <div class="actions"><button id="dock">Reset panel position</button><button id="copy">Copy settings</button><button id="export">Export JSON</button></div>
    <p id="status" role="status"></p><textarea id="json" aria-label="Ribbon settings for copying" hidden readonly></textarea>
  </aside>`;
  document.body.append(host);
  const $ = id => root.getElementById(id), panel = root.querySelector('aside');
  for (const [id,label] of sections) $('section').add(new Option(label,id));
  for (const [key,label,step] of fields) {
    const [min,max] = model.limits[key], row = document.createElement('div');
    row.className='field';
    row.innerHTML=`<label for="${key}-number">${label}</label><div class="inputs"><input id="${key}-range" aria-label="${label}" type="range" min="${min}" max="${max}" step="${step}"><input id="${key}-number" type="number" min="${min}" max="${max}" step="${step}"></div>`;
    row.querySelectorAll('input').forEach(input => input.addEventListener('input',()=>{
      if (input.value==='') return;
      const value=Number(input.value);
      if(!Number.isFinite(value)||value<min||value>max)return;
      draft[selected] = {...model.defaults[selected], ...draft[selected], [key]:value};
      save(); render(input);
    }));
    $('fields').append(row);
  }
  function save() {
    const saved=model.set(draft);draft=model.get();
    $('status').textContent=saved?'Saved locally.':'Storage unavailable — export to keep these settings.';
    $('json').hidden=true;
  }
  function render(active) {
    const values={...model.defaults[selected],...draft[selected]};
    for(const [key] of fields) for(const suffix of ['range','number']) {
      const input=$(`${key}-${suffix}`);
      if(input!==active)input.value=Number(values[key].toFixed(3));
    }
  }
  $('section').onchange=()=>{selected=$('section').value;render();};
  $('reset').onclick=()=>{delete draft[selected];save();render();};
  $('reset-all').onclick=()=>{draft={};save();render();};
  $('locate').onclick=()=>document.getElementById(selected).scrollIntoView({block:'start',behavior:'instant'});
  let previousFocus;
  function toggle(open) {
    panel.hidden=!open;$('launcher').hidden=open;
    if(open){previousFocus=document.activeElement;render();place();root.querySelector('h2').focus();}
    else if(previousFocus?.isConnected)previousFocus.focus();
  }
  $('launcher').onclick=()=>toggle(true);$('close').onclick=()=>toggle(false);
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!panel.hidden){toggle(false);event.preventDefault();return;}
    if(event.repeat||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
    if(event.composedPath().some(n=>n instanceof Element&&(n.matches('input,select,textarea')||n.isContentEditable)))return;
    if(event.key.toLowerCase()==='d'){event.preventDefault();toggle(panel.hidden);}
  });
  const panelKey='fa-ribbon-panel-v1';
  let position={x:null,y:null,opacity:90},drag;
  try{const v=JSON.parse(localStorage.getItem(panelKey));if(v){if(Number.isFinite(v.x)&&Number.isFinite(v.y)){position.x=v.x;position.y=v.y;}if(Number.isFinite(v.opacity))position.opacity=Math.max(20,Math.min(100,v.opacity));}}catch{}
  function savePosition(){try{localStorage.setItem(panelKey,JSON.stringify(position));}catch{}}
  function place(){
    panel.style.setProperty('--opacity',position.opacity/100);$('opacity').value=position.opacity;
    if(position.x===null){panel.style.left='';panel.style.top='';panel.style.right='';return;}
    position.x=Math.max(0,Math.min(position.x,innerWidth-panel.offsetWidth));position.y=Math.max(0,Math.min(position.y,innerHeight-panel.offsetHeight));
    panel.style.left=`${position.x}px`;panel.style.top=`${position.y}px`;panel.style.right='auto';
  }
  $('opacity').oninput=()=>{position.opacity=Number($('opacity').value);place();savePosition();};
  $('dock').onclick=()=>{position.x=position.y=null;place();savePosition();};
  const handle=root.querySelector('header');
  handle.onpointerdown=e=>{if(e.target.closest('button')||e.button!==0)return;const r=panel.getBoundingClientRect();drag={x:e.clientX-r.left,y:e.clientY-r.top};handle.setPointerCapture(e.pointerId);e.preventDefault();};
  handle.onpointermove=e=>{if(!drag)return;position.x=e.clientX-drag.x;position.y=e.clientY-drag.y;place();};
  handle.onpointerup=handle.onpointercancel=()=>{drag=null;savePosition();};
  handle.onlostpointercapture=()=>{drag=null;};
  root.querySelector('h2').onkeydown=e=>{const d={ArrowLeft:[-16,0],ArrowRight:[16,0],ArrowUp:[0,-16],ArrowDown:[0,16]}[e.key];if(!d)return;const r=panel.getBoundingClientRect();position.x=r.left+d[0];position.y=r.top+d[1];place();savePosition();e.preventDefault();};
  addEventListener('resize',()=>{if(!panel.hidden)place();});
  function json(){return JSON.stringify({schemaVersion:1,units:{frequency:'cycles per page width',amplitude:'percent of ribbon height',rotation:'degrees',x:'percent of page width',y:'percent of ribbon height'},ribbons:draft},null,2);}
  $('copy').onclick=async()=>{const text=json();try{await navigator.clipboard.writeText(text);$('status').textContent='Settings copied.';}catch{$('json').hidden=false;$('json').value=text;$('json').focus();$('json').select();}};
  $('export').onclick=()=>{const url=URL.createObjectURL(new Blob([json()],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='funkadelic-ribbons.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  place();render();
})();
