# Desktop texture coordinates

Desktop grain and pores are generated in physical desk units. The grain SVG's viewBox covers the existing 14% overscan around each board; its foreignObject retains the original CSS gradient recipe, with one local CSS pixel representing one desk unit. Turbulence and displacement operate in that same space. The pores SVG uses the physical desktop width and depth as its viewBox.

This matters when eye height, tabletop height, or viewport size changes the desktop's displayed width. Previously, the bands scaled in desk units while turbulence and displacement sampled raw display pixels; the pores SVG also sampled display pixels. The material therefore changed instead of scaling with the tabletop. Camera projection, timber colors, gradient stops, noise seeds, board seams, edge, lighting, and the public Desk props are unchanged.

A Chromium comparison of the old and new renderer at native scale (1440 display pixels for a 1440-unit desk) differed by only 0.0044/255 mean color value. The visible grain recipe is retained. At different display scales, fine pores still show normal subpixel antialiasing; they now use the same physical coordinates.

Run `PREVIEW_URL=http://127.0.0.1:4177 node tests/desk-material-scale.browser.mjs` against an assignment-owned unified preview. It compares corresponding physical texture regions across a 2× responsive resize and across an actual tabletop-height edit (750→1100 mm). The latter samples the face-on desktop at each camera-dependent layout scale, excluding the legitimate perspective change. A two-pixel low-pass comparison separates stable grain landmarks from fine-pore raster aliasing; the test also verifies unchanged physical pore/grain viewBoxes and noise parameters.
