import React, { type CSSProperties, type ReactNode } from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/fonts';
import { FEATURED_RELEASE } from '../../src/content/releases';
import astronaut from '../../assets/astronaut-transparent.png';
import starMap from '../../assets/epk/star-map.webp';
import bowlbyOne from '../../assets/fonts/bowlby-one/BowlbyOne-latin.woff2';
import archivo from '../../assets/fonts/archivo/Archivo-latin.woff2';
import { SHOTS, type Shot } from './shots';
import {
  BEAT,
  CLIP_BARS,
  END_BARS,
  FPS,
  INTRO_BARS,
  SONG_INTRO_AT,
  SONG_LOOP_AT,
  barFrame,
  secondsFrame,
} from './timing';

loadFont({ family: 'Bowlby One', url: bowlbyOne });
loadFont({ family: 'Archivo', url: archivo, weight: '100 900', stretch: '62% 125%' });

/** The press kit's inks (src/site/styles/tokens.css). */
const NIGHT = '#1c1640';
const STOCK = '#ece1c6';
const PINK = '#ec9ba5';
const LIME = '#9ccf3c';
const ORANGE = '#ef8a3c';

const DISPLAY: CSSProperties = { fontFamily: "'Bowlby One'", lineHeight: 0.9, color: STOCK, textTransform: 'uppercase' };
const LABEL: CSSProperties = { fontFamily: 'Archivo', fontWeight: 900, fontStretch: '62%', textTransform: 'uppercase', color: STOCK };

/** Size in hundredths of the frame's short side, so both cuts share one layout. */
const useUnit = () => {
  const { width, height } = useVideoConfig();
  return { u: Math.min(width, height) / 100, vertical: height > width };
};

/** 1 on a beat, decaying to 0 before the next: the kick every shot breathes with. */
const beatPulse = (frame: number) => {
  const phase = (frame / FPS / BEAT) % 1;
  return Math.exp(-phase * 7);
};

/** A word that lands on its frame with a spring, from a little too big. */
const Slam = ({ at, children, style }: { at: number; children: ReactNode; style?: CSSProperties }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hit = spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 220 } });
  return (
    <div
      style={{
        ...style,
        opacity: frame < at ? 0 : 1,
        transform: `scale(${interpolate(hit, [0, 1], [1.6, 1])})`,
        filter: `blur(${interpolate(hit, [0, 1], [8, 0], { extrapolateRight: 'clamp' })}px)`,
      }}
    >
      {children}
    </div>
  );
};

const Flash = ({ frames = 5 }: { frames?: number }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{ background: STOCK, opacity: interpolate(frame, [0, frames], [0.85, 0], { extrapolateRight: 'clamp' }) }}
    />
  );
};

