/* Shared glyph structure for display headings and dynamic gallery labels. */
(() => {
  function render(node) {
    if (node.querySelector('.display-word')) return;
    const text = node.textContent.trim();
    node.setAttribute('aria-label', text);
    const fragment = document.createDocumentFragment();
    text.split(/\s+/).forEach((word, i) => {
      if (i) fragment.append(document.createTextNode(' '));
      const group = document.createElement('span');
      group.className = 'display-word';
      group.setAttribute('aria-hidden', 'true');
      for (const char of word) {
        const glyph = document.createElement('span');
        glyph.className = 'display-letter';
        glyph.textContent = char;
        group.append(glyph);
      }
      fragment.append(group);
    });
    node.replaceChildren(fragment);
  }
  document.querySelectorAll('.cutout-type').forEach(node => {
    render(node);
    new MutationObserver(() => render(node)).observe(node, { childList: true });
  });
})();
