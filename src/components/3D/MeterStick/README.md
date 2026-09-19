# Meter stick

`MeterStick` is a responsive SVG whose 1000 × 40 artwork coordinates are millimetres. Its two ends define exactly one metre, with millimetre ticks and centimetre labels. `inches` defaults to true and adds eighth-inch ticks using exactly 25.4 mm per inch; set it false for metric alone.

The drawing does not set its own physical scene size. Place it at `mmToUnits(METER_STICK_MM.length)` wide, with depth `mmToUnits(METER_STICK_MM.width)` and relief/shadow height `METER_STICK_MM.height`. `ScaleBench` demonstrates shared Room camera, placement store, relief and shadow integration. Resizing is disabled so the reference remains a metre; dragging and rotation remain available.

Storybook: **Components / 3D / Meter Stick** for the drawing and on-desk composition; **Debug / Scale Bench / Physical Setup** for physical sliders with inch conversions. Scale Bench has no performance instrumentation or automatic interactions during ordinary browsing. Existing Desk Perf stories remain unchanged.

The markings represent scene distances, not a calibrated ruler for measuring the physical screen. Millimetre ticks naturally become hard to distinguish at small preview sizes.
