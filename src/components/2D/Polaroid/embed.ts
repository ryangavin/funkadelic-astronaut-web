/*
  A YouTube link in a Polaroid window. The print takes the ordinary watch link
  (or a short, embed or shorts link) and plays it through the privacy-enhanced
  player with its minimal chrome, starting muted and looping as a preview: a click
  on the picture plays or pauses, hovering shows only the title bar with the link
  to YouTube, and the keyboard shortcuts (space, M, F, the arrows) still work.
*/
const YOUTUBE =
  /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})(?:[?&#/]|$)/i;

/** The eleven-character id from any YouTube link, or nothing for any other URL. */
export const youTubeId = (url: string) => YOUTUBE.exec(url)?.[1];

/** The player as a preview: privacy-enhanced, starting muted, looping, no control bar, related videos kept to the channel. */
export const youTubePreview = (id: string) => {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    playlist: id,
    controls: '0',
    playsinline: '1',
    rel: '0',
    iv_load_policy: '3',
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
};
