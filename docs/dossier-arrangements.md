# Dossier lifecycle and desk arrangements

`BandDossier` accepts controlled `open` plus `onOpen` / `onClose` requests. It has no knowledge of lamps, other objects, or room coordinates. Its tab is the keyboard-accessible toggle; its cover remains available to its containing Movable for dragging.

`DeskDossier` is the main PerspectiveDesk composition. It replaces the old fixed closed dossier/inspection wrapper. It remembers the current closed arrangement, including a folder the visitor moved, and asks `useRoomArrangement` to animate named open targets. Closing returns the objects to that remembered arrangement. Dragging an object during an arrangement takes that object out of the animation. Opening again sets spilled papers back to their named target places.

The arrangement controller uses the existing Room place store on each animation frame, so object positions, lighting and shadows see the same positions. It does not remount children or rebuild the entire Room. A new request cancels the previous flight and starts from the live arrangement. Reduced motion applies target positions immediately.

The spill reuses the original PromoterDesk content, physical sizes and target map, converted from 2 units/mm to 1.2 units/mm; the festival pass is placed below the folder to keep its closing tab clear. The initial dossier lies left of the lamp shade, and the open arrangement moves the lamp aside. These scene targets live in `DeskDossier.tsx`, rather than in reusable Folder or BandDossier.

BandDossier opts into Folder's `lazyContents` lifecycle: closed dossiers do not mount member cards, the one-sheet, video or tape player. Closing makes content inert immediately and retains it for the 950 ms cover transition before teardown. The selected member is held by BandDossier and survives closure; paper unfolding and media playback end when packed. Generic Folder keeps its previous mounting behavior unless the caller opts into lazy contents.

The desk's external Spill uses `lazy` and an explicit last flight index. It mounts in its packed pose, paints that pose before opening, and stays mounted through the final closing flight (1710 ms at the default timings). Closing removes hidden hit targets immediately using `inert`; after the flight it removes the content DOM. A rapid reopen cancels teardown. Media ends with teardown; reopening starts a fresh press package.

Browser coverage: `Pages/Desk Dossier/Open And Return` checks mounted-content absence, moved-folder origin, intermediate surrounding-object positions, no packet remount during movement, closing teardown and rapid toggles. `Pages/Sections/Band Dossier/Lazy Contents` verifies the standalone dossier's lazy lifecycle and retained member selection. Existing Folder, Spill and PromoterDesk stories remain covered.
