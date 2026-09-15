/** Shared worn-ink finish from the original poster. */
export function PrintInkFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-3%" y="-6%" width="106%" height="112%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="8" result="edge" />
      <feDisplacementMap in="SourceGraphic" in2="edge" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="rough" />
      <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="2" seed="12" result="grain" />
      <feColorMatrix in="grain" type="luminanceToAlpha" />
      <feComponentTransfer><feFuncA type="discrete" tableValues="0 0.45 0.88 1 1 1 1 1" /></feComponentTransfer>
      <feComposite in="rough" operator="in" result="worn" />
      <feColorMatrix in="grain" type="luminanceToAlpha" />
      <feComponentTransfer><feFuncA type="discrete" tableValues="0 0 0 0 0 0.2 0.45 0.65" /></feComponentTransfer>
      <feComposite in2="SourceAlpha" operator="in" result="flecks" />
      <feFlood floodColor="#29231d" />
      <feComposite in2="flecks" operator="in" />
      <feComposite in2="worn" operator="over" />
    </filter>
  );
}
