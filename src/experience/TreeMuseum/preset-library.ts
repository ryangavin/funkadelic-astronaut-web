import { t } from '../../i18n/copy';
import { gentlePreset, gentlePresetId } from './gentle-preset';
import catalogue from '../../content/museum-presets.json';
export const presetCatalogue=[{id:gentlePresetId,name:t('museum.presets.quietName')},...catalogue] as {id:string;name:string}[];
export const quietPresetId=gentlePresetId;
export function initialPreset():string|null {
  const query=new URLSearchParams(location.search).get('preset');let saved:string|null=null;
  try{saved=localStorage.getItem('treeMuseum.preset');}catch{/* Storage may be disabled. */}
  const requested=query||(new URLSearchParams(location.search).has('theme')?null:saved);
  const known=presetCatalogue.find(preset=>preset.id===requested)?.id;
  if(known)return known;
  const params=new URLSearchParams(location.search);
  if(params.has('preset')||params.has('theme')||saved)return null;
  try{if(localStorage.getItem('treeMuseum.theme'))return null;}catch{/* Storage may be disabled. */}
  return quietPresetId;
}
export async function loadLibraryPreset(id:string,signal:AbortSignal):Promise<unknown> {
  if(id===gentlePresetId)return gentlePreset;
  if(!presetCatalogue.some(preset=>preset.id===id))throw new Error('Unknown preset');
  const response=await fetch(`${import.meta.env.BASE_URL}preset-library/${id}.json`,{signal});
  if(!response.ok)throw new Error(`Preset load failed (${response.status})`);
  return response.json();
}
