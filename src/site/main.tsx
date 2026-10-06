import { hydrateRoot } from 'react-dom/client';
import { Site } from './Site';

// The page arrives already rendered (see scripts/prerender.mjs); this makes it live. A server/client mismatch is a
// bug: React recovers by re-rendering on the client, so it is logged as a console error rather than lost.
hydrateRoot(document.getElementById('root')!, <Site />, {
  onRecoverableError(error, info) {
    console.error('Hydration error:', error, info.componentStack ?? '');
  },
});
