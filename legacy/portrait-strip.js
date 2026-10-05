/* Real individual photographs, with full-head bounds protected in each overview strip. */
(() => {
  const strip = document.querySelector('.band-portraits');
  if (!strip) return;
  const bounds = [[.25,.07,.42,.45], [.59,.005,.735,.285], [.03,.005,.36,.72]];
  function fit() {
    [...strip.querySelectorAll('img')].forEach((image, i) => {
      if (!image.naturalWidth) return;
      const frame = image.parentElement;
      const w = frame.clientWidth, h = frame.clientHeight;
      if (!w || !h) return;
      const [x1,y1,x2,y2] = bounds[i];
      const scale = Math.min(
        Math.max(w / image.naturalWidth, h / image.naturalHeight),
        (w - 12) / (image.naturalWidth * (x2 - x1)),
        (h - 16) / (image.naturalHeight * (y2 - y1))
      );
      const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
      const center = (x1 + x2) / 2;
      image.style.width = `${width}px`;
      image.style.height = `${height}px`;
      image.style.left = `${w / 2 - center * width}px`;
      image.style.top = '0px';
    });
  }
  strip.querySelectorAll('img').forEach(image => image.addEventListener('load', fit));
  new ResizeObserver(fit).observe(strip);
  fit();
})();
