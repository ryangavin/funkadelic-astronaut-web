const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const {manifest,script,original}=require('../scripts/generate-ambient-sources.cjs');
test('static discovery finds additions/removals and preserves safe subpath asset URLs',()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'ambient-manifest-'));
 try {
 fs.writeFileSync(path.join(folder,'test clip.mp4'),'');fs.writeFileSync(path.join(folder,'note.txt'),'');
 assert.deepEqual(manifest(folder),[{id:'test clip.mp4',label:'test clip.mp4',url:'assets/ambient/test%20clip.mp4'}]);
 fs.writeFileSync(path.join(folder,'second.webm'),'');assert.equal(manifest(folder).length,2);
 fs.unlinkSync(path.join(folder,'test clip.mp4'));assert.equal(manifest(folder).length,1);
 let events=0;const window={dispatchEvent(){events++;}};
 vm.runInNewContext(script(manifest(folder)),{window,Event:class{}});
 assert.equal(Array.from(window.ambientVideoSources,source=>source.id).join(','),`${original.id},second.webm`);assert.equal(events,1);
 } finally {fs.rmSync(folder,{recursive:true});}
});
