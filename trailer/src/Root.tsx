import React from 'react';
import { Composition } from 'remotion';
import { Teaser } from './Teaser';
import { FPS, TOTAL_BARS, barFrame } from './timing';

/** One cut, two frames: 16:9 for YouTube and the site, 9:16 for Reels and Shorts. */
export const Root = () => (
  <>
    <Composition id="Teaser" component={Teaser} durationInFrames={barFrame(TOTAL_BARS)} fps={FPS} width={1920} height={1080} />
    <Composition id="TeaserVertical" component={Teaser} durationInFrames={barFrame(TOTAL_BARS)} fps={FPS} width={1080} height={1920} />
  </>
);
