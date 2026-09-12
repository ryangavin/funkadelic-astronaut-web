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
    const silent = video.muted || video.volume === 0;
    mute.setAttribute('aria-label', silent ? 'Unmute' : 'Mute');
    mute.setAttribute('data-muted', String(silent));
    mute.setAttribute('aria-pressed', String(silent));
  }
  function playbackState() {
    pause.setAttribute('aria-label', video.ended ? 'Replay performance' : video.paused ? 'Play performance' : 'Pause performance');
    pause.setAttribute('data-paused', String(video.paused || video.ended));
  }
  pause.addEventListener('click', () => {
    if (video.paused || video.ended) start(false, video.ended);
    else { userPaused = true; video.pause(); }
  });
  seek.addEventListener('input', () => {
    if (!seek.disabled) video.currentTime = Math.min(video.duration, Math.max(0, Number(seek.value)));
    progress();
  });
  volume.addEventListener('input', () => { video.volume = Number(volume.value); video.muted = false; volumeState(); });
  mute.addEventListener('click', () => {
    if (video.muted || video.volume === 0) { video.muted = false; if (video.volume === 0) video.volume = 1; }
    else video.muted = true;
    volumeState();
  });
  for (const event of ['timeupdate', 'durationchange', 'loadedmetadata', 'seeked']) video.addEventListener(event, progress);
  video.addEventListener('volumechange', volumeState);
  video.addEventListener('playing', () => {
    scene.classList.remove('video-unavailable');
    playbackState();
    if (soundEnabled && !video.paused) { presentation(true); progress(); volumeState(); }
  });
  video.addEventListener('pause', () => {
    // Source attachment/startup may pause programmatically; stale pause events
    // must not cancel the user's pending request or a resumed seek.
    if (soundEnabled && !starting && video.paused) userPaused = true;
    playbackState();
  });
  video.addEventListener('ended', () => { userPaused = true; playbackState(); progress(); });
  video.addEventListener('error', () => failed('Performance unavailable. Try again or watch on the official site.'));
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const stream = 'https://video.squarespace-cdn.com/content/v1/699cdab6b1fb043597f25ba7/54ea9bd4-170c-4309-8ae2-44c6bab63092/playlist.m3u8';
  let loading, hls, cancelLoad, soundEnabled = false, userPaused = false, visible = false;
  video.muted = true;
  function failed(message) {
    reset();
    video.pause();
    dispose();
    scene.classList.add('video-unavailable');
    status.textContent = message;
    fallback.hidden = false;
  }
  function dispose() {
    // Fatal errors can arrive AFTER MANIFEST_PARSED resolved. Invalidate the
    // cached promise as well as the media source so the next click really retries.
    const previous = hls;
    hls = undefined;
    cancelLoad?.();
    cancelLoad = undefined;
    loading = undefined;
    previous?.destroy();
    video.removeAttribute('src');
    video.load();
  }
  function ready() {
    if (loading) return loading;
    const pending = new Promise((resolve, reject) => {
      let cleanup = () => {};
      cancelLoad = () => { cleanup(); reject(new Error('Stream detached')); };
      const attach = () => {
        if (window.Hls?.isSupported()) {
          const instance = hls = new window.Hls({ maxBufferLength: 20 });
          instance.on(window.Hls.Events.MANIFEST_PARSED, resolve);
          instance.on(window.Hls.Events.ERROR, (_, data) => {
            if (hls === instance && data.fatal) {
              reject(new Error('Stream unavailable'));
              failed('Performance unavailable. Try again or watch on the official site.');
            }
          });
          instance.loadSource(stream);
          instance.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          const loaded = () => { cleanup(); resolve(); };
          const error = () => { cleanup(); reject(new Error('Stream unavailable')); };
          cleanup = () => {
            video.removeEventListener('loadedmetadata', loaded);
            video.removeEventListener('error', error);
          };
          video.addEventListener('loadedmetadata', loaded);
          video.addEventListener('error', error);
          // The markup uses preload=none for the initial poster. Waiting for
          // metadata with that setting can deadlock native HLS before play().
          video.preload = 'metadata';
          video.src = stream;
          video.load();
        } else reject(new Error('Video unsupported'));
      };
      if (window.Hls) return attach();
      const script = document.createElement('script');
      script.src = 'assets/hls.min.js';
      script.onload = attach;
      script.onerror = () => {
        if (video.canPlayType('application/vnd.apple.mpegurl')) attach();
        else reject(new Error('Player unavailable'));
      };
      cleanup = () => { script.onload = script.onerror = null; script.remove(); };
      document.head.append(script);
    });
    loading = pending.catch(error => {
      if (loading === result) dispose();
      throw error;
    });
    const result = loading;
    return result;
  }
  async function start(ambient = false, restart = true) {
    if (ambient && (motion.matches || userPaused || soundEnabled || starting || !visible || document.hidden)) return;
    const attempt = ++request;
    if (!ambient) {
      starting = true;
      status.textContent = 'Loading performance…';
    }
    try {
      await ready();
      if (attempt !== request || (ambient && (motion.matches || userPaused || soundEnabled || !visible || document.hidden))) return;
      if (!ambient) {
        soundEnabled = true;
        userPaused = false;
        if (restart) { video.currentTime = 0; video.muted = false; }
      }
      video.loop = ambient;
      await video.play();
      if (attempt !== request) return;
      starting = false;
      if (!video.paused && !ambient) {
        presentation(true);
        progress();
        volumeState();
        playbackState();
        if (restart) pause.focus();
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
  function visibility() {
    if (visible && !document.hidden) {
      if (!motion.matches && !userPaused && !soundEnabled) start(true);
    } else if (!soundEnabled && !starting) { request++; video.pause(); }
  }
  document.addEventListener('visibilitychange', visibility);
  const observer = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    visibility();
  }, { rootMargin: '100px' });
  observer.observe(scene);
})();
