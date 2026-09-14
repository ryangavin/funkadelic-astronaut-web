# Ambient artwork and original performance

The landing scene and explicit player now share the single `#performance` media element and the original 522-second Squarespace HLS stream. When the Listen scene enters the observer margin, `living-video.js` attaches that stream with native HLS where supported or the bundled HLS.js fallback, then autoplays muted and looped when browser policy permits. This means the playback library and network video may load before an explicit Play click, but only one video/media pipeline is active.

`performance-print.js` copies muted frames from that element at 100ms intervals (10fps), preserving the full decoded source dimensions on desktop and mobile. Typography/astronaut registration remains 150ms and native media playback speed remains 1. Explicit Play reuses the canonical HLS attachment (or replaces a studio-selected local source), seeks the element to zero, disables looping, unmutes it, and crossfades the held canvas frame away over 650ms. Ambient position therefore never leaks into the deliberate playback experience. Pause, seek and replay stay on the original unfiltered path. Reduced motion prevents ambient autoplay and holds the poster/frame; offscreen, hidden and pagehide states suspend ambient playback/canvas work. Canvas failure falls back to the filtered native element.

The ambient canvas and its native-video fallback both use the same restrained black-and-white SVG filter. Saturation is fixed at zero; a linear levels pass applies contrast `1.08`, brightness `1`, black point `.025`, and white point `.975`, with the existing paper grain at `.32` opacity. There is no colored tint, palette mapping, posterization, contour extraction, blur, `getImageData`, JavaScript pixel loop, WebGL texture upload, dependency, or spatial downsampling. Explicit playback does not inherit the monochrome filter or grain adjustment.

## Layout studio

Choose **Ambient video treatment**. **Original full performance · 8:42** is the baked source default. The intentionally small control set is source, displayed fps, contrast, brightness, shadow threshold, highlight threshold and paper grain strength. Monochrome conversion is fixed so studio drafts cannot accidentally turn the ambient preview into a colored grade. Live tonal changes update the filter without seeking or restarting media; only source changes deliberately replace the shared element's source. The cadence replaces one timer rather than adding timers.

Shared/desktop/mobile values use the existing scoped draft, undo/reset, defaults preview, local draft persistence and consolidated import/export. Closing retains the draft preview per the existing studio contract. Preview actual site defaults disables all draft effects including source choice; clearing it restores the draft. None of these browser drafts become production defaults. `ambient-treatment.js`, HTML and CSS carry explicit baked defaults.

## Adding clips

Put browser-compatible MP4 or WebM files in `assets/ambient/`, with unique filenames beginning with a letter/number and containing letters, numbers, spaces, dots, underscores or hyphens. Vite discovers files on refresh using `ambient-sources.js`; refresh after additions/removals. The built-in full-performance HLS option remains first in the source list. No browser filesystem permission is needed. Local clips may contain audio, but ambient preview always remains muted. Explicit Play always switches the shared element back to the canonical HLS stream before restarting with sound.

The static Pages staging step runs `node scripts/generate-ambient-sources.cjs _site/ambient-sources.js`. This emits the built-in HLS entry plus the same local registry with relative URLs that work under the repository subpath, replacing the Vite-only glob in the staged output. For manual static staging, run the same command and copy assets plus the runtime scripts. No production Vite build is required. Missing saved filenames remain visible as missing in the studio and display the default full-performance stream; undo/import preserves their stable filename identifier.

Validation includes single-element HLS reuse, local-to-HLS source replacement, zero-time explicit restart, renderer lifecycle/cadence/source tests, fixed monochrome markup, live levels updates, scoped treatment serialization/validation, original-performance controls and static-manifest discovery. Automated tests cover replay, reduced motion, failures, and the non-tinting Layout Studio target outline. Physical mobile/Safari testing is not available.

The ambient stream loops only if it reaches the end of the full performance. No synthetic loop transition is added.

Final automated QA: 45 tests pass. Integrated browser QA, including production-default visual tuning and physical Safari/mobile behavior, remains a separate step.
