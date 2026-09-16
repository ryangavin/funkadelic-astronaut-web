/*
  What is on the disc, and the wire to it. A YouTube link plays through the
  embedded player and is worked over postMessage the way YouTube's own IFrame
  API does it, without loading that script: the frame is told we are listening,
  it reports state, time, volume and the title as they change, and commands go
  back the same way. A video file plays in a plain video element. The message
  shapes and the maths here are pure; the component applies them.
*/

export const YOUTUBE_ORIGIN = 'https://www.youtube-nocookie.com';
const CHANNEL = 'widget';

export type HandheldMode = 'off' | 'loading' | 'play' | 'pause' | 'end';

/** The player's state numbers, read as the transport sees them: buffering counts as playing. */
export function modeOf(state: number): HandheldMode {
  if (state === 1 || state === 3) return 'play';
  if (state === 0) return 'end';
  return 'pause';
}

/** The embedded player, wired for messages: privacy-enhanced, starting muted so it may autoplay, looping, no control bar. */
export function youTubeDisc(id: string, origin: string, { muted = true, loop = true } = {}) {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: muted ? '1' : '0',
    loop: loop ? '1' : '0',
    playlist: id,
    controls: '0',
    playsinline: '1',
    rel: '0',
    iv_load_policy: '3',
    enablejsapi: '1',
    origin,
  });
  return `${YOUTUBE_ORIGIN}/embed/${id}?${params}`;
}

/** Sent to the frame once it has loaded, so it starts reporting. */
export const listening = (id: string) => ({ event: 'listening', id, channel: CHANNEL });

/** A call on the player: playVideo, pauseVideo, seekTo, setVolume, mute, unMute, setLoop. */
export const command = (func: string, args: unknown[] = [], id = '') => ({ event: 'command', func, args, id, channel: CHANNEL });

export type PlayerInfo = {
  playerState?: number;
  currentTime?: number;
  duration?: number;
  volume?: number;
  muted?: boolean;
  videoData?: { title?: string };
};

export type PlayerMessage = { event: string; info?: PlayerInfo | number; id?: string };

/** A message from the frame, or nothing for anything else that arrives on the window. */
export function parseMessage(data: unknown): PlayerMessage | undefined {
  if (typeof data !== 'string') return undefined;
  try {
    const parsed: unknown = JSON.parse(data);
    if (!parsed || typeof parsed !== 'object' || typeof (parsed as PlayerMessage).event !== 'string') return undefined;
    return parsed as PlayerMessage;
  } catch {
    return undefined;
  }
}

/** The clock on the screen: minutes and seconds, with hours once there are any. */
export function clock(seconds: number | undefined): string {
  if (seconds === undefined || !Number.isFinite(seconds)) return '-:--';
  const whole = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const rest = whole % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`;
}

/** One press of a volume key. */
export const VOLUME_STEP = 0.1;

export const stepVolume = (volume: number, direction: 1 | -1) =>
  Math.min(1, Math.max(0, Math.round((volume + direction * VOLUME_STEP) * 10) / 10));

/** The screen's name for a video file: the file name, spaced. */
export function discTitle(src: string): string {
  const file = decodeURIComponent(src.split(/[?#]/)[0].split('/').pop() ?? '');
  const name = file.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim();
  return name || 'DISC';
}
