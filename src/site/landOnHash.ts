import { useEffect } from 'react';

/** Anything a visitor does that means they have taken over the page from here. */
const TAKING_OVER = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;

/**
 * Lands a cold load of `/#section` on that section. The page is rendered by
 * React into an empty `#root`, so the browser looks for the fragment before
 * the section exists and never scrolls to it; the redirects from old
 * addresses (`press-kit.html`, `classic.html`, `404.html`) carry the hash over
 * and land the same way.
 *
 * Once the page has rendered, this does what following one of the page's own
 * tabs does: jumps straight to the section (no smooth scroll, as the tabs
 * don't animate either, so reduced motion is respected) and moves the
 * keyboard there, so the next Tab carries on from the section. The section
 * takes focus through a temporary `tabindex="-1"`, removed when focus leaves.
 *
 * An empty hash, or one that names nothing on the page, does nothing; nor does
 * it if the window has already been scrolled (by the visitor, or by the
 * browser restoring a reloaded page's place). Images and web fonts that settle
 * late can move the section, so once the page has loaded and its fonts are in
 * it lines the section up again, unless the visitor has scrolled, clicked,
 * touched or pressed a key in the meantime. Later in-page navigation is left
 * to the browser. Returns a cleanup that drops the pending re-alignment.
 */
export function landOnHash(hash: string = location.hash): () => void {
  const target = findTarget(hash);
  if (!target || window.scrollY !== 0) return () => {};

  const align = () => target.scrollIntoView({ block: 'start', behavior: 'instant' });
  align();
  takeFocus(target);

  let done = false;
  const stop = () => {
    done = true;
    for (const type of TAKING_OVER) window.removeEventListener(type, stop, true);
  };
  for (const type of TAKING_OVER) window.addEventListener(type, stop, { capture: true, passive: true });

  const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
  void Promise.all([loaded, document.fonts?.ready]).then(() => {
    if (done) return;
    stop();
    align();
  });
  return stop;
}

/**
 * Lands on the hash once, after the first render. The re-alignment is left
 * pending on unmount on purpose: StrictMode's rehearsal unmount in development
 * would otherwise cancel it, and the remount then finds the window scrolled.
 */
export function useLandOnHash(hash?: string) {
  useEffect(() => {
    landOnHash(hash);
  }, []); // a cold load lands once; later hash changes are the browser's
}

function findTarget(hash: string): HTMLElement | null {
  const raw = hash.replace(/^#/, '');
  if (!raw) return null;
  let id = raw;
  try {
    id = decodeURIComponent(raw);
  } catch {
    // A malformed escape: look the hash up as written.
  }
  return document.getElementById(id) ?? document.getElementById(raw);
}

/** Focuses `element` without scrolling, as the browser moves its focus starting point to a fragment. */
function takeFocus(element: HTMLElement) {
  if (!element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '-1');
    element.addEventListener('blur', () => element.removeAttribute('tabindex'), { once: true });
  }
  element.focus({ preventScroll: true });
}
