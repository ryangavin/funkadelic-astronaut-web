// The React app and the og:image refer to files by their fixed /assets/ URL
// (fonts, paper textures, performance.jpg), so the shared assets/ folder is
// published as-is beside Vite's hashed output.
const { cpSync } = require('node:fs');
const { resolve } = require('node:path');

const projectRoot = resolve(__dirname, '..');

cpSync(resolve(projectRoot, 'assets'), resolve(projectRoot, 'dist', 'assets'), {
  recursive: true,
  force: true,
});
