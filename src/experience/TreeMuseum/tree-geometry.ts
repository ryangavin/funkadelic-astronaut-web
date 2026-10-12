import { chapters, projects, journeyLength, viewportLength, wrapJourney, spinePathX } from './journey';
export interface TreeGeometry { lines:Float32Array[];anchors:Map<number,{x:number;y:number}> }
const signal=(samples:Int8Array,worldY:number)=>{const sample=((worldY%viewportLength+viewportLength)%viewportLength)/viewportLength*samples.length,index=Math.floor(sample)%samples.length,fraction=sample-Math.floor(sample);return (samples[index]*(1-fraction)+samples[(index+1)%samples.length]*fraction)/128;};
export const waveformX=(samples:Int8Array,worldY:number,width:number)=>.5+(spinePathX(worldY)+signal(samples,worldY)*.65)/width;
export function buildTreeGeometry(samples:Int8Array,position:number,width:number):TreeGeometry {
  const lines:Float32Array[]=[],anchors=new Map<number,{x:number;y:number}>();
  const trace=(start:number,end:number,steps:number,xAt:(t:number,y:number)=>number)=>{
    const visibleStart=Math.max(start,position),visibleEnd=Math.min(end,position+viewportLength);if(visibleStart>=visibleEnd)return;
    const points=new Float32Array((steps+1)*2);
    for(let i=0;i<=steps;i++){const y=visibleStart+(visibleEnd-visibleStart)*i/steps,t=(y-start)/(end-start);points[i*2]=xAt(t,y);points[i*2+1]=(y-position)/viewportLength;}lines.push(points);
  };
  trace(position,position+viewportLength,samples.length,(_,y)=>waveformX(samples,y,width));
  projects.forEach((project,index)=>{
    const relative=wrapJourney(project.worldY-position),end=position+relative,start=end-1.15;
    const root=.5+spinePathX(start)/width,tip=project.side<0?.17+(index%3)*.025:.83-(index%3)*.025;
    trace(start,end,40,(t,y)=>{const bend=t*t*(3-2*t);return root+(tip-root)*bend+signal(samples,y)*.65/width;});
    if(relative<=viewportLength)anchors.set(index,{x:tip+signal(samples,end)*.65/width,y:relative/viewportLength});
    // Include the preceding loop's tail when its endpoint sits just above the viewport.
    trace(start-journeyLength,end-journeyLength,40,(t,y)=>{const bend=t*t*(3-2*t);return root+(tip-root)*bend+signal(samples,y)*.65/width;});
  });
  chapters.forEach((chapter,index)=>{
    const next=chapters[(index+1)%chapters.length];
    const startBase=chapter.projects[chapter.projects.length-1].worldY+.45;
    const endBase=next.projects[0].worldY+(index===chapters.length-1?journeyLength:0)-1.3;
    const start=position+wrapJourney(startBase-position),end=start+(endBase-startBase);
    for(const shift of [0,-journeyLength])for(const reach of [-.34,-.19,.19,.34]){
      const a=start+shift,b=end+shift;
      trace(a,b,72,(t,y)=>{
        const trunk=.5+spinePathX(y)/width;
        // Roots spread through the section's lower half, then become the next canopy.
        const fan=Math.sin(Math.PI*t);return trunk+reach*fan+signal(samples,y)*.65/width;
      });
    }
  });
  return {lines,anchors};
}
