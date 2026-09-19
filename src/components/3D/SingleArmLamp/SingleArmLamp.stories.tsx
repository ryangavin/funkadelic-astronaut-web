import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';
import { useDeskLight } from '../../../behaviors/DeskLighting/DeskLighting';
import { Pin } from '../../2D/Pin/Pin';
import { MeterStick } from '../MeterStick/MeterStick';
import { Room, useRoomCamera, type RoomProps } from '../../../foundations/Room/Room';
import { RoomExperiment, physicalDefaults, withLightTuning } from '../../../debug/RoomControls/controls';
import { lightingSetup } from '../../../geometry/lightingSetup';
import { SingleArmLamp, type SingleArmLampProps } from './SingleArmLamp';

const PLACE = { x: 500, y: -20 };
function NewLamp({ intensity, tuning }: { intensity?: number; tuning?: RoomProps['lightTuning'] }) {
  const camera = useRoomCamera();
  return <Pin {...PLACE} width={720}><SingleArmLamp place={PLACE} camera={camera} intensity={intensity} tuning={lightingSetup(tuning)} /></Pin>;
}
function BulbReadout() {
  const light = useDeskLight();
  return <output hidden aria-label="One-arm bulb geometry">{light ? `${light.x.toFixed(1)},${light.y.toFixed(1)},${light.height.toFixed(1)}; ${light.on ? 'on' : 'off'}` : 'No light'}</output>;
}
const cameraDefaults: RoomProps = { cameraMode:'physical',eyeHeightMm:2200,viewerSetbackMm:650,deskShare:.65,roomLip:0,roomBlur:0,lampX:470,lampY:292,lampWidth:576 };
function Reference({ single = false, ...props }: RoomProps & {single?:boolean}) {
  return <Room {...props} showLamp={!single}>
    <Pin x={100} y={850} width={1200}><MeterStick /></Pin>
    {single && <><NewLamp intensity={props.lampIntensity} tuning={props.lightTuning} /><BulbReadout /></>}
  </Room>;
}
function ComparisonView(props: RoomProps) {
  return <div className="single-arm-comparison">
    <section aria-label="Two-arm reference"><h2>Current · two arms</h2><Reference {...props} /></section>
    <section aria-label="One-arm comparison"><h2>One arm · base hinge + shade swivel</h2><Reference {...props} single /></section>
  </div>;
}
const meta = {
  title:'Components/3D/Single Arm Lamp', component:SingleArmLamp,
  parameters:{layout:'fullscreen'},
  args:{armAngle:60,shadeAngle:0,on:true},
  render:args=><div style={{width:600,maxWidth:'100%',padding:'80px 24px',background:'#63482f'}}><SingleArmLamp {...args} /></div>,
} satisfies Meta<SingleArmLampProps>;
export default meta;
type Story=StoryObj<typeof meta>;
export const Standalone: Story = {};
async function checkLamp({canvasElement}:{canvasElement:HTMLElement}) {
  if(import.meta.env.MODE!=='test') return;
  const canvas=within(canvasElement), arm=canvas.getByRole('slider',{name:'Arm elevation'}), swivel=canvas.getByRole('slider',{name:'Shade swivel'});
  const reading=canvas.getByLabelText('One-arm bulb geometry');
  const initial=reading.textContent;
  arm.focus(); await userEvent.keyboard('{ArrowDown}{ArrowDown}');
  expect(arm).toHaveAttribute('aria-valuenow','56');
  await waitFor(()=>expect(reading.textContent).not.toBe(initial));
  const box=arm.getBoundingClientRect(), pointer={pointerId:1,button:0,buttons:1,clientX:box.x+box.width/2,clientY:box.y+box.height/2};
  fireEvent.pointerDown(arm,pointer);fireEvent.pointerMove(arm,{...pointer,clientY:pointer.clientY-20});fireEvent.pointerUp(arm,{...pointer,buttons:0,clientY:pointer.clientY-20});
  expect(arm).toHaveAttribute('aria-valuenow','66');
  const raised=reading.textContent;
  swivel.focus();await userEvent.keyboard('{ArrowRight}{ArrowRight}');
  expect(swivel).toHaveAttribute('aria-valuenow','4');
  await waitFor(()=>expect(reading.textContent).not.toBe(raised));
  await userEvent.click(canvas.getByRole('button',{name:'Turn one-arm lamp off'}));
  await waitFor(()=>expect(reading).toHaveTextContent('; off'));
  const single=canvas.getByRole('region',{name:'One-arm comparison'});
  expect(single.querySelectorAll('.desk-lamp')).toHaveLength(0);
  expect(single.querySelector('.lamp-light')).not.toHaveAttribute('data-on');
  const cameras = canvasElement.querySelectorAll('.perspective');
  expect(cameras[0].getAttribute('style')).toBe(cameras[1].getAttribute('style'));
  expect(canvasElement.querySelectorAll('.desk-lamp')).toHaveLength(1);
  for(const node of canvasElement.querySelectorAll('[style],[transform]')) expect(`${node.getAttribute('style')} ${node.getAttribute('transform')}`).not.toMatch(/NaN|Infinity/);
}
export const HighView: Story={render:()=> <ComparisonView {...cameraDefaults}/>,play:checkLamp};
export const LowView: Story={render:()=> <ComparisonView {...cameraDefaults} eyeHeightMm={1450} viewerSetbackMm={1800}/>,play:checkLamp};
export const PhysicalSetup: Story={
  render:()=> <RoomExperiment args={{...physicalDefaults,...cameraDefaults,cameraMode:'physical' as const}}>{values=><ComparisonView {...withLightTuning(values)}/>}</RoomExperiment>,
  parameters:{controls:{disable:true}},
};
