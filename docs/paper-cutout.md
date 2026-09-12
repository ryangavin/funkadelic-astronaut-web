# Reusable paper cutouts

Load `paper-cutout.js` and `styles/paper.css` (already included by the site).
Wrap any card, photo, or other content with an element marked `data-paper-cutout`.
Give that wrapper its desired dimensions or let its content size it. Its backing follows
resizes automatically; all content remains normal accessible HTML.

```html
<figure data-paper-cutout><img src="photo.webp" alt="Band on stage"></figure>
```

For configurable instances, mount once and retain the returned controller:

```js
const paper = PaperCutout.mount(document.querySelector('.my-card'), {
  margin: 24, tear: 12, fibers: 5, fiberOpacity: .48,
  agingColors: ['#ead3a7', '#e7cda0', '#d8b985', '#c3a06b'],
  jitter: true
});
paper.update({tear: 18, fiberOpacity: .3});
// When removing the component:
paper.destroy();
```

Options: `color` for uniform stock, `agingColors` for four gradient stops,
`margin`, `tear`, `fibers` (extra fiber width), `fiberOpacity`, `shadow` (CSS
filter value, including `none`), and `jitter`. Geometry values are SVG reference
units, 720 across by default, so they scale with the piece. Jitter respects reduced
motion. Existing astronaut motion stays under the site's motion controller.

Custom silhouettes take `path` (closed SVG path), `width`, and `height` describing
the artwork coordinate system. Match wrapper and artwork aspect ratios. The
`astronaut` preset preserves the approved silhouette, stock aging and edge widths.
Each instance owns unique SVG IDs, preventing filter/mask collisions.

Paper aging belongs to the backing, including its torn margin. Content sits above
it; transparent illustration areas reveal the paper. Opaque photos retain their own
colors. Overall poster water stains remain a separate layer above the composition.
This is a plain DOM utility, not yet the proposed React/npm framework.
