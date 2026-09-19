import type { Preview } from '@storybook/react-vite';
import '../src/styles/fonts.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    backgrounds: {
      options: {
        paper: { name: 'paper', value: '#ead3a7' },
        ink: { name: 'ink', value: '#121420' }
      }
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },

  initialGlobals: {
    backgrounds: {
      value: 'paper'
    }
  }
};

export default preview;
