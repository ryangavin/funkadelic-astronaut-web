import { chapters, projects, journeyLength, viewportLength, wrapJourney, spinePathX } from './journey';
export interface TreeGeometry { lines:Float32Array[];orders:number[];junctions:{x:number;y:number}[];anchors:Map<number,{x:number;y:number}> }
const signal=(samples:Int8Array,worldY:number)=>{const sample=((worldY%viewportLength+viewportLength)%viewportLength)/viewportLength*samples.length,index=Math.floor(sample)%samples.length,fraction=sample-Math.floor(sample);return (samples[index]*(1-fraction)+samples[(index+1)%samples.length]*fraction)/128;};
const center=(worldY:number,width:number)=>.5+spinePathX(worldY)/width;
export const waveformX=(samples:Int8Array,worldY:number,width:number)=>center(worldY,width)+signal(samples,worldY)*.18/width;
export function buildTreeGeometry(samples:Int8Array,position:number,width:number):TreeGeometry {
  const lines:Float32Array[]=[],orders:number[]=[],junctions:{x:number;y:number}[]=[],anchors=new Map<number,{x:number;y:number}>();
  const trace=(start:number,end:number,steps:number,order:number,xAt:(t:number,y:number)=>number)=>{
    const a=Math.max(start,position),b=Math.min(end,position+viewportLength);if(a>=b)return;
    const points=new Float32Array((steps+1)*2);
    for(let i=0;i<=steps;i++){const y=a+(b-a)*i/steps,t=(y-start)/(end-start);points[i*2]=xAt(t,y)+signal(samples,y)*.18/width;points[i*2+1]=(y-position)/viewportLength;}lines.push(points);orders.push(order);
  };
  const node=(x:number,y:number)=>{if(y>=position&&y<=position+viewportLength)junctions.push({x:x+signal(samples,y)*.18/width,y:(y-position)/viewportLength});};
  const edge=(a:{x:number;y:number},b:{x:number;y:number},order:number)=>{trace(a.y,b.y,48,order,t=>a.x+(b.x-a.x)*t*t*(3-2*t));node(a.x,a.y);};
  trace(position,position+viewportLength,samples.length,0,(_,y)=>center(y,width));
  chapters.forEach((chapter,chapterIndex)=>{
    for(let group=0;group<chapter.projects.length;group+=3){
      const members=chapter.projects.slice(group,group+3),side=members[0].side;
      const first=members[0],last=members[members.length-1];
      const baseStart=first.worldY-1.5,baseEnd=last.worldY+.3;
      const start=position+wrapJourney(baseStart-position),end=start+baseEnd-baseStart;
      for(const shift of [0,-journeyLength]){
        const a=start+shift,b=end+shift,root=center(a,width),tip=side<0?.29:.71;
        const primary=(y:number)=>{const t=Math.max(0,Math.min(1,(y-a)/(b-a)));return root+(tip-root)*t*t*(3-2*t);};
        trace(a,b,64,1,(_,y)=>primary(y));node(root,a);
        members.forEach(project=>{
          const index=projects.findIndex(item=>item.url===project.url),y=a+project.worldY-baseStart;
          const joinY=Math.max(a,y-1.15),tipX=side<0?.12+(index%3)*.025:.88-(index%3)*.025;
          edge({x:primary(joinY),y:joinY},{x:tipX,y},2);
          if(y>=position&&y<=position+viewportLength)anchors.set(index,{x:tipX+signal(samples,y)*.18/width,y:(y-position)/viewportLength});
        });
      }
    }
    const next=chapters[(chapterIndex+1)%chapters.length],baseStart=chapter.projects[chapter.projects.length-1].worldY+.65;
    const baseEnd=next.projects[0].worldY+(chapterIndex===chapters.length-1?journeyLength:0)-1.55;
    const start=position+wrapJourney(baseStart-position),end=start+baseEnd-baseStart;
    for(const shift of [0,-journeyLength]){
      const a=start+shift,b=end+shift,gap=b-a,root={x:center(a,width),y:a},canopy={x:center(b,width),y:b};
      const left={x:.31,y:a+gap*.38},right={x:.69,y:a+gap*.5};
      edge(root,left,1);edge(root,right,1);
      const tips=[{x:.17,y:a+gap*.64},{x:.4,y:a+gap*.71},{x:.6,y:a+gap*.77},{x:.84,y:a+gap*.7}];
      tips.forEach((tip,index)=>{edge(index<2?left:right,tip,2);edge(tip,canopy,2);});
      node(canopy.x,canopy.y);
    }
  });
  return {lines,orders,junctions,anchors};
}
