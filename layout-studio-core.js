/* Pure, bounded draft data. This module is only used by the temporary editor. */
(function (root) {
  const scopes = ['all', 'desktop', 'mobile'];
  const members = ['band', 'ryan', 'kevin', 'sam'];
  const fields = {
    x: ['Horizontal adjustment', -1600, 1600, 1], y: ['Vertical adjustment', -1600, 1600, 1],
    rotation: ['Rotation adjustment · degrees', -180, 180, .5], scale: ['Proportional scale', .1, 4, .01],
    width: ['Width', 10, 1800, 1], size: ['Font size', 4, 400, .5], line: ['Line height', .6, 3, .05],
    paragraph: ['Paragraph spacing', 0, 150, 1], iconSize: ['Icon size', 8, 300, 1], spacing: ['Icon spacing', 0, 300, 1],
    tracking: ['Letter spacing · em', -.2, .5, .005], weight: ['Font weight', 100, 900, 100],
    scaleX: ['Horizontal scale', .1, 4, .01], scaleY: ['Vertical scale', .1, 4, .01],
    glyph: ['Letter width scale', .5, 2, .01], gap: ['Letter margins · em', -.1, .3, .005], length: ['Text length · SVG units', 100, 1200, 1],
    frequency: ['Frequency · cycles per page width', .25, 4, .01], amplitude: ['Amplitude · % ribbon height', 0, 80, .1],
    ribbonX: ['Horizontal offset · % page width', -100, 100, .1], ribbonY: ['Vertical offset · % ribbon height', -100, 100, .1],
    ribbonRotation: ['Rotation · degrees', -20, 20, .1],
  };
  const move = ['x', 'y', 'rotation', 'scale'];
  const type = ['size', 'line', 'tracking', 'weight', 'glyph', 'gap'];
  const targets = [
    {id:'wordmark', label:'Whole wordmark', selector:'.wordmark', fields:[...move,'width']},
    {id:'funk', label:'FUNKADELIC word', selector:'[data-layout-word="funk"]', fields:[...move,'scaleX','scaleY','size','tracking','length'], svg:true},
    {id:'astro', label:'ASTRONAUT word', selector:'[data-layout-word="astro"]', fields:[...move,'scaleX','scaleY','size','tracking','length'], svg:true},
    {id:'streaming',label:'Streaming icon group',selector:'.hero > .streaming-links',fields:[...move,'iconSize','spacing']},
    ...['Apple Music','Spotify','YouTube','Deezer'].map((label,i)=>({id:`icon${i+1}`,label:`${label} icon`,selector:`.hero > .streaming-links > a:nth-child(${i+1})`,fields:[...move,'iconSize']})),
    {id:'astronaut',label:'Astronaut cutout',selector:'.astronaut',fields:[...move,'width']},
    {id:'bandHeading',label:'The Band heading',selector:'#learn-title',member:true,fields:[...move,'width',...type]},
    {id:'name',label:'Member name',selector:'#member-name',member:true,fields:[...move,'width',...type]},
    {id:'role',label:'Subtitle / role',selector:'#member-role',member:true,fields:[...move,'width',...type]},
    {id:'biography',label:'Whole biography container',selector:'#band-slide',member:true,fields:[...move,'width','size','line','paragraph']},
    {id:'story',label:'Biography copy',selector:'#member-story',member:true,fields:[...move,'width',...type,'paragraph']},
    {id:'tourHeading',label:'Tour heading',selector:'#live-title',fields:[...move,'width',...type]},
    ...[['listen','Hero → Video'],['learn','Video → Band'],['live','Band → Tour'],['footer','Tour → Footer']].map(([id,label])=>({id:`ribbon-${id}`,label:`Ribbon · ${label}`,selector:`#${id} > .seam`,ribbon:id,fields:['frequency','amplitude','ribbonRotation','ribbonX','ribbonY']})),
  ];
  const empty = () => ({all:{},desktop:{},mobile:{}});
  const key = (target,member='band') => target.member ? `${target.id}:${member}` : target.id;
  function validate(data) {
    const clean=empty();
    for(const scope of scopes) for(const t of targets) for(const member of t.member?members:['band']) {
      const id=key(t,member), values=data?.[scope]?.[id];
      if(!values || typeof values!=='object') continue;
      const entry={};
      for(const f of t.fields) {
        const v=values[f], [,min,max]=fields[f];
        if(typeof v==='number' && Number.isFinite(v) && v>=min && v<=max) entry[f]=v;
      }
      if(Object.keys(entry).length) clean[scope][id]=entry;
    }
    return clean;
  }
  const effective=(draft,id,scope)=>({...draft.all[id],...(scope==='all'?{}:draft[scope][id])});
  function importHandoff(data) {
    if(data?.schemaVersion!==1 || data?.kind!=='funkadelic-layout-draft' || !data.draft) throw Error('Choose a Layout studio export (version 1).');
    return validate(data.draft);
  }
  const api={scopes,members,fields,targets,empty,key,validate,effective,importHandoff};
  if(typeof module!=='undefined') module.exports=api; else root.LayoutStudioCore=api;
})(typeof window==='undefined'?globalThis:window);
