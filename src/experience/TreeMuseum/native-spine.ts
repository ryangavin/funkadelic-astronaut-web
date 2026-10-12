import { buildTreeGeometry, waveformX, type TreeGeometry } from './tree-geometry';
import type { ThemeId } from './themes';

type Values=Record<string,number>;
type Equation=(values:Values)=>Values;
interface AuthoredPart {baseVals:Values;init_eqs_str?:string;frame_eqs_str?:string;point_eqs_str?:string}
interface AuthoredPreset extends AuthoredPart {pixel_eqs_str?:string;shapes:AuthoredPart[];waves:AuthoredPart[];warp:string;comp:string}
export interface NativeSpineInput {
  uploadedPoints:number;tint?:number[];buildGeometry?:()=>TreeGeometry;response:number;geometry:TreeGeometry;samples:Int8Array;envelope:Float32Array;time:number;position:number;worldWidth:number;theme:ThemeId;injecting:boolean;onDeposit:()=>void;
}
export const nativeSpineX=waveformX;
const compile=(source=''):Equation=>new Function('a',`${source}; return a;`) as Equation;
export function createNativeSpinePreset(authored:unknown,tuning?:()=>{position:number;width:number;length:number;speed:number;persistence:number}) {
  const preset=structuredClone(authored) as AuthoredPreset;
  const frame=compile(preset.frame_eqs_str);
  return {...preset,
    init_eqs:compile(preset.init_eqs_str),
    frame_eqs:(values:Values)=>{const result=frame(values);if((authored as {gentleCurrent?:boolean}).gentleCurrent&&tuning){const settings=tuning();result.q1=settings.position;result.q2=settings.width;result.q3=settings.length;result.q4=settings.speed;result.q5=settings.persistence;result.q6=1/Math.max(1,result.fps||60);}return result;},
    pixel_eqs:preset.pixel_eqs_str?compile(preset.pixel_eqs_str):'',
    // Preserve all authored callbacks and slots, including shared-buffer side effects.
    waves:preset.waves.map(wave=>({...wave,init_eqs:compile(wave.init_eqs_str),frame_eqs:compile(wave.frame_eqs_str),point_eqs:wave.point_eqs_str?compile(wave.point_eqs_str):''})),
    shapes:preset.shapes.map(shape=>({...shape,init_eqs:compile(shape.init_eqs_str),frame_eqs:compile(shape.frame_eqs_str)})),
  };
}
interface WaveDrawer {drawCustomWaveform:(...args:unknown[])=>void;generateWaveform:(...args:unknown[])=>boolean}
interface NativeStage {basicWaveform:{drawBasicWaveform:(...args:unknown[])=>void};customWaveforms:WaveDrawer[];texsizeX:number;texsizeY:number}
export function installNativeSpine(gl:WebGL2RenderingContext,renderer:NativeStage,input:NativeSpineInput) {
  const original=renderer.basicWaveform.drawBasicWaveform;
  const originals=renderer.customWaveforms.map(wave=>wave.drawCustomWaveform);
  renderer.customWaveforms.forEach(wave=>{wave.drawCustomWaveform=(...args)=>{const [,left,right,freqL,freqR,globals,equations,part]=args;if(part) wave.generateWaveform(left,right,freqL,freqR,globals,equations,part,0);};});
  const shader=(type:number,source:string)=>{const value=gl.createShader(type)!;gl.shaderSource(value,source);gl.compileShader(value);if(!gl.getShaderParameter(value,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(value)||'Native spine compile failed');return value;};
  const vs=shader(gl.VERTEX_SHADER,`#version 300 es\nin vec2 point;in vec3 tint;out vec3 color;uniform float offset;void main(){gl_Position=vec4(point+vec2(offset,0.),0.,1.);color=tint;}`);
  const fs=shader(gl.FRAGMENT_SHADER,`#version 300 es\nprecision highp float;in vec3 color;out vec4 outputColor;uniform float alpha;uniform float core;void main(){outputColor=vec4(mix(color,vec3(.98,.99,1.),core),alpha);}`);
  const program=gl.createProgram()!;gl.attachShader(program,vs);gl.attachShader(program,fs);gl.bindAttribLocation(program,0,'point');gl.bindAttribLocation(program,1,'tint');gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'Native spine link failed');
  const vao=gl.createVertexArray()!,buffer=gl.createBuffer()!;const points=new Float32Array(8192*5);
  gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,points.byteLength,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,20,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,20,8);gl.bindVertexArray(null);
  const offset=gl.getUniformLocation(program,'offset'),alpha=gl.getUniformLocation(program,'alpha'),core=gl.getUniformLocation(program,'core');
  renderer.basicWaveform.drawBasicWaveform=()=>{
    if(!input.injecting)return;
    input.geometry=input.buildGeometry?.()||buildTreeGeometry(input.samples,input.position,input.worldWidth);
    if(input.response<=0||!input.geometry.lines.length){input.uploadedPoints=0;return;}input.onDeposit();
    const colors:Record<ThemeId,number[]>={prism:[.4,.6,1],garden:[.3,.86,.66],horizon:[.72,.5,1]},color=input.tint||colors[input.theme];
    const ranges:{start:number;count:number;order:number}[]=[];let count=0;
    for(const order of [0,1,2]){const start=count;
      for(let lineIndex=0;lineIndex<input.geometry.lines.length;lineIndex++){if(input.geometry.orders[lineIndex]!==order)continue;const line=input.geometry.lines[lineIndex];
        for(let i=0;i<line.length-2;i+=2){if(count+2>8192)break;for(const vertex of [i,i+2]){points[count*5]=line[vertex]*2-1;points[count*5+1]=line[vertex+1]*2-1;for(let channel=0;channel<3;channel++)points[count*5+2+channel]=color[channel];count++;}}
      }if(count>start)ranges.push({start,count:count-start,order});
    }
    input.uploadedPoints=count;
    const draw=(strength:number)=>{for(const range of ranges){gl.uniform1f(alpha,Math.min(1,strength*input.response)*(range.order===0?1:range.order===1?.72:.45));gl.drawArrays(gl.LINES,range.start,range.count);}};
    const previousVao=gl.getParameter(gl.VERTEX_ARRAY_BINDING),previousProgram=gl.getParameter(gl.CURRENT_PROGRAM),previousBuffer=gl.getParameter(gl.ARRAY_BUFFER_BINDING);
    const blend=gl.isEnabled(gl.BLEND),eqRgb=gl.getParameter(gl.BLEND_EQUATION_RGB),eqAlpha=gl.getParameter(gl.BLEND_EQUATION_ALPHA),srcRgb=gl.getParameter(gl.BLEND_SRC_RGB),dstRgb=gl.getParameter(gl.BLEND_DST_RGB),srcAlpha=gl.getParameter(gl.BLEND_SRC_ALPHA),dstAlpha=gl.getParameter(gl.BLEND_DST_ALPHA);
    gl.useProgram(program);gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,points.subarray(0,count*5));gl.enable(gl.BLEND);gl.blendEquation(gl.FUNC_ADD);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1f(core,0);
    // Fixed Gaussian halo, deposited into native history with the same sample geometry.
    for(const dx of [-4,-3,-2,-1,1,2,3,4]){gl.uniform1f(offset,dx*2/renderer.texsizeX);draw(.42*Math.exp(-dx*dx/(2*1.6*1.6)));}
    gl.uniform1f(core,input.buildGeometry?.5:1);gl.uniform1f(offset,0);draw(1);
    gl.bindVertexArray(previousVao);gl.useProgram(previousProgram);gl.bindBuffer(gl.ARRAY_BUFFER,previousBuffer);gl.blendEquationSeparate(eqRgb,eqAlpha);gl.blendFuncSeparate(srcRgb,dstRgb,srcAlpha,dstAlpha);if(!blend)gl.disable(gl.BLEND);
  };
  return ()=>{renderer.basicWaveform.drawBasicWaveform=original;renderer.customWaveforms.forEach((wave,index)=>{wave.drawCustomWaveform=originals[index];});gl.deleteVertexArray(vao);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);};
}
