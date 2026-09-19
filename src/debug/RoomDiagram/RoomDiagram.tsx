import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDeskLight } from '../../behaviors/DeskLighting/DeskLighting';
import { useRoomSceneGeometry } from '../../foundations/Room/Room';
import { diagramGeometry, projectDiagram, type Point3 } from './geometry';
import './RoomDiagram.css';

const INITIAL = { yaw: -28, pitch: 24 };
export function RoomDiagramPortal({ target }: { target: HTMLElement | null }) {
  const scene = useRoomSceneGeometry();
  const light = useDeskLight();
  return scene && target ? createPortal(<RoomDiagram model={diagramGeometry(scene, light)} />, target) : null;
}
function RoomDiagram({ model: m }: { model: ReturnType<typeof diagramGeometry> }) {
  const [orbit, setOrbit] = useState(INITIAL);
  const section = useRef<HTMLElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(700);
  useLayoutEffect(() => {
    const measure = () => setCanvasWidth(Math.max(240, section.current!.clientWidth - 24));
    measure(); const observer = new ResizeObserver(measure); observer.observe(section.current!);
    return () => observer.disconnect();
  }, []);
  const drag = useRef<{ id: number; x: number; y: number; yaw: number; pitch: number } | null>(null);
  const p = (x: number, y: number, z: number): Point3 => ({ x, y, z });
  const face = (points: Point3[], fill: string, name: string) => ({ points, fill, name });
  const desk = [p(-m.width/2,0,m.height),p(m.width/2,0,m.height),p(m.width/2,m.depth,m.height),p(-m.width/2,m.depth,m.height)];
  const floor = [p(-m.span/2,0,0),p(m.span/2,0,0),p(m.span/2,m.floorDepth,0),p(-m.span/2,m.floorDepth,0)];
  const wall = [p(-m.span/2,0,0),p(m.span/2,0,0),p(m.span/2,0,m.wallHeight),p(-m.span/2,0,m.wallHeight)];
  const faces = [face(floor,'#dedbd1','Floor'), ...(m.wallHeight ? [face(wall,'#d5dce1','Wall')] : []), face(desk,'#a87950','Desk'), face([desk[2],desk[3],p(-m.width/2,m.depth,m.height-m.edge),p(m.width/2,m.depth,m.height-m.edge)],'#806044','Desk edge')];
  const raw = (point: Point3) => projectDiagram(point, orbit.yaw, orbit.pitch);
  const bounds = [...floor,...wall,...desk,m.eye,m.target,...(m.lamp ? [m.lamp.base,m.lamp.elbow,m.lamp.neck,m.lamp.shade] : [])].map(raw);
  const minX = Math.min(...bounds.map(a=>a.x)), maxX = Math.max(...bounds.map(a=>a.x));
  const minY = Math.min(...bounds.map(a=>a.y)), maxY = Math.max(...bounds.map(a=>a.y));
  const scale = Math.min((canvasWidth-70)/Math.max(1,maxX-minX),300/Math.max(1,maxY-minY));
  const project = (point: Point3) => { const at=raw(point); return { x:canvasWidth/2+(at.x-(minX+maxX)/2)*scale,y:185+(at.y-(minY+maxY)/2)*scale }; };
  const points = (list: Point3[]) => list.map(point=>{const q=project(point);return `${q.x},${q.y}`;}).join(' ');
  const line = (a: Point3,b: Point3,color: string,dashed=false,width=1.5,key?:string) => <polyline key={key} points={points([a,b])} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dashed?'5 4':undefined} />;
  const label = (at: Point3, text: string, color='#29343e') => {const q=project(at);return <text x={q.x+6} y={q.y-7} fill={color}>{text}</text>;};
  const arc = (from:number,to:number,r:number) => Array.from({length:25},(_,index)=>{const angle=(from+(to-from)*index/24)*Math.PI/180;return p(m.eye.x,m.eye.y-r*Math.cos(angle),m.eye.z-r*Math.sin(angle));});
  const circle = (at:Point3,radius:number,fill:string,labelText:string) => {const q=project(at);return <circle aria-label={labelText} cx={q.x} cy={q.y} r={Math.max(2,radius*scale)} fill={fill} stroke="#33414b" strokeWidth="1"/>;};
  const ring = (at:Point3,radius:number) => Array.from({length:33},(_,i)=>p(at.x+radius*Math.cos(i*Math.PI/16),at.y+radius*Math.sin(i*Math.PI/16),at.z));
  const foot=p(0,m.eye.y,0);
  const orbitBy=(yaw:number,pitch:number)=>setOrbit(old=>({yaw:old.yaw+yaw,pitch:Math.max(-80,Math.min(90,old.pitch+pitch))}));
  return <section ref={section} className="room-diagram" aria-label="Room geometry diagram" data-eye={JSON.stringify(m.eye)} data-target={JSON.stringify(m.target)} data-lamp={JSON.stringify(m.lamp)}>
    <header><strong>Room diagram</strong><span>Drag to orbit · arrow keys rotate</span></header>
    <div className="room-diagram__views" role="group" aria-label="Diagram view">
      <button onClick={()=>setOrbit(INITIAL)}>Reset view</button><button onClick={()=>setOrbit({yaw:0,pitch:90})}>Top</button><button onClick={()=>setOrbit({yaw:-90,pitch:0})}>Side</button>
    </div>
    <svg className="room-diagram__drawing" viewBox={`0 0 ${canvasWidth} 370`} role="img" aria-label="Rotatable room diagram. Arrow keys rotate; Home resets the view." tabIndex={0} data-orbit={`${orbit.yaw},${orbit.pitch}`}
      onKeyDown={event=>{const steps:Record<string,[number,number]>={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,10],ArrowDown:[0,-10]};if(event.key==='Home'){event.preventDefault();setOrbit(INITIAL);}else if(steps[event.key]){event.preventDefault();orbitBy(...steps[event.key]);}}}
      onPointerDown={event=>{if(event.button!==0)return;drag.current={id:event.pointerId,x:event.clientX,y:event.clientY,...orbit};event.currentTarget.setPointerCapture(event.pointerId);}}
      onPointerMove={event=>{const start=drag.current;if(!start||start.id!==event.pointerId)return;setOrbit({yaw:start.yaw+(event.clientX-start.x)*.4,pitch:Math.max(-80,Math.min(90,start.pitch-(event.clientY-start.y)*.4))});}}
      onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
      <title>Physical room geometry in millimetres</title>
      {faces.sort((a,b)=>a.points.reduce((sum,point)=>sum+raw(point).depth,0)/a.points.length-b.points.reduce((sum,point)=>sum+raw(point).depth,0)/b.points.length).map(item=><polygon key={item.name} aria-label={item.name} points={points(item.points)} fill={item.fill} fillOpacity=".72" stroke="#66737b" strokeWidth="1"/>)}
      {Array.from({length:Math.min(25,Math.floor(m.floorDepth/500)+1)},(_,i)=>line(p(-m.span/2,i*500,0),p(m.span/2,i*500,0),'#879299',false,.5,`row${i}`))}
      {Array.from({length:Math.min(25,Math.floor(m.span/500)+1)},(_,i)=>{const x=(i-Math.floor(m.span/1000))*500;return line(p(x,0,0),p(x,m.floorDepth,0),'#879299',false,.5,`col${i}`);})}
      {desk.map((point,i)=>line(point,p(point.x,point.y,0),'#79614e',false,2,`leg${i}`))}
      {line(p(0,0,0),foot,'#476579',true)}{line(foot,m.eye,'#476579',true)}
      {line(m.eye,m.target,'#bf6238',false,2)}
      {line(m.eye,p(0,m.eye.y-Math.min(350,(m.eye.z-m.height)*.35),m.eye.z),'#bf6238',true,1)}
      <polyline points={points(arc(0,m.pitch,Math.min(350,(m.eye.z-m.height)*.35)))} fill="none" stroke="#bf6238" strokeWidth="2" />
      {m.lamp&&<g aria-label="Simplified lamp">
        <polygon points={points(ring(m.lamp.base,m.lamp.baseRadius))} fill="#47634f" stroke="#293c2f"/>
        {line(m.lamp.base,m.lamp.elbow,'#506574',false,3)}{line(m.lamp.elbow,m.lamp.neck,'#506574',false,3)}
        <polygon points={points(ring(m.lamp.shade,m.lamp.shadeRadius))} fill={m.lamp.on?'#d7b45e':'#687b6c'} stroke="#293c2f"/>
        {circle(m.lamp.bulb,14,m.lamp.on?'#ffdf6d':'#738079','Bulb')}
      </g>}
      {circle(m.eye,55,'#d6b797','Eye position, schematic head marker')}
      {circle(m.center,12,'#407da2','Tabletop center')}{circle(m.target,10,'#bf6238','Gaze target')}
      {label(m.eye,'Eye')}{label(p(-m.width/2,m.depth,m.height),`${Math.round(m.width)} × ${Math.round(m.depth)} mm desk`)}
      {label(p(m.width/2,m.depth,m.height/2),`${Math.round(m.height)} mm`)}
      {label(p(0,m.eye.y/2,0),`${Math.round(m.eye.y)} mm from wall`)}
    </svg>
    <div className="room-diagram__readouts"><span>Eye {Math.round(m.eye.z)} mm</span><span>Head tilt {m.pitch.toFixed(1)}° from horizontal</span><span>Grid 500 mm</span>{m.lensFieldOfViewDegrees !== undefined && <span>Horizontal FOV {m.lensFieldOfViewDegrees.toFixed(1)}°</span>}</div>
    <div className="room-diagram__readouts"><span>Floor {Math.round(m.span)} × {Math.round(m.floorDepth)} mm</span><span>Wall {Math.round(m.wallHeight)} mm high</span></div>
    <p><span className="room-diagram__center">Blue: tabletop center reference</span> · <span className="room-diagram__gaze">Orange: gaze</span>. Head marker is schematic; lamp uses the scene’s simplified construction.</p>
  </section>;
}
