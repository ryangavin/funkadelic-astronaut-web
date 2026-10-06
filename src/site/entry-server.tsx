import { renderToString } from 'react-dom/server';
import { Site } from './Site';

/**
 * The site as HTML, for `index.html`'s `#root`. Built by `vite build --ssr`
 * and called by scripts/prerender.mjs; `main.tsx` hydrates the same tree.
 */
export function render(): string {
  return renderToString(<Site />);
}