const Stars = ({ opacity }: { opacity: number }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: NIGHT }}>
      <Img
        src={starMap}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity,
          // The map is ink on paper; inverted and screened it is pale ink on the night.
          filter: 'invert(1) hue-rotate(180deg)',
          mixBlendMode: 'screen',
          transform: `scale(${1.1 + frame * 0.0008}) rotate(${frame * 0.02}deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Two bars of build-up: the astronaut drifts in, then the name lands on beats 5 and 7. */
const Intro = () => {
  const frame = useCurrentFrame();
  const { u, vertical } = useUnit();
  const beat = (n: number) => Math.round(n * BEAT * FPS);
  const drift = interpolate(frame, [0, beat(4)], [30, 0], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill>
      <Stars opacity={0.45} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 * u }}>
        <Img
          src={astronaut}
          style={{
            height: (vertical ? 38 : 34) * u,
            opacity: interpolate(frame, [0, beat(2)], [0, 1], { extrapolateRight: 'clamp' }),
            transform: `translateY(${drift * u}px) rotate(${-8 + frame * 0.06}deg)`,
          }}
        />
        <div style={{ textAlign: 'center' }}>
          <Slam at={beat(4)} style={{ ...DISPLAY, fontSize: (vertical ? 10.5 : 11) * u }}>Funkadelic</Slam>
          <Slam at={beat(6)} style={{ ...DISPLAY, fontSize: (vertical ? 10.5 : 11) * u, color: LIME }}>Astronaut</Slam>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ShotClip = ({ shot }: { shot: Shot }) => {
  const frame = useCurrentFrame();
  const kick = beatPulse(frame);
  return (
    <AbsoluteFill style={{ background: 'black' }}>
      <OffthreadVideo
        src={staticFile(`media/${shot.clip}.mp4`)}
        trimBefore={secondsFrame(shot.from)}
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: `${shot.focus}% 50%`,
          transform: `scale(${1.04 + 0.03 * kick})`,
          filter:
            shot.look === 'daylight'
              ? `contrast(1.35) saturate(1.4) brightness(${0.9 + 0.08 * kick})`
              : `contrast(1.1) saturate(1.15) brightness(${1 + 0.08 * kick})`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Darkened edges, so the type reads over any room. */
const Vignette = () => (
  <AbsoluteFill
    style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgb(10 6 30 / 0.75) 100%)' }}
  />
);

/** The band's name, small, in the corner of every live shot; at the top of the vertical cut, clear of Reels' captions. */
const Bug = () => {
  const { u, vertical } = useUnit();
  return (
    <AbsoluteFill style={{ justifyContent: vertical ? 'flex-start' : 'flex-end', padding: (vertical ? 8 : 4) * u }}>
      <div style={{ ...DISPLAY, fontSize: 3.6 * u, textShadow: `0 0 ${u}px rgb(0 0 0 / 0.8)` }}>
        Funkadelic <span style={{ color: LIME }}>Astronaut</span>
      </div>
    </AbsoluteFill>
  );
};

const TITLES: Record<NonNullable<Shot['title']>, ReactNode> = {
  genre: (
    <>
      Future <span style={{ color: PINK }}>rock</span>
    </>
  ),
  place: (
    <>
      From <span style={{ color: ORANGE }}>New Jersey</span>
    </>
  ),
};

const Title = ({ title }: { title: NonNullable<Shot['title']> }) => {
  const { u, vertical } = useUnit();
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', background: 'rgb(28 22 64 / 0.35)' }}>
      <Slam
        at={0}
        style={{
          ...LABEL,
          fontSize: (vertical ? 22 : 24) * u,
          lineHeight: 0.85,
          textAlign: 'center',
          textShadow: `0 ${0.6 * u}px ${2 * u}px rgb(0 0 0 / 0.7)`,
        }}
      >
        {TITLES[title]}
      </Slam>
    </AbsoluteFill>
  );
};

/** Where each shot, and each run of shots sharing a title, starts and ends in bars. */
const timeline = () => {
  let at = 0;
  const shots = SHOTS.map((shot) => {
    const start = at;
    at += shot.bars;
    return { shot, start, end: at };
  });
  const titles: { title: NonNullable<Shot['title']>; start: number; end: number }[] = [];
  for (const { shot, start, end } of shots) {
    if (!shot.title) continue;
    const last = titles[titles.length - 1];
    if (last && last.title === shot.title && last.end === start) last.end = end;
    else titles.push({ title: shot.title, start, end });
  }
  return { shots, titles, bars: at };
};

/** A span of the clip section, in frames from its start, rounded from the trailer's own bars so no cut drifts. */
const clipSpan = (start: number, end: number) => {
  const from = barFrame(INTRO_BARS + start) - barFrame(INTRO_BARS);
  return { from, durationInFrames: barFrame(INTRO_BARS + end) - barFrame(INTRO_BARS) - from };
};

const Clips = () => {
  const { shots, titles } = timeline();
  return (
    <AbsoluteFill>
      {shots.map(({ shot, start, end }, i) => (
        <Sequence key={i} {...clipSpan(start, end)}>
          <ShotClip shot={shot} />
        </Sequence>
      ))}
      <Vignette />
      <Bug />
      {titles.map(({ title, start, end }) => (
        <Sequence key={`${title}-${start}`} {...clipSpan(start, end)}>
          <Title title={title} />
        </Sequence>
      ))}
      <Flash />
    </AbsoluteFill>
  );
};

/** Four bars: the record, and where to get it. Fades to night on the last bar. */
const EndCard = () => {
  const frame = useCurrentFrame();
  const { u, vertical } = useUnit();
  const bar = barFrame(1);
  const host = new URL(FEATURED_RELEASE.href).host;
  const fade = interpolate(frame, [barFrame(END_BARS) - bar, barFrame(END_BARS)], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Stars opacity={0.35} />
      <AbsoluteFill
        style={{
          flexDirection: vertical ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: (vertical ? 4 : 6) * u,
          padding: 6 * u,
        }}
      >
        <Img
          src={astronaut}
          style={{
            height: (vertical ? 34 : 52) * u,
            transform: `translateY(${Math.sin(frame / 18) * u}px) rotate(${6 - frame * 0.04}deg)`,
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2.4 * u, alignItems: vertical ? 'center' : 'flex-start', textAlign: vertical ? 'center' : 'left' }}>
          <Slam at={0} style={{ ...LABEL, fontSize: 5 * u, color: PINK, letterSpacing: '0.04em' }}>
            The new record · out now
          </Slam>
          <Slam at={Math.round(2 * BEAT * FPS)} style={{ ...DISPLAY, fontSize: (vertical ? 11 : 10) * u, maxWidth: (vertical ? 90 : 100) * u }}>
            {FEATURED_RELEASE.title}
          </Slam>
          <Slam at={bar} style={{ ...LABEL, fontSize: 5.4 * u, color: LIME, textTransform: 'none', fontStretch: '75%' }}>
            {host}
          </Slam>
        </div>
      </AbsoluteFill>
      <Flash />
    </AbsoluteFill>
  );
};

/**
 * The song: the intro's build-up runs straight into the 16-bar loop, which
 * comes back round from the top under the end card and fades with it.
 */
const Music = () => {
  const endAt = barFrame(INTRO_BARS + CLIP_BARS);
  const bar = barFrame(1);
  return (
    <>
      <Sequence durationInFrames={endAt}>
        <Audio src={staticFile('media/song.mp3')} trimBefore={secondsFrame(SONG_INTRO_AT)} />
      </Sequence>
      <Sequence from={endAt} durationInFrames={barFrame(END_BARS)}>
        <Audio
          src={staticFile('media/song.mp3')}
          trimBefore={secondsFrame(SONG_LOOP_AT)}
          volume={(f) =>
            interpolate(f, [barFrame(END_BARS) - bar, barFrame(END_BARS)], [1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          }
        />
      </Sequence>
    </>
  );
};

export const Teaser = () => {
  const { bars } = timeline();
  if (bars !== CLIP_BARS) throw new Error(`The shots fill ${bars} bars; the clip section is ${CLIP_BARS}.`);
  const clipsAt = barFrame(INTRO_BARS);
  const endAt = barFrame(INTRO_BARS + CLIP_BARS);
  return (
    <AbsoluteFill style={{ background: NIGHT }}>
      <Sequence durationInFrames={clipsAt}>
        <Intro />
      </Sequence>
      <Sequence from={clipsAt} durationInFrames={endAt - clipsAt}>
        <Clips />
      </Sequence>
      <Sequence from={endAt}>
        <EndCard />
      </Sequence>
      <Music />
    </AbsoluteFill>
  );
};
