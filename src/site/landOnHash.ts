import { useEffect } from 'react';

/** Anything a visitor does that means they have taken over the page from here. */
const TAKING_OVER = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;

/**
 * Lands a cold load of `/#section` on that section. The page is pre-rendered,
 * so the browser normally finds the fragment and scrolls to it itself; then
 * the window has already moved and this does nothing. It stays as a safety
 * net for a load where the browser did not land (the section was not found in
 * time, or something put the window back at the top); the redirects from old
 * addresses (`press-kit.html`, `classic.html`, `404.html`) carry the hash over
 * and land the same way.
 *
 * Once the page has rendered, this does what following one of the page's own
 * tabs does: jumps straight to the section (no smooth scroll, as the tabs
 * don't animate either, so reduced motion is respected) and moves the
 * keyboard there, so the next Tab carries on from the section. The section
 * takes focus through a temporary `tabindex="-1"`, removed when focus leaves.
 *
 * An empty hash, or one that names nothing on the page, does nothing. Nor does
 * a reload or a trip back or forward through history, where the browser
 * restores the visitor's own place, or a window that has already been
 * scrolled. Focus is only taken if nothing else has it yet. Images and web
 * fonts that settle late can move the section, so once the page has loaded
 * and its fonts are in it lines the section up again, unless the visitor has
 * scrolled (by any means: wheel, scrollbar, find in page), clicked, touched or
 * pressed a key in the meantime. Later in-page navigation is left to the
 * browser. Returns a cleanup that drops the pending re-alignment.
 */
export function landOnHash(hash: string = location.hash): () => void {
  const target = findTarget(hash);
  if (!target || window.scrollY !== 0 || restoresItsOwnPlace()) return () => {};

  const align = () => target.scrollIntoView({ block: 'start', behavior: 'instant' });
  align();
  if (!document.activeElement || document.activeElement === document.body) takeFocus(target);

  // The jump above fires a scroll event of its own; any scroll away from where it left the window is the visitor's.
  const landedAt = window.scrollY;
  const scrolledAway = () => {
    if (Math.abs(window.scrollY - landedAt) > 1) stop();
  };
  let done = false;
  const stop = () => {
    done = true;
    for (const type of TAKING_OVER) window.removeEventListener(type, stop, true);
    window.removeEventListener('scroll', scrolledAway);
  };
  for (const type of TAKING_OVER) window.addEventListener(type, stop, { capture: true, passive: true });
  window.addEventListener('scroll', scrolledAway, { passive: true });

  const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
  void Promise.all([loaded, document.fonts?.ready]).then(() => {
    if (done) return;
    stop();
    align();
  });
  return stop;
}

/** Whether this page load's hash has been dealt with: it lands once per load, whatever React mounts. */
let landed = false;

/**
 * Lands on the location's hash once per page load, after the first render.
 * StrictMode's rehearsal remount in development finds it already landed, so
 * no second set of listeners is added; the pending re-alignment is left alone
 * on unmount for the same reason.
 */
export function useLandOnHash() {
  useEffect(() => {
    if (landed) return;
    landed = true;
    landOnHash();
  }, []); // a cold load lands once; later hash changes are the browser's
}

/** A reload or a history traversal: the browser puts the visitor back where they were, which beats the hash. */
function restoresItsOwnPlace() {
  const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  return navigation?.type === 'reload' || navigation?.type === 'back_forward';
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
