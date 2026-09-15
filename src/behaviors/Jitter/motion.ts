export const PRINT_CADENCE_MS = 150;
export const JITTER_PRESETS = {
  cutout: { x: 1.6, y: 2.3, rotation: .7 },
  print: { x: .45, y: .8, rotation: .55 },
} as const;

export type JitterOptions = {
  preset?: keyof typeof JITTER_PRESETS;
  x?: number;
  y?: number;
  rotation?: number;
  cadenceMs?: number;
  activation?: 'continuous' | 'hover-focus';
  enabled?: boolean;
};

/** Owns only the motion layer; layout and static transforms belong to its parent/children. */
export function attachJitter(trigger: HTMLElement, layer: HTMLElement, options: JitterOptions = {}) {
  const doc = trigger.ownerDocument;
  const win = doc.defaultView;
  if (!win) return () => {};
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)');
  const preset = JITTER_PRESETS[options.preset ?? 'cutout'];
  const magnitude = (value: number | undefined, fallback: number) => Number.isFinite(value) ? Math.abs(value!) : fallback;
  const x = magnitude(options.x, preset.x);
  const y = magnitude(options.y, preset.y);
  const rotation = magnitude(options.rotation, preset.rotation);
  const cadence = Math.max(16, magnitude(options.cadenceMs, PRINT_CADENCE_MS));
  const original = { translate: layer.style.translate, rotate: layer.style.rotate };
  let hovered = false;
  let timer: number | undefined;
  let disposed = false;
  const random = (amount: number) => +((Math.random() * 2 - 1) * amount).toFixed(3);
  const stop = () => {
    if (timer !== undefined) win.clearInterval(timer);
    timer = undefined;
    layer.style.translate = original.translate;
    layer.style.rotate = original.rotate;
  };
  const frame = () => {
    layer.style.translate = `${random(x)}px ${random(y)}px`;
    layer.style.rotate = `${random(rotation)}deg`;
  };
  const sync = () => {
    const focused = trigger.matches(':focus-visible') || !!trigger.querySelector(':focus-visible');
    const active = options.activation !== 'hover-focus' || hovered || focused;
    if (disposed || options.enabled === false || reduced.matches || doc.hidden || !active || !(x || y || rotation)) {
      stop();
    } else if (timer === undefined) {
      frame();
      timer = win.setInterval(frame, cadence);
    }
  };
  const enter = (event: PointerEvent) => { if (event.pointerType !== 'touch') { hovered = true; sync(); } };
  const leave = () => { hovered = false; sync(); };
  trigger.addEventListener('pointerenter', enter);
  trigger.addEventListener('pointerleave', leave);
  trigger.addEventListener('pointercancel', leave);
  trigger.addEventListener('focusin', sync);
  trigger.addEventListener('focusout', sync);
  reduced.addEventListener('change', sync);
  doc.addEventListener('visibilitychange', sync);
  sync();
  return () => {
    disposed = true;
    stop();
    trigger.removeEventListener('pointerenter', enter);
    trigger.removeEventListener('pointerleave', leave);
    trigger.removeEventListener('pointercancel', leave);
    trigger.removeEventListener('focusin', sync);
    trigger.removeEventListener('focusout', sync);
    reduced.removeEventListener('change', sync);
    doc.removeEventListener('visibilitychange', sync);
  };
}
