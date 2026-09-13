/* Local typography drafts. No production defaults are changed by this panel. */
(() => {
  const key = `fa-typography-v1:${location.pathname}`;
  const groups = [
    ['globalAll', 'Global · all fonts', ':where(body, body *)'],
    ['globalDisplay', 'Global · display fonts', ':where(.wordmark svg text, .utility, .anchors a, .scene-content > h2, .press-page h1, .press-page h2)'],
    ['globalBody', 'Global · reading fonts', ':where(p, li, th, td, .text-link, .gallery-controls button)'],
    ['wordmark', 'Whole wordmark', '.wordmark'],
    ['funk', 'FUNKADELIC', '.funk-word'], ['astro', 'ASTRONAUT', '.astro-word'],
    ['press', 'Press kit link', '.navigation > .utility:not(.booking)'],
    ['booking', 'Booking link', '.navigation .booking'],
    ['nav', 'Navigation links', '.anchors a'],
    ['listen', 'Listen heading', '#listen-title'], ['learn', 'About heading', '#learn-title'],
    ['live', 'Tour heading', '#live-title'],
    ['session', 'Performance caption', '.play-area .eyebrow'],
    ['role', 'Band / member label', '#member-role'], ['name', 'Band / member name', '#member-name'],
    ['story', 'Biography paragraphs', '#member-story p'],
    ['shows', 'Upcoming shows label', '.tour-label'], ['table', 'Show table headings', '.live th'],
    ['empty', 'Show announcement', '.empty-title'], ['dates', 'Show details', '.live td p:not(.empty-title)'],
    ['follow', 'Show follow link', '.live .text-link'],
    ['pressTitle', 'Press page title', '.press-page h1'], ['pressHeadings', 'Press page headings', '.press-page h2'],
    ['pressBody', 'Press page text', '.press-page p, .press-page li'],
  ].filter(([, , selector]) => document.querySelector(selector));
  const fields = [
    ['size', 'Font size (px / SVG units)', 1, 500, 1],
    ['tracking', 'Letter spacing (em)', -0.2, 0.5, 0.005],
    ['line', 'Line height', 0.5, 3, 0.05],
    ['weight', 'Font weight', 100, 900, 100],
    ['x', 'Horizontal offset (px / SVG units)', -500, 500, 1],
    ['y', 'Vertical offset (px / SVG units)', -500, 500, 1],
    ['rotation', 'Added rotation (degrees)', -45, 45, 0.5],
    ['scaleX', 'Width scale', 0.5, 2, 0.01],
    ['scaleY', 'Height scale', 0.5, 2, 0.01],
    ['glyph', 'Individual letter width', 0.5, 2, 0.01],
    ['gap', 'Individual letter margins (em)', -0.1, 0.3, 0.005],
    ['length', 'SVG text length (SVG units)', 100, 1200, 1],
  ];
  // Keep paired transform controls aligned with the adopted site defaults.
  const adopted = { wordmark: { x:0, y:0, rotation:0, scaleX:1, scaleY:1 } };
  const scopes = { all: '', desktop: '(min-width: 761px)', mobile: '(max-width: 760px)' };
  const fonts = { modak: 'Modak, Georgia, serif', shrikhand: 'Shrikhand, Georgia, serif', cooper: '"Cooper Black", Georgia, serif', fraunces: 'Fraunces, Georgia, serif', abril: '"Abril Fatface", Georgia, serif', bungee: 'Bungee, sans-serif', righteous: 'Righteous, sans-serif', space: '"Space Grotesk", Arial, sans-serif', inter: 'Inter, Arial, sans-serif', courier: '"Courier New", monospace', impact: 'Impact, sans-serif', chicle: 'Modak, Georgia, serif', sans: '"Helvetica Neue", Arial, sans-serif', serif: 'Georgia, serif', mono: 'monospace' };
  const webFonts = { modak: 'Modak', shrikhand: 'Shrikhand', fraunces: 'Fraunces:wght@100;200;300;400;500;600;700;800;900', abril: 'Abril+Fatface', bungee: 'Bungee', righteous: 'Righteous', space: 'Space+Grotesk:wght@300;400;500;600;700', inter: 'Inter:wght@100;200;300;400;500;600;700;800;900' };
  const loadedFonts = new Set();
  function loadFonts() {
    for (const values of Object.values(draft).flatMap(Object.values)) {
      const family = webFonts[values.font];
      if (!family || loadedFonts.has(family)) continue;
      loadedFonts.add(family);
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
      document.head.append(link);
    }
  }
  let draft = { all: {}, desktop: {}, mobile: {} }, selected = groups[0][0], scope = 'all', preview = true;
  let storageFailed = false;
  // Only known, bounded values can become CSS, including drafts restored from storage.
  function validate(data) {
    const clean = { all: {}, desktop: {}, mobile: {} };
    for (const s of Object.keys(scopes)) for (const [id] of groups) {
      const values = data?.[s]?.[id];
      if (!values || typeof values !== 'object') continue;
      const result = {};
      for (const [name, , min, max] of fields) {
        if (typeof values[name] === 'number' && Number.isFinite(values[name]) && values[name] >= min && values[name] <= max) result[name] = values[name];
      }
      if (Object.hasOwn(fonts, values.font)) result.font = values.font;
      if (/^#[0-9a-f]{6}$/i.test(values.color)) result.color = values.color;
      if (Object.keys(result).length) clean[s][id] = result;
    }
    return clean;
  }
  try { draft = validate(JSON.parse(localStorage.getItem(key))); } catch { /* A fresh draft is safe. */ }
  // Adopt the level title without discarding other saved typography choices.
  const levelWordmarkRevision = `${key}:level-wordmark-1`;
  try {
    if (!localStorage.getItem(levelWordmarkRevision)) {
      localStorage.setItem(`${levelWordmarkRevision}:previous`, JSON.stringify(draft));
      for (const values of Object.values(draft)) {
        if (values.wordmark) delete values.wordmark.rotation;
      }
      localStorage.setItem(key, JSON.stringify(draft));
      localStorage.setItem(levelWordmarkRevision, 'applied');
    }
  } catch { /* Site defaults remain usable without persistent storage. */ }
  // Retire saved title offsets/scales now that the title owns its flow space.
  const flowWordmarkRevision = `${key}:flow-wordmark-1`;
  let flowWordmarkApplied = false;
  try { flowWordmarkApplied = !!localStorage.getItem(flowWordmarkRevision); } catch {}
  if (!flowWordmarkApplied) {
    const previous = JSON.stringify(draft);
    for (const values of Object.values(draft)) {
      if (!values.wordmark) continue;
      for (const field of ['x', 'y', 'rotation', 'scaleX', 'scaleY']) delete values.wordmark[field];
    }
    try {
      localStorage.setItem(`${flowWordmarkRevision}:previous`, previous);
      localStorage.setItem(key, JSON.stringify(draft));
      localStorage.setItem(flowWordmarkRevision, 'applied');
    } catch { /* The in-memory draft still uses the flow layout. */ }
  }
  // The user requested a layout reset for Listen/Learn only. Keep the old
  // draft recoverable and retain every unrelated choice (including their fonts).
  const sectionLayoutRevision = `${key}:section-layout-2`;
  try {
    if (!localStorage.getItem(sectionLayoutRevision)) {
      localStorage.setItem(`${sectionLayoutRevision}:previous`, JSON.stringify(draft));
      for (const values of Object.values(draft)) for (const id of ['listen', 'learn']) {
        if (!values[id]) continue;
        for (const field of ['size', 'line', 'x', 'y', 'rotation', 'scaleX', 'scaleY', 'glyph', 'gap']) delete values[id][field];
      }
      localStorage.setItem(key, JSON.stringify(draft));
      localStorage.setItem(sectionLayoutRevision, 'applied');
    }
  } catch { /* Layout defaults remain usable without persistent storage. */ }
  const overrides = document.createElement('style');
  document.head.append(overrides);
  const originalLengths = new Map();
  for (const node of document.querySelectorAll('.funk-word, .astro-word')) originalLengths.set(node, node.getAttribute('textLength'));
  function rules() {
    const result = [];
    for (const s of Object.keys(scopes)) for (const [id, label, selector] of groups) {
      const v = draft[s][id];
      if (!v) continue;
      const css = {};
      const inherited = { ...adopted[id], ...(s === 'all' ? {} : draft.all[id]) };
      if (v.size !== undefined) css['font-size'] = `${v.size}px`;
      if (v.tracking !== undefined) css['letter-spacing'] = `${v.tracking}em`;
      if (v.line !== undefined) css['line-height'] = `${v.line}`;
      if (v.weight !== undefined) css['font-weight'] = `${v.weight}`;
      // Old local drafts must follow the site's two-font palette.
      if (v.font) result.push({ label, selector: `${selector}, :is(${selector}) :where(*)`, media: scopes[s] || null, css: { 'font-family': ['modak', 'chicle'].includes(v.font) ? fonts.modak : 'var(--body-face)' } });
      if (v.color) { css.color = v.color; css.fill = v.color; }
      if (v.x !== undefined || v.y !== undefined) css.translate = `${v.x ?? inherited.x ?? 0}px ${v.y ?? inherited.y ?? 0}px`;
      if (v.rotation !== undefined) css.rotate = `${v.rotation}deg`;
      if (v.scaleX !== undefined || v.scaleY !== undefined) css.scale = `${v.scaleX ?? inherited.scaleX ?? 1} ${v.scaleY ?? inherited.scaleY ?? 1}`;
      if (id === 'follow' && (css.translate || css.rotate || css.scale)) css.display = 'inline-block';
      if (Object.keys(css).length) result.push({ label, selector, media: scopes[s] || null, css });
      const glyphCSS = {};
      if (v.glyph !== undefined) glyphCSS.transform = `scaleX(${v.glyph})`;
      if (v.gap !== undefined) glyphCSS['margin-inline'] = `${v.gap}em`;
      if (Object.keys(glyphCSS).length) result.push({ label, selector: `${selector} .display-letter`, media: scopes[s] || null, css: glyphCSS });
    }
    return result;
  }
  function apply() {
    loadFonts();
    overrides.textContent = preview ? rules().map(r => {
      const rule = `${r.selector} { ${Object.entries(r.css).map(([p, v]) => `${p}: ${v} !important;`).join(' ')} }`;
      return r.media ? `@media ${r.media} { ${rule} }` : rule;
    }).join('\n') : '';
    for (const [node, original] of originalLengths) {
      const id = node.matches('.funk-word') ? 'funk' : 'astro';
      const current = { ...draft.all[id], ...draft[innerWidth <= 760 ? 'mobile' : 'desktop'][id] };
      node.setAttribute('textLength', preview ? current.length ?? original : original);
    }
  }
  // Preserve accepted local typography while the overlay now edits ribbons.
  addEventListener('resize', apply);
  apply();
})();
