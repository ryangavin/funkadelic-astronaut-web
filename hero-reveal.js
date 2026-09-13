/* One pinned performance beneath a scroll-driven paper collage. */
(() => {
  const hero = document.querySelector('.hero');
  const video = document.querySelector('#listen');
  if (!hero || !video) return;
  const sequence = document.createElement('div');
  sequence.className = 'hero-sequence';
  const stage = document.createElement('div');
  stage.className = 'hero-stage';
  hero.before(sequence);
  sequence.append(stage);
  stage.append(video, hero);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let queued = false;
  const clamp = n => Math.max(0, Math.min(1, n));
  function update() {
    queued = false;
    const distance = sequence.offsetHeight - stage.offsetHeight;
    const progress = clamp(-sequence.getBoundingClientRect().top / Math.max(1, distance));
    const p = reduced.matches ? 0 : progress;
    stage.style.setProperty('--reveal', p);
    stage.style.setProperty('--paper-fade', 1 - clamp(p / .65));
    stage.style.setProperty('--controls-reveal', clamp((p - .55) / .25));
    hero.inert = !reduced.matches && progress > .85;
    const controls = video.querySelector('.listen-content');
    controls.inert = !reduced.matches && progress < .65;
  }
  function schedule() {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  reduced.addEventListener('change', schedule);
  new ResizeObserver(schedule).observe(stage);
  // Keyboard users can reveal the player directly through the skip link.
  document.querySelector('.skip')?.addEventListener('click', event => {
    if (reduced.matches) return;
    event.preventDefault();
    scrollTo({ top: sequence.offsetTop + sequence.offsetHeight - stage.offsetHeight, behavior: 'instant' });
    update();
    document.querySelector('#play-video').focus({ preventScroll: true });
  });
  update();
})();
