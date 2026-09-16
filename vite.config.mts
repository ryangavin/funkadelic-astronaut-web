/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        home: 'index.html',
        pressKit: 'press-kit.html'
      }
    }
  },
  test: {
    projects: [
      {
        extends: true,
        // Runs every story as a browser test, with each play function as its assertions.
        // See https://storybook.js.org/docs/writing-tests/integrations/vitest-addon
        plugins: [storybookTest()],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }]
          }
        }
      }
    ]
  }
});
