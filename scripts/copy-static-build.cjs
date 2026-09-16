const { cpSync, copyFileSync, mkdirSync } = require('node:fs');
const { resolve } = require('node:path');

const projectRoot = resolve(__dirname, '..');
const outputRoot = resolve(projectRoot, 'dist');

const legacyScripts = [
  'ambient-treatment.js',
  'app.js',
  'cutout-type.js',
  'layout-studio-core.js',
  'layout-studio.js',
  'living-video.js',
  'paper-cutout.js',
  'performance-print.js',
  'poster-motion.js',
  'print-cadence.js',
  'ribbon-editor.js',
  'typography-debug.js',
];

mkdirSync(outputRoot, { recursive: true });
cpSync(resolve(projectRoot, 'assets'), resolve(outputRoot, 'assets'), {
  recursive: true,
  force: true,
});

for (const script of legacyScripts) {
  copyFileSync(resolve(projectRoot, script), resolve(outputRoot, script));
}
