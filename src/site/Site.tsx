import { StrictMode } from 'react';
import { useLandOnHash } from './landOnHash';
import { PressKit } from './PressKit/PressKit';

/**
 * The site: the press kit, landing on the section a `#hash` link names. The
 * build pre-renders this into `index.html` (`entry-server.tsx`) and the
 * browser hydrates the same tree (`main.tsx`), so both sides must render it
 * identically: anything that depends on the browser waits for an effect.
 */
export function Site() {
  useLandOnHash();
  return (
    <StrictMode>
      <PressKit />
    </StrictMode>
  );
}
