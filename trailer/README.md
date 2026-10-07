# Teaser trailer

A 30-second teaser that shows the band off to bookers, made with [Remotion](https://www.remotion.dev/). It cuts crowd footage from Nyack Neighborhood Porchfest 2026 with club and studio footage from the band's YouTube, on the beat of "Time to Save the Universe" (from Bandcamp), and ends on how to book them. It comes in two frames:

- `Teaser`: 1920×1080, for YouTube, the site and booking emails.
- `TeaserVertical`: 1080×1920, for Reels and Shorts. Each shot is cropped to keep the band or the crowd in frame, and the name sits at the top, clear of the app's captions.

It is its own npm project, outside the site's build, tests and CI. It takes the Nyack footage and the fonts from `../assets`, and uses the press kit's inks. The booking address is copied from `src/content/links.ts` (see the note in `src/Teaser.tsx`).

## How it's cut

The song is played to a 110 BPM click, so everything is timed in bars (`src/timing.ts`):

| Trailer | What | Song |
| --- | --- | --- |
| Bar 1 | Intro: the porchfest crowd from the street, the name landing on beats 1 and 3 | From 2:03.7, the bar before its loudest stretch |
| Bars 2–11 | The clips (`src/shots.ts`): ten one-bar shots, four of them the Nyack crowd, with "Future rock" and "From New Jersey" over four of them | Straight on |
| The last 6 s | End card over the softened crowd: "Book the band", the booking email and funkadelicastronaut.com; fades on the last bar | Fading out |

Every shot has a slow Ken Burns move (push in, pull out, or pan left or right), set per shot. To recut it, edit `SHOTS`; the composition throws if the shots don't add up to 10 bars.

## Media

The Nyack footage is committed (`assets/epk/nyack-set.mp4`). The other footage and the song aren't. Fetch them into `public/media/` with yt-dlp (from Homebrew):

```sh
cd trailer/public/media
yt-dlp -x --audio-format mp3 -o "song.%(ext)s" https://funkadelicastronaut.bandcamp.com/track/time-to-save-the-universe-2
```

Each clip is an 8-second section, `yt-dlp -f "bv*[height<=1080][ext=mp4]/bv*[height<=1080]" --remux-video mp4 --force-keyframes-at-cuts --download-sections "*<start>-<start+8>" -o "<name>.%(ext)s" https://www.youtube.com/watch?v=<id>`:

| Name | Video | Start (seconds) |
| --- | --- | --- |
| `olives-1`, `olives-3`, `olives-5` | Millenial Timemachine, 2026-07-31 (`QlC7tOQjGkM`) | 338, 2704, 4732 |
| `lenoras-1`, `lenoras-4` | Lenora's Bar and Grill, 2026-04-24 (`ekYHu2QAWNw`) | 222, 1480 |
| `prelude-1` | Prelude ➤ Universal Eyes, live in the studio (`aAr3TOye4XU`) | 60 |

Bandcamp streams at 128 kbps. For a final cut, swap `song.mp3` for an MP3 from the master at the same length; the timings stay the same.

## Run it

```sh
cd trailer
npm install
npm run studio
```

`npm run studio` opens Remotion Studio to scrub and preview. `npm run render` writes `out/teaser.mp4` and `out/teaser-vertical.mp4` (H.264, CRF 18). `npm run typecheck` checks the types.

Remotion is free for individuals and companies of up to three people; past that it needs a [company licence](https://www.remotion.dev/license).
