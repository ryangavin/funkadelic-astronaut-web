/* Hold the displayed image on the print cadence; native video owns all audio and controls. */
(() => {
  const video = document.querySelector("#performance");
  const canvas = document.querySelector("#performance-print");
  const player = document.querySelector("#inline-player");
  const scene = document.querySelector("#listen");
  if (!video || !canvas || !player || !scene) return;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) return; // Native video still gets the CSS four-tone treatment.

  let timer,
    visible = false,
    suspended = false,
    failed = false,
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
    // A single bounded blit, no getImageData, export, WebGL upload, or pixel loop.
    // Copying even a tainted native-HLS frame for display does not require readback.
    const maxWidth = innerWidth <= 760 ? 640 : 960;
    const scale = Math.min(
      1,
      maxWidth / video.videoWidth,
      540 / video.videoHeight,
    );
    const width = Math.max(1, Math.round(video.videoWidth * scale));
    const height = Math.max(1, Math.round(video.videoHeight * scale));
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
      timer = setInterval(draw, PRINT_CADENCE_MS);
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
    failed = false;
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
  // Explicit playback crossfades to the unfiltered native video. Freeze the
  // outgoing canvas for that fade, then leave decoding/display to the player.
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
  // living-video.js already prevents ambient playback for reduced motion, pauses
  // when that preference changes, and permits playback only after explicit Play.
  // This renderer never starts, seeks, unmutes or changes the rate of the media.
})();
