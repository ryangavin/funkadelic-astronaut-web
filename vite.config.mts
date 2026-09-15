import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        home: 'index.html',
        pressKit: 'press-kit.html',
        editor: 'editor/index.html',
        preview: 'preview/index.html',
      },
    },
  },
});
