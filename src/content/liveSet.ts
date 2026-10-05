import liveLoop from '../../assets/epk/live-loop.mp4';
import livePoster from '../../assets/epk/live-poster.webp';
import nyackSet from '../../assets/epk/nyack-set.mp4';

/**
 * The live set the press kit leads with: "Millenial Timemachine" at Nyack
 * Neighborhood Porchfest 2026 (31 July), from the band's own footage, served
 * from the site. `video` is the whole clip (assets/epk/nyack-set.mp4, the
 * original repackaged as MP4); `loop` is a silent cut of 0:26 to 0:44, where
 * the band fills the frame, and `poster` a frame from it. The desk keeps its
 * own live set (LIVE_SET in the experience's bandMembers.tsx).
 */
export const NYACK_SET = {
  video: nyackSet,
  loop: liveLoop,
  poster: livePoster,
  song: 'Millenial Timemachine',
  event: 'Nyack Neighborhood Porchfest 2026',
};
