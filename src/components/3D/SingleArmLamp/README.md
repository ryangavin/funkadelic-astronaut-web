# Single-arm lamp comparison

`SingleArmLamp` is an alternative component; the existing two-arm `DeskLamp` remains Room's default.

The base hinge carries one rigid 350 mm arm. Arm elevation is 15–85° above the tabletop. The 90 mm radius base stands 25 mm high; the swivelling shade has a 45 mm horizontal reach, 65 mm radius and 50 mm drawn depth. Its bulb stays 20 mm below the arm endpoint. These measurements stay fixed while the hinge moves.

Drag the base arrow up/down to raise/lower the arm; drag the shade arrow left/right to swivel it. Focus either control and use arrow keys (2°, Shift:10°); Home restores its reference. The separate circular switch controls illumination. Incoming `armAngle`, `shadeAngle` and `on` changes reset the local controls; callbacks report interactions.

For physical Room use, render at 720 desk-unit width in a Pin, supply that Pin's `place` and the camera from `useRoomCamera()`, and set `Room showLamp={false}`. `showLamp` omits only the built-in lamp; `lamp={false}` retains its existing meaning of switching that lamp off. Each Room has one light source owner.

The new lamp uses the shared point-light pool/shadow model. Shade swivel moves the bulb around the neck; it does not introduce a spotlight cone. The existing generic lamp rig reports `elbow=base`, representing one zero-length segment followed by the physical arm, so current consumers can display the new rig without a second elbow.

Stories include the isolated component, matched high and low Room views, and a shared physical-settings comparison. Both comparison rooms have the same camera, desktop, meter stick and base position. Shape/height differences belong to the lamp designs, not separate framing.
