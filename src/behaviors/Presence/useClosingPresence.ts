import { useEffect, useState } from 'react';

/** Keep a closing drawing alive until its return animation finishes. */
export function useClosingPresence(open: boolean, closeMs: number) {
  const [present, setPresent] = useState(open);
  useEffect(() => {
    if (open) { setPresent(true); return; }
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches || closeMs <= 0) { setPresent(false); return; }
    const timer = window.setTimeout(() => setPresent(false), closeMs);
    const reduced = () => { if (motion.matches) setPresent(false); };
    motion.addEventListener('change', reduced);
    return () => { window.clearTimeout(timer); motion.removeEventListener('change', reduced); };
  }, [open, closeMs]);
  return open || present;
}
