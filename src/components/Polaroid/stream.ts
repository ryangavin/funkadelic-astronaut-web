/*
  Playing an HLS stream in a <video>. Safari plays playlists natively; everywhere
  else the site's bundled HLS.js does it, loaded once, on demand, from assets.
*/
import hlsScript from '../../../assets/hls.min.js?url';

type HlsInstance = {
  loadSource(url: string): void;
  attachMedia(video: HTMLVideoElement): void;
  on(event: string, handler: (event: string, data: { fatal?: boolean }) => void): void;
  destroy(): void;
};
type HlsStatic = {
  isSupported(): boolean;
  Events: { MANIFEST_PARSED: string; ERROR: string };
  new (config?: { maxBufferLength?: number }): HlsInstance;
};
declare global {
  interface Window {
    Hls?: HlsStatic;
  }
}

let loading: Promise<HlsStatic | undefined> | undefined;

export const isStream = (url: string) => /\.m3u8(\?|#|$)/i.test(url);

export const playsStreamsNatively = (video: HTMLVideoElement) => video.canPlayType('application/vnd.apple.mpegurl') !== '';

/** Loads HLS.js once, resolving to its constructor, or to nothing if it cannot load. */
export function loadHls(doc: Document = document): Promise<HlsStatic | undefined> {
  const win = doc.defaultView as (Window & typeof globalThis) | null;
  if (win?.Hls) return Promise.resolve(win.Hls);
  loading ??= new Promise((resolve) => {
    const script = doc.createElement('script');
    script.src = hlsScript;
    script.async = true;
    script.onload = () => resolve(win?.Hls);
    script.onerror = () => {
      loading = undefined;
      resolve(undefined);
    };
    doc.head.append(script);
  });
  return loading;
}

/**
 * Attach a stream (or a plain clip) to a video element and start it. Returns a
 * detach that also tears down the player. `onReady` fires once media can play.
 * Streams go through HLS.js wherever it is supported, as on the page: browsers
 * that merely claim native HLS support ("maybe") often cannot play it.
 */
export function attachSource(video: HTMLVideoElement, url: string, onReady?: () => void) {
  const direct = () => {
    video.src = url;
    video.load();
    onReady?.();
  };
  const clear = () => {
    video.removeAttribute('src');
    video.load();
  };
  if (!isStream(url)) {
    direct();
    return clear;
  }
  let player: HlsInstance | undefined;
  let detached = false;
  loadHls(video.ownerDocument).then((Hls) => {
    if (detached) return;
    if (Hls?.isSupported()) {
      player = new Hls({ maxBufferLength: 20 });
      player.on(Hls.Events.MANIFEST_PARSED, () => onReady?.());
      player.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) player?.destroy();
      });
      player.loadSource(url);
      player.attachMedia(video);
    } else if (playsStreamsNatively(video)) {
      direct();
    }
  });
  return () => {
    detached = true;
    player?.destroy();
    player = undefined;
    clear();
  };
}
