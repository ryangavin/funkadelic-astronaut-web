import { flushSync } from 'react-dom';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { Site } from './Site';

const container = document.getElementById('root')!;

if (container.hasChildNodes()) {
  // The built page arrives already rendered (see scripts/prerender.mjs); this makes it live. A server/client mismatch
  // is a bug: React recovers by re-rendering on the client, so it is logged as a console error rather than lost.
  hydrateRoot(container, <Site />, {
    onRecoverableError(error, info) {
      console.error('Hydration error:', error, info.componentStack ?? '');
    },
  });
} else {
  // `npm run dev` serves index.html as written, with an empty #root: render into it, at once rather than on React's
  // next tick, so the page has its full height by the time it loads, when a reload is put back where it was.
  const root = createRoot(container);
  flushSync(() => root.render(<Site />));
}
