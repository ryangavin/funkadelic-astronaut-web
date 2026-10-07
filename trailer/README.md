# Teaser trailer

A 48-second teaser for the band, made with [Remotion](https://www.remotion.dev/): live and studio footage from the band's YouTube, cut on the beat of "Time to Save the Universe" (from the album of the same name, on Bandcamp), in two frames:

- `Teaser`: 1920×1080, for YouTube and the site.
- `TeaserVertical`: 1080×1920, for Reels and Shorts. Each shot is cropped to keep the bassist in frame, and the name sits at the top, clear of the app's captions.

It is its own npm project, outside the site's build, tests and CI. It takes band data from `../src/content` and the fonts, astronaut and star map from `../assets`, so the trailer stays in step with the press kit.

## How it's cut

The song is played to a 110 BPM click, so everything is timed in bars (`src/timing.ts`):

| Trailer bars | What | Song |
| --- | --- | --- |
| 1–2 | Intro: the astronaut drifts in, the name lands on beats 5 and 7 | 2:01.5, the build-up |
| 3–18 | The clips (`src/shots.ts`): eight one-bar shots, four under the titles "Future rock" and "From New Jersey", then eight half-bar shots | 2:05.9 to 2:40.8, the loudest 16 bars |
| 19–22 | End card: the record, out now, and the Bandcamp address; fades on the last bar | The same 16 bars from the top, fading out |

Every shot pulses on the beat. To recut it, edit `SHOTS`; the composition throws if the shots don't add up to 16 bars.

## Media

The footage and the song aren't committed. Fetch them into `public/media/` with yt-dlp and ffmpeg (both from Homebrew):

```sh
cd trailer/public/media
yt-dlp -x --audio-format mp3 -o "song.%(ext)s" https://funkadelicastronaut.bandcamp.com/track/time-to-save-the-universe-2
```

Each clip is an 8-second section, `yt-dlp -f "bv*[height<=1080][ext=mp4]/bv*[height<=1080]" --remux-video mp4 --force-keyframes-at-cuts --download-sections "*<start>-<start+8>" -o "<name>.%(ext)s" https://www.youtube.com/watch?v=<id>`:

| Names | Video | Starts (seconds) |
| --- | --- | --- |
| `olives-1` to `olives-5` | Millenial Timemachine, 2026-07-31 (`QlC7tOQjGkM`) | 338, 1521, 2704, 3549, 4732 |
| `wildair-1`, `wildair-3` | Wild Air Beerworks, 2026-06-28 (`N-sebD6b1jg`) | 70, 910 |
| `lenoras-1` to `lenoras-5` | Lenora's Bar and Grill, 2026-04-24 (`ekYHu2QAWNw`) | 222, 592, 1110, 1480, 2738 |
| `howl-1`, `howl-2` | Howl to the Moon, live in the studio (`qMXotFgqFMI`) | 30, 200 |
| `prelude-1`, `prelude-2` | Prelude ➤ Universal Eyes, live in the studio (`aAr3TOye4XU`) | 60, 500 |

Bandcamp streams at 128 kbps. For a final cut, swap `song.mp3` for an MP3 from the master at the same length; the timings stay the same.

## Run it

```sh
cd trailer
npm install
npm run studio
```

`npm run studio` opens Remotion Studio to scrub and preview. `npm run render` writes `out/teaser.mp4` and `out/teaser-vertical.mp4` (H.264, CRF 18). `npm run typecheck` checks the types.

Remotion is free for individuals and companies of up to three people; past that it needs a [company licence](https://www.remotion.dev/license).
