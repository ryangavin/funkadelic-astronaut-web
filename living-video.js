/* One inline performance: muted preview, then restart with sound on request. */
(() => {
  const video = document.querySelector('#performance');
  if (!video) return;
  const scene = document.querySelector('#listen');
  const play = document.querySelector('#play-video');
  const status = document.querySelector('#video-status');
  const fallback = document.querySelector('.video-fallback');
  const controls = document.querySelector('#playback-controls');
  const pause = document.querySelector('#pause-video');
  const seek = document.querySelector('#video-seek');
  const volume = document.querySelector('#video-volume');
  const mute = document.querySelector('#mute-video');
  const time = document.querySelector('#video-time');
  let starting = false, request = 0;
  function presentation(active) {
    play.hidden = active;
    controls.hidden = !active;
    scene.classList.toggle('sound-enabled', active);
  }
  function reset() {
    request++;
    starting = false;
    soundEnabled = false;
    userPaused = true;
    presentation(false);
    if (controls.contains(document.activeElement)) play.focus();
  }
  const stamp = seconds => {
    const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
  };
  function progress() {
    const duration = video.duration;
    seek.disabled = !Number.isFinite(duration) || duration <= 0;
    seek.max = seek.disabled ? 0 : duration;
    seek.value = video.currentTime;
    seek.setAttribute('aria-valuetext', `${stamp(video.currentTime)} of ${stamp(duration)}`);
    time.textContent = `${stamp(video.currentTime)} / ${stamp(duration)}`;
  }
  function volumeState() {
    volume.value = video.volume;
    mute.textContent = video.muted ? 'Unmute' : 'Mute';
    mute.setAttribute('aria-pressed', String(video.muted));
  }
  pause.addEventListener('click', () => { reset(); video.pause(); });
  seek.addEventListener('input', () => {
    if (!seek.disabled) video.currentTime = Math.min(video.duration, Math.max(0, Number(seek.value)));
    progress();
  });
  volume.addEventListener('input', () => { video.volume = Number(volume.value); video.muted = false; volumeState(); });
  mute.addEventListener('click', () => { video.muted = !video.muted; volumeState(); });
  for (const event of ['timeupdate', 'durationchange', 'loadedmetadata', 'seeked']) video.addEventListener(event, progress);
  video.addEventListener('volumechange', volumeState);
  video.addEventListener('playing', () => {
    if (soundEnabled && !video.paused) { presentation(true); progress(); volumeState(); }
  });
  video.addEventListener('pause', () => {
    // Source attachment/startup may pause programmatically; stale pause events
    // must not cancel the user's pending request or a resumed seek.
    if (soundEnabled && !starting && video.paused) reset();
  });
  video.addEventListener('ended', reset);
  video.addEventListener('error', () => failed('Performance unavailable. Try again or watch on the official site.'));
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const stream = 'https://video.squarespace-cdn.com/content/v1/699cdab6b1fb043597f25ba7/54ea9bd4-170c-4309-8ae2-44c6bab63092/playlist.m3u8';
  let loading, hls, soundEnabled = false, userPaused = false;
  video.muted = true;
  function failed(message) {
    reset();
    video.pause();
    status.textContent = message;
    fallback.hidden = false;
  }
  function ready() {
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const attach = () => {
        if (window.Hls?.isSupported()) {
          hls = new window.Hls({ maxBufferLength: 20 });
          hls.on(window.Hls.Events.MANIFEST_PARSED, resolve);
          hls.on(window.Hls.Events.ERROR, (_, data) => {
            if (data.fatal) { reject(new Error('Stream unavailable')); failed('Performance unavailable. Watch on the official site.'); }
          });
          hls.loadSource(stream);
          hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = stream;
          video.addEventListener('loadedmetadata', resolve, { once: true });
          video.addEventListener('error', reject, { once: true });
        } else reject(new Error('Video unsupported'));
      };
      if (window.Hls) return attach();
      const script = document.createElement('script');
      script.src = 'assets/hls.min.js';
      script.onload = attach;
      script.onerror = reject;
      document.head.append(script);
    });
    loading = loading.catch(error => {
      hls?.destroy();
      hls = undefined;
      loading = undefined;
      throw error;
    });
    return loading;
  }
  async function start(ambient = false) {
    if (ambient && (motion.matches || userPaused || soundEnabled || starting)) return;
    const attempt = ++request;
    if (!ambient) {
      starting = true;
      status.textContent = 'Loading performance…';
    }
    try {
      await ready();
      if (attempt !== request || (ambient && (motion.matches || userPaused || soundEnabled))) return;
      if (!ambient) {
        soundEnabled = true;
        userPaused = false;
        video.currentTime = 0;
        video.muted = false;
      }
      video.loop = ambient;
      await video.play();
      if (attempt !== request) return;
      starting = false;
      if (!video.paused && !ambient) {
        presentation(true);
        progress();
        volumeState();
        pause.focus();
      }
      status.textContent = '';
      fallback.hidden = true;
    } catch {
      if (attempt !== request) return;
      starting = false;
      if (ambient) status.textContent = 'Press play to watch.';
      else failed('Playback unavailable. Try again or watch on the official site.');
    }
  }
  play.addEventListener('click', () => start());
  motion.addEventListener('change', () => {
    if (motion.matches) { reset(); video.pause(); }
  });
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      if (!motion.matches && !userPaused && !soundEnabled) start(true);
    } else if (!soundEnabled && !starting) video.pause();
  }, { rootMargin: '100px' });
  observer.observe(scene);
})();
