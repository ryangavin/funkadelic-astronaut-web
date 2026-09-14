/* Static Pages equivalent of the dev-only Vite glob. URLs stay repository-relative. */
const fs = require('node:fs');
const path = require('node:path');
const original = {id:'original-performance-hls',label:'Original full performance · 8:42',type:'hls'};
function manifest(folder = 'assets/ambient') {
  return fs.readdirSync(folder).filter(name => /^[a-z0-9][a-z0-9 ._-]{0,120}\.(mp4|webm)$/i.test(name))
    .sort().map(name => ({id:name,label:name,url:`assets/ambient/${encodeURIComponent(name)}`}));
}
function script(files) { return `window.ambientVideoSources = ${JSON.stringify([original,...files])};\nwindow.dispatchEvent(new Event("ambient-sources-ready"));\n`; }
if (require.main === module) fs.writeFileSync(process.argv[2] || 'ambient-sources.static.js', script(manifest()));
module.exports = {manifest,script,original};
