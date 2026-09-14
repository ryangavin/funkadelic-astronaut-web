/* A paper backing for arbitrary DOM content. No framework dependency. */
(() => {
  const template = document.createElement('template');
  template.innerHTML = "<svg class=\"astronaut-paper paper-cutout\" viewBox=\"0 0 720 1080\" aria-hidden=\"true\">\n            <defs>\n              <radialGradient id=\"astronaut-paper-aging\" gradientUnits=\"userSpaceOnUse\" cx=\"280\" cy=\"340\" r=\"780\" gradientTransform=\"translate(0 -80) scale(1 1.2)\">\n                <stop offset=\"0\" stop-color=\"#ead3a7\" />\n                <stop offset=\".52\" stop-color=\"#e7cda0\" />\n                <stop offset=\".8\" stop-color=\"#d8b985\" />\n                <stop offset=\"1\" stop-color=\"#c3a06b\" />\n              </radialGradient>\n              <path id=\"astronaut-paper-shape\" d=\"M 178 147 C 237 21 468 6 556 181 C 575 186 570 230 589 263 C 685 283 686 443 622 491 C 644 518 628 549 608 548 C 627 579 611 594 620 608 C 670 629 660 654 678 678 C 714 718 720 766 718 819 L 715 928 C 704 1000 262 1045 90 1006 C 41 995 -9 916 12 866 C 57 776 85 733 165 694 C 149 673 157 656 174 643 C 142 631 143 609 149 594 C 118 581 114 559 123 543 L 91 500 C 12 484 11 325 94 284 C 108 222 137 187 178 147 Z\" />\n              <filter id=\"torn-astronaut-paper\" x=\"-15%\" y=\"-15%\" width=\"130%\" height=\"130%\">\n                <feTurbulence type=\"fractalNoise\" baseFrequency=\".018\" numOctaves=\"2\" seed=\"19\" result=\"tear\" />\n                <feDisplacementMap in=\"SourceGraphic\" in2=\"tear\" scale=\"38\" xChannelSelector=\"R\" yChannelSelector=\"G\" result=\"ragged\" />\n                <feTurbulence type=\"fractalNoise\" baseFrequency=\".28\" numOctaves=\"2\" seed=\"47\" result=\"fibers\" />\n                <feDisplacementMap in=\"ragged\" in2=\"fibers\" scale=\"3\" xChannelSelector=\"R\" yChannelSelector=\"G\" />\n              </filter>\n              <mask id=\"astronaut-paper-outside\" maskUnits=\"userSpaceOnUse\" x=\"-80\" y=\"-80\" width=\"880\" height=\"1240\">\n                <rect x=\"-80\" y=\"-80\" width=\"880\" height=\"1240\" fill=\"white\" />\n                <use href=\"#astronaut-paper-shape\" fill=\"black\" stroke=\"black\" stroke-width=\"3\" />\n              </mask>\n            </defs>\n            <use href=\"#astronaut-paper-shape\" class=\"paper-cutout-fill\" />\n            <g mask=\"url(#astronaut-paper-outside)\" filter=\"url(#torn-astronaut-paper)\">\n              <use href=\"#astronaut-paper-shape\" class=\"paper-cutout-fibers\" />\n              <use href=\"#astronaut-paper-shape\" class=\"paper-cutout-margin\" />\n            </g>\n          </svg>";
  const astronautPath = "M 178 147 C 237 21 468 6 556 181 C 575 186 570 230 589 263 C 685 283 686 443 622 491 C 644 518 628 549 608 548 C 627 579 611 594 620 608 C 670 629 660 654 678 678 C 714 718 720 766 718 819 L 715 928 C 704 1000 262 1045 90 1006 C 41 995 -9 916 12 866 C 57 776 85 733 165 694 C 149 673 157 656 174 643 C 142 631 143 609 149 594 C 118 581 114 559 123 543 L 91 500 C 12 484 11 325 94 284 C 108 222 137 187 178 147 Z";
  // Shared material presets; callers supply geometry, not duplicate finishes.
  const presets = {
    scrap: {
      margin: 22, fiberOpacity: .35, edgeHighlight: .5,
      agingColors: ['#f6e8ca', '#f0dfbc', '#e8d3ab', '#ddc298'],
      shadow: 'var(--paper-shadow)',
    },
  };
  const instances = new WeakMap();
  let serial = 0;
  function handTornPath(width, height, unitsPerPixel, seed, corners) {
    const depth = Math.min(9, Math.max(5, width / unitsPerPixel * .018)) * unitsPerPixel;
    const rotate = (values, amount) => values.map((_, index) => values[(index + amount) % values.length]);
    const top = rotate([.35, .12, .58, .06, .32, 1, .16, .48, .08, .7, .2, .4], seed % 5);
    const right = rotate([.25, .62, .08, .42, .9, .16, .5, .06, .72], seed % 3);
    const bottom = rotate([.5, .1, .68, .2, .92, .08, .42, .16, .75, .04, .55, .28], seed % 7);
    const left = rotate([.18, .55, .05, .82, .22, .46, .1, .68, .3], seed % 4);
    // Each corner gets a different torn approach and exit. The named diagonal
    // only controls which pair is strongest; it never leaves the other pair square.
    const profiles = corners === 'tr-bl'
      ? {tl:[1.05,.58,.92], tr:[1.52,.84,1.28], br:[1.12,.66,.96], bl:[1.43,.76,1.22]}
      : {tl:[1.46,.78,1.18], tr:[1.08,.62,.9], br:[1.5,.82,1.26], bl:[1.16,.7,1.02]};
    const variation = ((seed % 4) - 1.5) * .06;
    top[0] = profiles.tl[0] + variation;
    top[1] = profiles.tl[1];
    left[left.length - 1] = profiles.tl[2] - variation;
    top[top.length - 1] = profiles.tr[0] - variation;
    top[top.length - 2] = profiles.tr[1];
    right[1] = profiles.tr[2] + variation;
    right[right.length - 1] = profiles.br[0] + variation;
    bottom[1] = profiles.br[1];
    bottom[0] = profiles.br[2] - variation;
    bottom[bottom.length - 1] = profiles.bl[0] - variation;
    bottom[bottom.length - 2] = profiles.bl[1];
    left[1] = profiles.bl[2] + variation;
    const points = [];
    top.forEach((inset, index) => points.push([width * index / (top.length - 1), depth * inset]));
    right.slice(1).forEach((inset, index) => points.push([width - depth * inset, height * (index + 1) / right.length]));
    bottom.slice(1).forEach((inset, index) => points.push([width * (1 - (index + 1) / bottom.length), height - depth * inset]));
    left.slice(1).forEach((inset, index) => points.push([depth * inset, height * (1 - (index + 1) / left.length)]));
    return `M${points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}Z`;
  }
  function softWavyPath(width, height, unitsPerPixel, seed, clipCorner) {
    const depth = Math.min(2.4, Math.max(1.25, width / unitsPerPixel * .0045)) * unitsPerPixel;
    const clip = Math.min(12, Math.max(7, width / unitsPerPixel * .022)) * unitsPerPixel;
    const rotate = (values, amount) => values.map((_, index) => values[(index + amount) % values.length]);
    const top = rotate([.34,.12,.48,.22,.4,.08,.3,.18,.44,.14], seed % 4);
    const right = rotate([.2,.42,.1,.3,.16,.46,.12,.34], seed % 3);
    const bottom = rotate([.38,.14,.46,.2,.3,.08,.42,.16,.34,.12], seed % 5);
    const left = rotate([.16,.4,.1,.32,.2,.44,.12,.28], seed % 4);
    // Soft photo paper keeps complete corners. Ryan's optional punctuation is
    // one short, clean diagonal at the bottom-left—not a torn macro contour.
    const points = [[0, 0]];
    top.slice(1, -1).forEach((inset, index) => points.push([width * (index + 1) / (top.length - 1), depth * inset]));
    points.push([width, 0]);
    right.slice(1, -1).forEach((inset, index) => points.push([width - depth * inset, height * (index + 1) / (right.length - 1)]));
    points.push([width, height]);
    bottom.slice(1, -1).forEach((inset, index) => points.push([width * (1 - (index + 1) / (bottom.length - 1)), height - depth * inset]));
    if (clipCorner === 'bottom-left') points.push([clip, height], [0, height - clip]);
    else points.push([0, height]);
    left.slice(1, -1).forEach((inset, index) => points.push([depth * inset, height * (1 - (index + 1) / (left.length - 1))]));
    return `M${points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}Z`;
  }
  function mount(host, options = {}) {
    if (instances.has(host)) return instances.get(host);
    const svg = template.content.firstElementChild.cloneNode(true);
    const prefix = `paper-${++serial}`;
    for (const el of [svg, ...svg.querySelectorAll('*')]) {
      for (const attr of [...el.attributes]) {
        el.setAttribute(attr.name, attr.value.replace(/astronaut-paper-(aging|shape|outside)|torn-astronaut-paper/g, match => `${prefix}-${match}`));
      }
    }
    svg.classList.remove('astronaut-paper');
    const shape = svg.querySelector('path');
    const gradient = svg.querySelector('radialGradient');
    const paint = `url(#${gradient.id})`;
    const ns = 'http://www.w3.org/2000/svg';
    const speckles = document.createElementNS(ns, 'pattern');
    speckles.id = `${prefix}-speckles`;
    speckles.setAttribute('patternUnits', 'userSpaceOnUse');
    for (const asset of ['paper-dark-flecks.svg', 'print-wear.svg']) {
      const image = document.createElementNS(ns, 'image');
      image.setAttribute('href', `assets/${asset}`);
      image.setAttribute('preserveAspectRatio', 'none');
      if (asset === 'print-wear.svg') image.setAttribute('opacity', '.5');
      speckles.append(image);
    }
    svg.querySelector('defs').append(speckles);
    const weathering = document.createElementNS(ns, 'use');
    weathering.setAttribute('href', `#${shape.id}`);
    weathering.setAttribute('fill', `url(#${speckles.id})`);
    weathering.setAttribute('stroke', `url(#${speckles.id})`);
    weathering.setAttribute('stroke-linejoin', 'round');
    weathering.setAttribute('filter', svg.querySelector('g[filter]').getAttribute('filter'));
    svg.append(weathering);
    svg.querySelector('.paper-cutout-fill').style.fill = paint;
    svg.querySelector('.paper-cutout-margin').style.stroke = paint;
    host.classList.add('paper-piece');
    host.prepend(svg);
    let settings = {};
    function draw() {
      const custom = settings.path || settings.preset === 'astronaut';
      const width = custom ? (settings.width || 720) : 720;
      const height = custom ? (settings.height || 1080) : 720 * svg.clientHeight / Math.max(1, svg.clientWidth);
      if (!height) return;
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      // Keep the same physical speckle scale across differently sized scraps.
      const unitsPerPixel = width / Math.max(1, svg.clientWidth);
      // Match the approved astronaut's two-stage tear at its rendered scale.
      // A long word strip must not magnify the filter's reference-unit details.
      const astronaut = document.querySelector('.astronaut');
      const referenceScale = astronaut ? astronaut.clientWidth / 720 : .4;
      const tearScale = custom ? 1 : unitsPerPixel * referenceScale;
      const filter = svg.querySelector('filter');
      const noises = filter.querySelectorAll('feTurbulence');
      const displacements = filter.querySelectorAll('feDisplacementMap');
      [{frequency: .018, amplitude: 38}, {frequency: .28, amplitude: 3}].forEach((layer, i) => {
        noises[i].setAttribute('baseFrequency', layer.frequency / tearScale);
        noises[i].setAttribute('numOctaves', '2');
        const amplitude = i === 0
          ? settings.tear ?? (settings.edge === 'soft' ? 6 : layer.amplitude)
          : layer.amplitude;
        displacements[i].setAttribute('scale', amplitude * tearScale);
      });
      if (settings.edgeHighlight !== undefined) {
        // Exposed pale fibers sit outside the stock, just like the astronaut.
        const margin = settings.margin ?? 24;
        svg.style.setProperty('--paper-fiber-edge', margin + 2 * settings.edgeHighlight * unitsPerPixel);
        svg.querySelector('.paper-cutout-fibers').style.strokeDasharray =
          [1, 19, 2, 37, 1, 11, 3, 53].map(value => value * unitsPerPixel).join(' ');
      }
      const tile = 640 * unitsPerPixel;
      speckles.setAttribute('width', tile);
      speckles.setAttribute('height', tile);
      for (const image of speckles.children) {
        image.setAttribute('width', tile);
        image.setAttribute('height', tile);
      }
      const shapePath = settings.path || (custom
        ? astronautPath
        : settings.edge === 'hand-torn'
          ? handTornPath(width, height, unitsPerPixel, settings.edgeSeed ?? serial, settings.corners)
          : settings.edge === 'soft'
            ? softWavyPath(width, height, unitsPerPixel, settings.edgeSeed ?? serial, settings.clipCorner)
            : `M0 0H${width}V${height}H0Z`);
      shape.setAttribute('d', shapePath);
      const mask = svg.querySelector('mask');
      const rect = mask.querySelector('rect');
      for (const el of [mask, rect]) {
        el.setAttribute('x', -width / 4); el.setAttribute('y', -height / 4);
        el.setAttribute('width', width * 1.5); el.setAttribute('height', height * 1.5);
      }
      gradient.setAttribute('cx', width * 280 / 720);
      gradient.setAttribute('cy', height * 340 / 1080);
      gradient.setAttribute('r', Math.max(width, height) * 780 / 1080);
      gradient.setAttribute('gradientTransform', `translate(0 ${-height * 80 / 1080}) scale(1 1.2)`);
    }
    function update(next) {
      settings = {...settings, ...presets[next.preset], ...next};
      const defaults = settings.preset === 'astronaut' ? {margin:80, tear:38} : {margin:24, tear:12};
      // Rectangular scraps are one continuous torn silhouette. Masking a
      // separate margin around a square fill leaves a visible rectangular seam.
      if (settings.preset !== 'astronaut' && !settings.path) {
        const edge = svg.querySelector('g[filter]');
        edge.removeAttribute('mask');
        const fill = svg.querySelector('.paper-cutout-fill');
        fill.removeAttribute('filter');
        weathering.removeAttribute('filter');
        // Distort the complete material once. Separate filters used different
        // bounds and exposed displaced white fiber strokes inside the paper.
        edge.insertBefore(fill, svg.querySelector('.paper-cutout-margin'));
        edge.append(weathering);
      }
      const margin = settings.margin ?? defaults.margin;
      weathering.setAttribute('stroke-width', margin);
      svg.style.setProperty('--paper-margin', margin);
      svg.style.setProperty('--paper-fiber-edge', margin + (settings.fibers ?? 5));
      svg.style.setProperty('--paper-fiber-opacity', settings.fiberOpacity ?? .48);
      svg.style.setProperty('--paper-color', settings.color || 'var(--cream)');
      svg.querySelector('feDisplacementMap').setAttribute('scale', settings.tear ?? defaults.tear);
      if (settings.shadow !== undefined) svg.style.filter = settings.shadow;
      const stops = svg.querySelectorAll('stop');
      stops.forEach((stop, i) => {
        stop.style.stopColor = settings.color || (settings.preset === 'astronaut' ? ['#ead3a7','#e7cda0','#d8b985','#c3a06b'][i] : 'var(--cream)');
        if (settings.agingColors) stop.style.stopColor = settings.agingColors[i] || settings.agingColors.at(-1);
      });
      host.classList.toggle('paper-piece-jitter', !!settings.jitter);
      draw();
    }
    const observer = new ResizeObserver(draw);
    observer.observe(host);
    const api = {
      update,
      restore() {
        if (svg.parentNode !== host) host.prepend(svg);
        draw();
        return svg;
      },
      destroy() { observer.disconnect(); svg.remove(); host.classList.remove('paper-piece', 'paper-piece-jitter'); instances.delete(host); },
    };
    instances.set(host, api);
    update(options);
    return api;
  }
  document.querySelectorAll('.navigation a').forEach(host => mount(host, {preset: 'scrap', margin: 32}));
  const streaming = document.querySelector('.hero > .streaming-links');
  if (streaming) mount(streaming, {preset: 'scrap'});
  const wordmark = document.querySelector('.wordmark');
  if (wordmark) {
    for (const word of ['funk', 'astro']) {
      const strip = document.createElement('span');
      strip.className = `word-paper word-paper-${word}`;
      strip.setAttribute('aria-hidden', 'true');
      wordmark.append(strip);
      mount(strip, {preset: 'scrap', margin: 8});
    }
  }
  const playButton = document.querySelector('#play-video');
  if (playButton) mount(playButton, {
    preset: 'scrap',
    path: 'M360 48 A312 312 0 1 1 359.99 48 Z',
    width: 720, height: 720, margin: 24, tear: 50,
  });
  // The control remains a large transparent rectangle for touch/focus, while
  // its visible paper follows the same arrow silhouette as the red ink layer.
  const controlArrowPaths = {
    'previous-member': 'M3 15 18 3 20 11 36 9 37 22 20 21 18 29Z',
    'next-member': 'M37 15 22 3 20 11 4 9 3 22 20 21 22 29Z',
  };
  document.querySelectorAll('.gallery-arrow-cutout').forEach(host => mount(host, {
    preset: 'scrap',
    path: controlArrowPaths[host.closest('.gallery-arrow').id],
    width: 40,
    height: 32,
    margin: 9,
    tear: 2.4,
    edgeHighlight: .45,
  }));
  window.PaperCutout = {
    mount,
    update(host, next) {
      return instances.get(host)?.update(next) || null;
    },
    restore(host) {
      return instances.get(host)?.restore() || null;
    },
  };
  document.querySelectorAll('[data-paper-cutout]').forEach(host => mount(host, {
    preset: host.dataset.paperCutout,
    edge: host.dataset.paperEdge,
  }));
})();
