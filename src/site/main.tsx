import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useLandOnHash } from './landOnHash';
import { PressKit } from './PressKit/PressKit';

/** The site: the press kit, landing on the section a `#hash` link names. */
function Site() {
  useLandOnHash();
  return <PressKit />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Site />
  </StrictMode>,
);
