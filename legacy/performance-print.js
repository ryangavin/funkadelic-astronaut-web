/* Hold muted performance frames on the print cadence; the native player owns media loading. */
(() => {
  const video = document.querySelector("#performance");
  const canvas = document.querySelector("#performance-print");
  const player = document.querySelector("#inline-player");
  const scene = document.querySelector("#listen");
  if (!video || !canvas || !player || !scene) return;
  const context = canvas.getContext("2d", { alpha: false });
  let cadence = 100; // 1.5× the original rate; typography stays at 150ms.

  let timer,
    visible = false,
    suspended = false,
    failed = !context,
    waiting = false;
  const canDraw = () =>
    !scene.classList.contains("sound-enabled") &&
    !failed &&
    !suspended &&
    !document.hidden &&
    visible &&
    video.readyState >= 2 &&
    video.videoWidth > 0 &&
    video.videoHeight > 0;
  function stop() {
    clearInterval(timer);
    timer = undefined;
  }
  function revealNative() {
    player.classList.remove("has-print-frame");
  }
  function draw() {
    if (!canDraw() || video.seeking) return;
    // Keep the complete 1280×720 artwork on desktop AND mobile; no spatial crushing.
    const width = video.videoWidth;
    const height = video.videoHeight;
    try {
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      context.drawImage(video, 0, 0, width, height);
      player.classList.add("has-print-frame");
    } catch {
      // Keep the original playback path usable if this browser cannot copy frames.
      failed = true;
      stop();
      revealNative();
    }
  }
  function sync() {
    stop();
    if (!canDraw()) return;
    draw();
    if (!failed && !video.paused && !video.ended && !video.seeking && !waiting)
      timer = setInterval(draw, cadence);
  }
  video.addEventListener("playing", () => {
    waiting = false;
    sync();
  });
  video.addEventListener("pause", sync);
  video.addEventListener("ended", sync);
  video.addEventListener("seeking", stop);
  video.addEventListener("seeked", sync);
  video.addEventListener("waiting", () => {
    waiting = true;
    stop();
  });
  video.addEventListener("loadeddata", () => {
    failed = !context;
    waiting = false;
    sync();
  });
  for (const event of ["emptied", "error", "abort"])
    video.addEventListener(event, () => {
      stop();
      revealNative();
      waiting = false;
    });
  canvas.addEventListener("contextlost", () => {
    failed = true;
    stop();
    revealNative();
  });
  canvas.addEventListener("contextrestored", () => {
    failed = false;
    sync();
  });
  // Explicit playback freezes the outgoing print frame for the CSS fade. The
  // shared media controller owns play/pause, source attachment and sound.
  const modeObserver = new MutationObserver(sync);
  modeObserver.observe(scene, { attributes: true, attributeFilter: ["class"] });
  document.addEventListener("visibilitychange", sync);
  addEventListener("resize", sync);
  const observer = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    sync();
  });
  observer.observe(player);
  addEventListener("pagehide", () => {
    suspended = true;
    stop();
    observer.disconnect();
    modeObserver.disconnect();
  });
  addEventListener("pageshow", () => {
    suspended = false;
    observer.observe(player);
    modeObserver.observe(scene, {
      attributes: true,
      attributeFilter: ["class"],
    });
    sync();
  });
  const treatment = window.AmbientTreatment;
  window.ambientVideoStudio = {
    defaults: treatment.defaults,
    preview(draft = {}) {
      const v = { ...treatment.defaults, ...treatment.validate(draft) };
      const sources = window.ambientVideoSources || [];
      const source = sources.find(s => s.id === v.source) || sources.find(s => s.id === treatment.defaults.source);
      if (source) window.livingVideo?.selectAmbientSource(source);
      const filter = document.querySelector("#ambient-print-finish");
      const { slope, intercept } = treatment.transfer(v);
      for (const channel of filter.querySelectorAll(".ambient-level-channel")) {
        channel.setAttribute("slope", slope);
        channel.setAttribute("intercept", intercept);
      }
      scene.style.setProperty("--ambient-grain", v.grain);
      const next = 1000 / v.fps;
      if (next !== cadence) { cadence = next; sync(); }
    },
  };
  // The same element supplies muted ambient frames and explicit unfiltered playback.
})();
