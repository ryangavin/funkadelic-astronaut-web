# Tour pass member cutouts

Mode: Codex built-in image generation (`image_gen`), using one identity/style-transfer call per member and targeted background-extraction calls where the first result did not contain clean alpha.

Style reference for every member: `assets/astronaut-flat.webp` (style only, never identity).

## Ryan Gavin

Identity reference: `assets/band-13.webp`

Final workspace asset: `assets/tour-pass-ryan-cutout.png`

Initial prompt:

> Use case: style-transfer. Asset type: small festival-pass action portrait sticker. Image 1 is the sole identity reference for Ryan Gavin; Image 2 is style reference only. Create a recognizable waist-up illustrated cutout portrait of Ryan Gavin from Image 1, translated into the bold outlined, limited-color, hand-inked retro paper-cutout/sticker illustration language of Image 2. Preserve Ryan's bald head, short beard, light skin tone, facial proportions, expressive musician energy, and black shirt. Use thick imperfect near-black fountain-ink contours, cream paper-colored interior, restrained brick-red, blue, and purple accents, simple confident shapes, subtle handmade line variation, and a clean die-cut silhouette. Center a compact waist-up/bust portrait with generous transparent margin and a strong silhouette at approximately 75px display width. Require genuine alpha transparency; no lettering, logo, border rectangle, or background. Avoid astronaut suit, helmet, headphones, instruments blocking the face, photorealism, gradients, glow, shadow backdrop, invented text, or watermark.

Final background-extraction prompt:

> Remove the entire baked gray checkerboard background and replace it with genuine alpha transparency. Preserve the illustrated Ryan Gavin portrait exactly—same face, expression, bald head, beard, pose, hands, clothing, colors, outlines, proportions, and cream sticker edge. Change only the background. Keep a clean die-cut contour and transparent margin. Avoid checkerboard pixels, gray backdrop, shadows outside the sticker edge, added objects, text, cropping, or portrait changes.

## Kevin O’Neill

Identity reference: `assets/band-22.webp`

Final workspace asset: `assets/tour-pass-kevin-cutout.png`

Final style-transfer prompt:

> Use case: style-transfer. Asset type: tiny transparent festival-pass portrait sticker. Image 1 is the sole identity reference for Kevin O'Neill; Image 2 is style reference only. Draw a compact, recognizable chest-up bust preserving his short dark hair, full dark beard, light skin tone, facial proportions, and warm broad smile in Image 2's bold hand-inked retro sticker language. Use near-black imperfect thick contours, cream interior, small brick-red and blue accent shapes, flat limited colors, and a clean cream die-cut edge. Center a simple upright head-and-shoulders silhouette with generous transparent margin, optimized to read at 75px wide. The canvas outside the cream sticker contour must be completely transparent RGBA alpha. Preserve identity and black shirt. Avoid astronaut elements, helmet, headphones, drums, drumsticks, instruments, background color, black rectangle, translucent halo, scenery, text, photorealism, gradients, or watermark.

Final background-extraction prompt:

> Remove every gray checkerboard/background pixel and replace the whole area outside the cream sticker contour with genuine zero-alpha transparency. Preserve the Kevin O'Neill illustrated bust exactly, pixel-for-pixel in appearance—same face, smile, hair, beard, shoulders, shirt, colors, outlines, shape, and cream die-cut edge. Change only the exterior background. Avoid any checkerboard pattern, gray pixels, backdrop, glow, halo, shadow outside the cream edge, portrait changes, text, or cropping.

## Sam Luba

Identity reference: `assets/band-21.webp`

Final workspace asset: `assets/tour-pass-sam-cutout.png`

Final prompt:

> Use case: style-transfer. Asset type: small festival-pass action portrait sticker. Image 1 is the sole identity reference for Sam Luba; Image 2 is style reference only. Create a recognizable waist-up illustrated cutout portrait translated into the bold outlined, limited-color, hand-inked retro paper-cutout/sticker illustration language of Image 2. Preserve Sam's short dark hair, thick full dark beard, strong eyebrows, medium-light skin tone, facial proportions, friendly performance expression, and black shirt. Use thick imperfect near-black fountain-ink contours, cream paper-colored interior, restrained brick-red, blue, and purple accents, simple confident shapes, subtle handmade line variation, and a clean die-cut silhouette. Center a compact waist-up/bust portrait with generous transparent margin and a strong readable silhouette at approximately 75px display width. Require genuine alpha transparency; no lettering, logo, border rectangle, or background. Avoid astronaut suit, helmet, headphones, microphone or instrument blocking the face, photorealism, gradients, glow, shadow backdrop, invented text, or watermark.
