# Dossier lifecycle and desk arrangements

`BandDossier` accepts controlled `open` plus `onOpen` / `onClose` requests. It has no knowledge of lamps, other objects, or room coordinates. Its visible two-line ink stamp is the keyboard-accessible toggle; its cover remains available to its containing Movable for dragging.

`DeskDossier` is the main PerspectiveDesk composition. It replaces the old fixed closed dossier/inspection wrapper. It remembers the current closed arrangement, including a folder the visitor moved, and asks `useRoomArrangement` to animate named open targets. Closing returns the objects to that remembered arrangement. Dragging an object during an arrangement takes that object out of the animation. A fresh opening sets spilled papers back to their named target places; an interrupted return preserves their existing interactive component instances.

The arrangement controller uses the existing Room place store on each animation frame, so object positions, lighting and shadows see the same positions. A transient per-object arrangement flag disables the Movable’s own CSS easing while these frames are supplied, including reduced-motion jumps; it does not apply drag-lift styling and is never saved with coordinates. The final target paints before ordinary transitions return. Each Solid has a small placement subscriber to refresh its measured projection without remounting its content or rebuilding the entire Room. A new request cancels the previous flight and starts from the live arrangement. Reduced motion applies target positions immediately.

The spill reuses the original PromoterDesk content, physical sizes and target map, converted from 2 units/mm to 1.2 units/mm; the festival pass is placed below the folder to keep its closing tab clear. The initial dossier lies left of the lamp shade, and the open arrangement moves the lamp aside. These scene targets live in `DeskDossier.tsx`, rather than in reusable Folder or BandDossier.

BandDossier opts into Folder's `lazyContents` lifecycle: closed dossiers do not mount member cards, the one-sheet, video or tape player. Closing makes content inert immediately and retains it for the 950 ms cover transition before teardown. The selected member is held by BandDossier and survives closure; paper unfolding and media playback end when packed. Generic Folder keeps its previous mounting behavior unless the caller opts into lazy contents.

The desk owns a staged sequence: mount packed contents beneath the still-closed cover, paint the pile, open the cover (950 ms), spill (900 ms plus 110 ms per item), return the papers (1710 ms), close the cover (950 ms), then cull. The folder stays in place during the return; its remembered position is restored with the cover closing, while packed papers follow it exactly. Surrounding objects begin returning immediately. Reduced motion skips timed stages and uses the same final states. Enabling it during a return immediately restores the complete remembered layout before culling or clearing the snapshot.

`Folder.contentsLayer` hosts a single scene-owned content tree in the cover's stacking context. `BandDossier` passes that generic slot through and keeps `onOpen` / `onClose` as requests; `requestedOpen` separates the requested state from the actual staged cover state. No duplicate cover or content remount is used during flights. The desk counter-transforms the contents into desk coordinates and measures their current dimensions to fit resized or unfolded papers into the well. Packed papers remain opaque and visible: the actual cover hides them. The open flight layer sits above the open leaves, then returns below the cover only after the return finishes. Spill's opt-in `hidePacked={false}` and `packedScale` leave its previous default behavior intact.

Closing makes the spill inert immediately. A rapid reversal cancels the old stage deadline and keeps its mounted papers and their local state. Fully closed dossiers contain no paper/media DOM; reopening after complete closure starts a fresh press package.

Browser coverage: `Cover Occlusion` checks packed drawing bounds and cover stacking through a physical-camera, moved/rotated/resized-folder sequence, opaque mid-close content, same DOM across reversal, and independent paper dragging. `Reduced Motion` is also run with a Chromium reduced-motion context. `Pages/Desk Dossier/Open And Return` checks mounted-content absence, moved-folder origin, intermediate surrounding-object positions, no packet remount during movement, closing teardown and rapid toggles. `Pages/Sections/Band Dossier/Lazy Contents` verifies the standalone dossier's lazy lifecycle and retained member selection. Existing Folder, Spill and PromoterDesk stories remain covered.

Run the real reduced-motion browser check with:

```sh
npx vitest --config vite.reduced.config.mjs --project=storybook --run src/pages/Desk/DeskDossier.stories.tsx -t 'Reduced Motion'
```
