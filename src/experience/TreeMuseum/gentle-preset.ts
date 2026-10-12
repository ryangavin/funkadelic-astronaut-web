// Original museum preset: fixed-color, near-identity native feedback.
export const gentlePresetId='gentle-current';
export const gentleDefaults={speed:.3,sensitivity:.65,persistence:14,background:.45};
export type GentleTuning=typeof gentleDefaults;
export const gentlePreset={
  gentleCurrent:true,
  baseVals:{decay:1,gammaadj:1,zoom:1,zoomexp:1,rot:0,warp:0,dx:0,dy:0,cx:.5,cy:.5,sx:1,sy:1,wave_a:0,ob_size:0,ob_a:0,ib_size:0,ib_a:0,mv_a:0,darken_center:0,red_blue:0,brighten:0,darken:0,solarize:0,invert:0,wrap:0},
  shapes:[],waves:[],init_eqs_str:'',frame_eqs_str:'',pixel_eqs_str:'',
  warp:`shader_body {
    float phase = mod(uv_orig.y * 6.0 + q1, q3) / q3 * 6.28318530718;
    float center = .5 + (sin(phase*9.0)*.92 + sin(phase*17.0+.8)*.38 + cos(phase*23.0)*.16)/q2;
    float direction = clamp((uv_orig.x-center)*8.0,-1.0,1.0);
    vec2 at = clamp(uv_orig-vec2(direction*.00025*q4*q6*60.0,0.0),0.0,1.0);
    vec2 step = texsize.zw;
    vec3 middle = texture(sampler_main,at).rgb;
    vec3 neighbors = (texture(sampler_main,clamp(at+vec2(step.x,0.0),0.0,1.0)).rgb + texture(sampler_main,clamp(at-vec2(step.x,0.0),0.0,1.0)).rgb + texture(sampler_main,clamp(at+vec2(0.0,step.y),0.0,1.0)).rgb + texture(sampler_main,clamp(at-vec2(0.0,step.y),0.0,1.0)).rgb)*.25;
    ret = max(vec3(0.0),mix(middle,neighbors,clamp(.12*q6*60.0,0.0,.3))*exp(-q6/q5)-vec3(.00055*q6*60.0));
  }`,
  comp:`shader_body { vec3 field=texture(sampler_main,uv).rgb; float light=dot(field,vec3(.3,.5,.2)); ret=light*vec3(.24,.30,.37); }`,
};
