export type InkjetFilterProps = {
  id: string;
  /** How much of the screen's colour four inks on plain paper can reach, 0 to 1. */
  gamut?: number;
  /** How far the ink spreads into the fibre, in printed pixels. */
  spread?: number;
  /** How fine the dither is: higher is a finer screen of dots. */
  dots?: number;
  /** How strongly the dither shows, 0 to 1. */
  dither?: number;
  /** How strongly the head's passes band the sheet, 0 to 1. */
  banding?: number;
  /** Which sheet this is: no two come out of a printer quite alike. */
  seed?: number;
};

/** Ink laid in all three channels alike: a dot of ink is a dot, not a colour. */
const GREY = '1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1';

/**
 * What an office inkjet does to a file on its way to plain copy paper. Every
 * step is one of the machine's own limits: four inks that cannot reach the
 * screen's colours and a black that dries a warm dark grey, ink that spreads a
 * hair into the fibre, a dither of dots in place of continuous tone, and the
 * faint bands the head leaves where one pass meets the next. The dots and the
 * bands are composited so that they fall away to nothing as the ink does:
 * where the printer lays no ink, the paper is left alone.
 */
export function InkjetFilter({ id, gamut = 0.55, spread = 0.6, dots = 0.55, dither = 0.22, banding = 0.13, seed = 5 }: InkjetFilterProps) {
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      {/* The gamut of four inks on uncoated stock, and the black that dries to a warm dark grey rather than
          black. Each curve leaves 1 where it is, because where there is no ink there is only the paper. */}
      <feColorMatrix type="saturate" values={String(gamut)} result="gamut" />
      <feComponentTransfer in="gamut" result="inks">
        <feFuncR type="linear" slope="0.87" intercept="0.13" />
        <feFuncG type="linear" slope="0.885" intercept="0.115" />
        <feFuncB type="linear" slope="0.915" intercept="0.085" />
      </feComponentTransfer>
      {/* The ink spreads into the fibre, so nothing on the page has a hard edge. */}
      <feGaussianBlur in="inks" stdDeviation={spread} result="wet" />

      {/* The dither: the head has no continuous tone, only dots, and it lays them only where there is ink to lay. */}
      <feTurbulence type="fractalNoise" baseFrequency={dots} numOctaves="1" seed={seed} result="grit" />
      <feColorMatrix in="grit" type="matrix" values={GREY} result="screen" />
      <feComposite in="wet" in2="screen" operator="arithmetic" k1={dither} k2="1" k3={-dither} k4="0" result="dithered" />

      {/* The head's passes: bands the length of the sheet where one pass meets the next. */}
      <feTurbulence type="fractalNoise" baseFrequency="0.0015 0.18" numOctaves="1" seed={seed + 7} result="pass" />
      <feColorMatrix in="pass" type="matrix" values={GREY} result="bands" />
      <feComposite in="dithered" in2="bands" operator="arithmetic" k1={banding} k2="1" k3={-banding} k4="0" />
    </filter>
  );
}
