/* A deliberate reveal keeps normal page scrolling intact. */
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
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'reveal-performance';
  button.textContent = 'Watch the performance';
  stage.append(button);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const cameos = ['#learn', '#live'].map(selector => {
    const section = document.querySelector(selector);
    const cameo = document.createElement('span');
    cameo.className = 'band-astronaut-peek';
    cameo.setAttribute('aria-hidden', 'true');
    cameo.innerHTML = '<img src="assets/astronaut-flat.webp" width="720" height="1080" alt="" />';
    section.append(cameo);
    window.PaperCutout.mount(cameo, { preset: 'astronaut' });
    return { section, cameo };
  });
  let peekQueued = false;
  function updatePeeks() {
    peekQueued = false;
    for (const { section, cameo } of cameos) {
      const progress = reduced.matches ? 1 : Math.max(0, Math.min(1,
        (innerHeight * .85 - section.getBoundingClientRect().top) / (innerHeight * .45)));
      cameo.style.setProperty('--peek', progress * progress * (3 - 2 * progress));
    }
  }
  function schedulePeeks() {
    if (!peekQueued) { peekQueued = true; requestAnimationFrame(updatePeeks); }
  }
  addEventListener('scroll', schedulePeeks, { passive: true });
  addEventListener('resize', schedulePeeks);
  reduced.addEventListener('change', schedulePeeks);
  updatePeeks();
  const controls = video.querySelector('.listen-content');
  controls.inert = true;
  let revealed = false;
  let frame;
  const clamp = n => Math.max(0, Math.min(1, n));
  const departures = [
    ['press', 0, .2], ['band', .08, .28], ['tour', .16, .36],
    ['booking', .24, .44], ['funk', .32, .56], ['astro', .44, .68],
    ['music', .56, .8], ['astronaut', .68, 1],
  ];
  function paint(progress) {
    for (const [name, start, end] of departures) {
      const t = clamp((progress - start) / (end - start));
      stage.style.setProperty(`--exit-${name}`, t * t * (3 - 2 * t));
    }
    stage.style.setProperty('--controls-reveal', clamp((progress - .8) / .2));
  }
  function finish() {
    paint(1);
    hero.hidden = true;
    controls.inert = false;
    document.querySelector('#play-video').focus({ preventScroll: true });
  }
  function reveal() {
    if (revealed) return;
    revealed = true;
    button.hidden = true;
    hero.inert = true;
    if (reduced.matches) { finish(); return; }
    const start = performance.now();
    function animate(now) {
      const progress = clamp((now - start) / 1800);
      paint(progress);
      if (progress < 1) frame = requestAnimationFrame(animate);
      else finish();
    }
    frame = requestAnimationFrame(animate);
  }
  button.addEventListener('click', reveal);
  reduced.addEventListener('change', () => {
    if (reduced.matches && revealed) { cancelAnimationFrame(frame); finish(); }
  });
  document.querySelector('.skip')?.addEventListener('click', event => {
    event.preventDefault();
    sequence.scrollIntoView({ behavior: 'instant' });
    reveal();
  });
  paint(0);
})();
