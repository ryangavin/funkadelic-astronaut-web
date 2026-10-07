import React, { type CSSProperties, type ReactNode } from 'react';
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/fonts';
import nyackSet from '../../assets/epk/nyack-set.mp4';
import bowlbyOne from '../../assets/fonts/bowlby-one/BowlbyOne-latin.woff2';
import archivo from '../../assets/fonts/archivo/Archivo-latin.woff2';
import { END_SHOT, INTRO_SHOT, SHOTS, type Move, type Shot } from './shots';
import { BEAT, CLIP_BARS, FPS, INTRO_BARS, SONG_AT, TOTAL_FRAMES, barFrame, secondsFrame } from './timing';

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
const SHADOW =(u: number) => `0 ${0.5 * u}px ${2 * u}px rgb(0 0 0 / 0.75)`;

/** Size in hundredths of the frame's short side, so both cuts share one layout. */
const useUnit = () => {
  const { width, height } = useVideoConfig();
  return { u: Math.min(width, height) / 100, vertical: height > width };
};

const beatFrame = (n: number) => Math.round(n * BEAT * FPS);

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
      style={{ background: STOCK, opacity: interpolate(frame, [0, frames], [0.7, 0], { extrapolateRight: 'clamp' }) }}
    />
  );
};

/**
 * The Ken Burns move, from the shot's first frame to its last: scale, and the
 * point the frame is scaled about, as a percentage across and down.
 */
const MOVES: Record<Move, { scale: [number, number]; x: [number, number] }> = {
  in: { scale: [1.05, 1.22], x: [50, 50] },
  out: { scale: [1.22, 1.05], x: [50, 50] },
  left: { scale: [1.18, 1.18], x: [80, 20] },
  right: { scale: [1.18, 1.18], x: [20, 80] },
};

const ShotClip = ({ shot, look }: { shot: Shot; look?: CSSProperties['filter'] }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { vertical } = useUnit();
  const move = MOVES[shot.move];
  const t = [0, durationInFrames];
  const scale = interpolate(frame, t, move.scale);
  // The vertical cut is already cropped tight on `focus`; it pans less, about that point.
  const across = interpolate(frame, t, move.x);
  const x = vertical ? shot.focus + (across - 50) * 0.4 : across;
  const y = shot.focusY ?? 45;
  return (
    <AbsoluteFill style={{ background: 'black', overflow: 'hidden' }}>
      <OffthreadVideo
        src={shot.clip === 'nyack' ? nyackSet : staticFile(`media/${shot.clip}.mp4`)}
        trimBefore={secondsFrame(shot.from)}
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: `${shot.focus}% 50%`,
          transformOrigin: `${x}% ${y}%`,
          transform: `scale(${scale})`,
          filter:
            look ??
            (shot.look === 'lift' ? 'brightness(1.45) contrast(1.15) saturate(1.1)' : 'contrast(1.1) saturate(1.15)'),
        }}
      />
    </AbsoluteFill>
  );
};

/** Darkened edges, so the type reads over any room. */
const Vignette = ({ strength = 0.75 }: { strength?: number }) => (
  <AbsoluteFill
    style={{ background: `radial-gradient(ellipse at center, transparent 40%, rgb(10 6 30 / ${strength}) 100%)` }}
  />
);

/** Two bars over a packed room: the crowd alone for the first, then the name lands on beats 1 and 3 of the second. */
const Intro = () => {
  const { u, vertical } = useUnit();
  const size = (vertical ? 10.5 : 11) * u;
  const name = barFrame(1);
  return (
    <AbsoluteFill>
      <ShotClip shot={INTRO_SHOT} />
      <AbsoluteFill style={{ background: 'rgb(28 22 64 / 0.15)' }} />
      <Vignette />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <Slam at={name} style={{ ...DISPLAY, fontSize: size, textShadow: SHADOW(u) }}>Funkadelic</Slam>
        <Slam at={name + beatFrame(2)} style={{ ...DISPLAY, fontSize: size, color: LIME, textShadow: SHADOW(u) }}>
          Astronaut
        </Slam>
      </AbsoluteFill>
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
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', background: 'rgb(28 22 64 / 0.3)' }}>
      <Slam
        at={0}
        style={{ ...LABEL, fontSize: (vertical ? 22 : 24) * u, lineHeight: 0.85, textAlign: 'center', textShadow: SHADOW(u) }}
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
      {titles.map(({ title, start, end }) => (
        <Sequence key={`${title}-${start}`} {...clipSpan(start, end)}>
          <Title title={title} />
        </Sequence>
      ))}
      <Flash />
    </AbsoluteFill>
  );
};

/** The genre, the name and the site, over the crowd, softened. Fades to night on the last bar. */
const EndCard = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { u, vertical } = useUnit();
  const fade = interpolate(frame, [durationInFrames - barFrame(1), durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ background: NIGHT }}>
      <AbsoluteFill style={{ opacity: fade }}>
        <ShotClip shot={END_SHOT} look="blur(10px) brightness(0.55) saturate(1.2)" />
        <AbsoluteFill style={{ background: 'rgb(28 22 64 / 0.55)' }} />
        <AbsoluteFill
          style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 2.4 * u, padding: 6 * u }}
        >
          <Slam at={0} style={{ ...LABEL, fontSize: 6 * u, color: PINK, letterSpacing: '0.04em' }}>
            Future rock
          </Slam>
          <Slam at={beatFrame(2)} style={{ ...DISPLAY, fontSize: (vertical ? 10.5 : 11) * u }}>
            Funkadelic
            <br />
            <span style={{ color: LIME }}>Astronaut</span>
          </Slam>
          <Slam at={beatFrame(4)} style={{ ...LABEL, fontSize: 5.4 * u, textTransform: 'none', fontStretch: '75%' }}>
            funkadelicastronaut.com
          </Slam>
        </AbsoluteFill>
      </AbsoluteFill>
      <Flash />
    </AbsoluteFill>
  );
};

/** The song from the bar before its loudest stretch, fading out over the last bar. */
const Music = () => (
  <Audio
    src={staticFile('media/song.mp3')}
    trimBefore={secondsFrame(SONG_AT)}
    volume={(f) =>
      interpolate(f, [TOTAL_FRAMES - barFrame(1), TOTAL_FRAMES], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    }
  />
);

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
