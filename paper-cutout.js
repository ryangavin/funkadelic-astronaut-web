/* A paper backing for arbitrary DOM content. No framework dependency. */
(() => {
  const template = document.createElement('template');
  template.innerHTML = "<svg class=\"astronaut-paper paper-cutout\" viewBox=\"0 0 720 1080\" aria-hidden=\"true\">\n            <defs>\n              <radialGradient id=\"astronaut-paper-aging\" gradientUnits=\"userSpaceOnUse\" cx=\"280\" cy=\"340\" r=\"780\" gradientTransform=\"translate(0 -80) scale(1 1.2)\">\n                <stop offset=\"0\" stop-color=\"#ead3a7\" />\n                <stop offset=\".52\" stop-color=\"#e7cda0\" />\n                <stop offset=\".8\" stop-color=\"#d8b985\" />\n                <stop offset=\"1\" stop-color=\"#c3a06b\" />\n              </radialGradient>\n              <path id=\"astronaut-paper-shape\" d=\"M 178 147 C 237 21 468 6 556 181 C 575 186 570 230 589 263 C 685 283 686 443 622 491 C 644 518 628 549 608 548 C 627 579 611 594 620 608 C 670 629 660 654 678 678 C 714 718 720 766 718 819 L 715 928 C 704 1000 262 1045 90 1006 C 41 995 -9 916 12 866 C 57 776 85 733 165 694 C 149 673 157 656 174 643 C 142 631 143 609 149 594 C 118 581 114 559 123 543 L 91 500 C 12 484 11 325 94 284 C 108 222 137 187 178 147 Z\" />\n              <filter id=\"torn-astronaut-paper\" x=\"-15%\" y=\"-15%\" width=\"130%\" height=\"130%\">\n                <feTurbulence type=\"fractalNoise\" baseFrequency=\".018\" numOctaves=\"2\" seed=\"19\" result=\"tear\" />\n                <feDisplacementMap in=\"SourceGraphic\" in2=\"tear\" scale=\"38\" xChannelSelector=\"R\" yChannelSelector=\"G\" result=\"ragged\" />\n                <feTurbulence type=\"fractalNoise\" baseFrequency=\".28\" numOctaves=\"2\" seed=\"47\" result=\"fibers\" />\n                <feDisplacementMap in=\"ragged\" in2=\"fibers\" scale=\"3\" xChannelSelector=\"R\" yChannelSelector=\"G\" />\n              </filter>\n              <mask id=\"astronaut-paper-outside\" maskUnits=\"userSpaceOnUse\" x=\"-80\" y=\"-80\" width=\"880\" height=\"1240\">\n                <rect x=\"-80\" y=\"-80\" width=\"880\" height=\"1240\" fill=\"white\" />\n                <use href=\"#astronaut-paper-shape\" fill=\"black\" stroke=\"black\" stroke-width=\"3\" />\n              </mask>\n            </defs>\n            <use href=\"#astronaut-paper-shape\" class=\"paper-cutout-fill\" />\n            <g mask=\"url(#astronaut-paper-outside)\" filter=\"url(#torn-astronaut-paper)\">\n              <use href=\"#astronaut-paper-shape\" class=\"paper-cutout-fibers\" />\n              <use href=\"#astronaut-paper-shape\" class=\"paper-cutout-margin\" />\n            </g>\n          </svg>";
  const astronautPath = "M 178 147 C 237 21 468 6 556 181 C 575 186 570 230 589 263 C 685 283 686 443 622 491 C 644 518 628 549 608 548 C 627 579 611 594 620 608 C 670 629 660 654 678 678 C 714 718 720 766 718 819 L 715 928 C 704 1000 262 1045 90 1006 C 41 995 -9 916 12 866 C 57 776 85 733 165 694 C 149 673 157 656 174 643 C 142 631 143 609 149 594 C 118 581 114 559 123 543 L 91 500 C 12 484 11 325 94 284 C 108 222 137 187 178 147 Z";
  const instances = new WeakMap();
  let serial = 0;
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
    svg.querySelector('.paper-cutout-fill').style.fill = paint;
    svg.querySelector('.paper-cutout-margin').style.stroke = paint;
    host.classList.add('paper-piece');
    host.prepend(svg);
    let settings = {};
    function draw() {
      const custom = settings.path || settings.preset === 'astronaut';
      const width = custom ? (settings.width || 720) : 720;
      const height = custom ? (settings.height || 1080) : 720 * host.clientHeight / Math.max(1, host.clientWidth);
      if (!height) return;
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      shape.setAttribute('d', settings.path || (custom ? astronautPath : `M0 0H${width}V${height}H0Z`));
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
      settings = {...settings, ...next};
      const defaults = settings.preset === 'astronaut' ? {margin:80, tear:38} : {margin:24, tear:12};
      const margin = settings.margin ?? defaults.margin;
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
    const api = {update, destroy() { observer.disconnect(); svg.remove(); host.classList.remove('paper-piece', 'paper-piece-jitter'); instances.delete(host); }};
    instances.set(host, api);
    update(options);
    return api;
  }
  window.PaperCutout = {mount};
  document.querySelectorAll('[data-paper-cutout]').forEach(host => mount(host, {preset:host.dataset.paperCutout}));
})();
