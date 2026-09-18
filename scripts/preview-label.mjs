/** Local preview identification, including titles rewritten after story navigation. */
export function previewLabelHead(label) {
  if (!label?.trim()) return '';
  const prefix = JSON.stringify(`[${label.trim()}] `).replace(/</g, '\\u003c');
  return `<script>(() => {
    const prefix = ${prefix};
    const update = () => {
      if (!document.title.startsWith(prefix)) document.title = prefix + document.title;
    };
    new MutationObserver(update).observe(document.head, { childList: true, subtree: true, characterData: true });
    update();
  })();</script>`;
}
