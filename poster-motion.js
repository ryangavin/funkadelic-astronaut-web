/* Bounded print-registration jitter. Every frame is relative to the original layout. */
(() => {
  const words = [...document.querySelectorAll('.wordmark .print-jitter')];
  const astronaut = document.querySelector('.astronaut');
  const astronautStyle = astronaut && [astronaut.style.translate, astronaut.style.rotate];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const interactions = [...document.querySelectorAll('.navigation a, .hero > .streaming-links a')].map(link => ({
    link, ink: link.querySelector('.print-jitter'), hovered: false,
  })).filter(item => item.ink).map(item => ({ ...item, letters: [...item.ink.children, ...item.link.querySelectorAll('svg.print-jitter, .nav-underline.print-jitter, .streaming-logo.print-jitter')] }));
  const engaged = item => item.hovered || item.link.matches(':focus-visible');
  const attributes = ['dx', 'dy', 'rotate'];
  const originals = words.map(word => ({
    values: attributes.map(name => word.getAttribute(name)),
    offsets: [...word.querySelectorAll('tspan[dx]')].map(span => ({
      span, value: span.getAttribute('dx'),
      index: word.textContent.trim().indexOf(span.textContent.trim()),
    })),
  }));
  let timer;
  let glyphs = [];
  function paperHeight() {
    const hero = document.querySelector('.hero');
    if (hero) document.body.style.setProperty('--hero-paper-height', `${hero.offsetTop + hero.offsetHeight}px`);
    const performance = document.querySelector('#listen');
    if (performance) document.body.style.setProperty('--poster-weathering-start', `${performance.getBoundingClientRect().bottom + window.scrollY}px`);
  }
  if (document.body && document.body.style) {
    paperHeight();
    addEventListener('resize', paperHeight);
    if (document.fonts) document.fonts.ready.then(paperHeight);
  }
  // Separate painted glyphs let the grain travel with each letter's transform.
  function buildGlyphs() {
    stop();
    glyphs.forEach(glyph => glyph.remove());
    glyphs = [];
    words.forEach(word => {
      word.style.visibility = '';
      const chars = word.textContent.trim();
      for (let i = 0; i < word.getNumberOfChars(); i++) {
        const start = word.getStartPositionOfChar(i);
        const end = word.getEndPositionOfChar(i);
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'moving-glyph');
        const glyph = word.cloneNode(false);
        glyph.classList.remove('print-jitter');
        glyph.textContent = chars[i];
        glyph.setAttribute('x', start.x);
        glyph.setAttribute('y', start.y);
        glyph.setAttribute('textLength', Math.hypot(end.x - start.x, end.y - start.y));
        glyph.setAttribute('aria-hidden', 'true');
        group.append(glyph);
        word.parentNode.append(group);
        glyphs.push(group);
      }
      word.style.visibility = 'hidden';
    });
    sync();
  }
  if (document.fonts && document.createElementNS) {
    document.fonts.ready.then(buildGlyphs);
    addEventListener('resize', buildGlyphs);
  }
  const random = amplitude => +( (Math.random() * 2 - 1) * amplitude).toFixed(3);
  const jitter = () => ({ x: random(.45), y: random(.8), angle: random(.55) });
  function restore(node, name, value) {
    if (value === null) node.removeAttribute(name);
    else node.setAttribute(name, value);
  }
  function stop() {
    clearInterval(timer);
    glyphs.forEach(glyph => { glyph.style.translate = ""; glyph.style.rotate = ""; });
    interactions.forEach(({letters}) => letters.forEach(letter => { letter.style.translate = ''; letter.style.rotate = ''; }));
    words.forEach((word, i) => {
      attributes.forEach((name, j) => restore(word, name, originals[i].values[j]));
      originals[i].offsets.forEach(({span, value}) => restore(span, 'dx', value));
    });
    if (astronaut) {
      astronaut.style.translate = astronautStyle[0];
      astronaut.style.rotate = astronautStyle[1];
    }
  }
  function update() {
    interactions.forEach(item => {
      item.letters.forEach(letter => {
        const frame = engaged(item) ? jitter() : null;
        letter.style.translate = frame ? `${frame.x}px ${frame.y}px` : '';
        letter.style.rotate = frame ? `${frame.angle}deg` : '';
      });
    });
    if (astronaut) {
      astronaut.style.translate = `${random(1.6)}px ${random(2.3)}px`;
      astronaut.style.rotate = `${random(.7)}deg`;
    }
    glyphs.forEach(glyph => {
      const frame = jitter();
      glyph.style.translate = `${frame.x}px ${frame.y}px`;
      glyph.style.rotate = `${frame.angle}deg`;
    });
    if (glyphs.length) return;
    words.forEach((word, row) => {
      const count = word.getNumberOfChars();
      const frames = Array.from({length:count}, jitter);
      const x = frames.map(frame => frame.x);
      const y = frames.map(frame => frame.y);
      // SVG dx/dy accumulate: differences make each glyph's displacement independent.
      const dx = x.map((value, i) => +(value - (x[i-1] || 0)).toFixed(3));
      const dy = y.map((value, i) => +(value - (y[i-1] || 0)).toFixed(3));
      word.setAttribute('dx', dx.join(' '));
      word.setAttribute('dy', dy.join(' '));
      word.setAttribute('rotate', frames.map(frame => frame.angle).join(' '));
      originals[row].offsets.forEach(({span, value, index}) => {
        span.setAttribute('dx', Number(value) + (dx[index] || 0));
      });
    });
  }
  function sync() {
    stop();
    if (reduced.matches || document.hidden || (!words.length && !astronaut && !interactions.some(engaged))) return;
    update();
    timer = setInterval(update, 150);
  }
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  interactions.forEach(item => {
    item.link.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch') return;
      item.hovered = true;
      sync();
    });
    item.link.addEventListener('pointerleave', () => { item.hovered = false; sync(); });
    item.link.addEventListener('pointercancel', () => { item.hovered = false; sync(); });
    item.link.addEventListener('focus', sync);
    item.link.addEventListener('blur', sync);
  });
  sync();
})();
