import { StrictMode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { useLandOnHash } from './landOnHash';
import { PressKit } from './PressKit/PressKit';

/** The site: the press kit, landing on the section a `#hash` link names. */
function Site() {
  useLandOnHash();
  return <PressKit />;
}

// Rendered at once rather than on React's next tick, so the page has its full height by the time it loads: that is
// when the browser puts a reloaded or revisited page back where the visitor left it.
const root = createRoot(document.getElementById('root')!);
flushSync(() =>
  root.render(
    <StrictMode>
      <Site />
    </StrictMode>,
  ),
);
