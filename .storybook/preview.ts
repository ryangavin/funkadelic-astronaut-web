import type { Preview } from '@storybook/react-vite';
import '../src/styles/fonts.css';

const preview: Preview = {
  parameters: {
    options: {
      // What the .com serves, then the desk experience, then the shared library both are built from.
      storySort: {
        order: [
          'Site',
          'Experience',
          ['Arrival', 'Desk', 'Desk Settings', 'Perspective Desk', 'Desk Dossier', 'Poster', 'Sections', 'Experiments', 'Debug'],
          'Library',
          ['Components', ['2D', '3D'], 'Foundations'],
        ],
      },
    },


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
