import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PerspectiveDesk } from '../../pages/Desk/PerspectiveDesk';
import { FrameRate } from './FrameRate';

/*
  The counter with something to count.

  The two rigs below exist to prove the readout tells the truth in both
  directions, which a story over the real desk cannot do on its own: if the
  desk happens to be fast that afternoon, a green figure says nothing about
  whether the instrument works. `Under Strain` is deliberately dear — every
  card carries a referenced SVG filter, which is the one cost this desk has
  reliably been ruined by, because a filtered layer cannot be cached the way a
  moved one can and repaints from scratch each frame it changes. Drag the
  handle in each and watch the two figures part company.
*/

/** A card that can be dragged about, and nothing else. The load is in how it is drawn. */
function Rig({ filtered, count = 24 }: { filtered: boolean; count?: number }) {
  const [at, setAt] = useState({ x: 0, y: 0 });
  const from = useRef<{ x: number; y: number } | null>(null);

  const down = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    from.current = { x: event.clientX - at.x, y: event.clientY - at.y };
  };
  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!from.current) return;
    setAt({ x: event.clientX - from.current.x, y: event.clientY - from.current.y });
  };
  const up = () => { from.current = null; };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#191512', color: '#efe7dc', font: '13px/1.5 ui-monospace, Menlo, monospace', overflow: 'hidden' }}>
      <svg width="0" height="0" aria-hidden style={{ position: 'absolute' }}>
        <filter id="frame-rate-strain">
          <feGaussianBlur stdDeviation="6" result="soft" />
          <feSpecularLighting in="soft" surfaceScale="4" specularConstant="1" specularExponent="20" lightingColor="#fff">
            <fePointLight x="120" y="-80" z="180" />
          </feSpecularLighting>
        </filter>
      </svg>
      <p style={{ margin: 0, padding: '1rem' }}>
        Drag the pale card. {filtered ? `${count} filtered layers move with it.` : `${count} plain layers move with it.`}
      </p>
      <div
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        style={{ position: 'absolute', inset: '5rem auto auto 5rem', translate: `${at.x}px ${at.y}px`, cursor: 'grab', touchAction: 'none' }}
      >
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: i * 6,
              left: i * 9,
              width: '14rem',
              height: '9rem',
              borderRadius: '.4rem',
              background: `hsl(${30 + i * 4} 30% ${20 + i}%)`,
              filter: filtered ? 'url(#frame-rate-strain)' : undefined,
            }}
          />
        ))}
        <div style={{ position: 'relative', width: '14rem', height: '9rem', borderRadius: '.4rem', border: '1px solid #857665', background: '#efe7dc', color: '#14110e', display: 'grid', placeItems: 'center' }}>
          drag me
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: 'Debug/Frame Rate',
  component: FrameRate,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FrameRate>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Cheap to draw: dragging should hold the refresh, and the two figures should agree. */
export const AtEase: Story = {
  args: { label: 'plain layers', corner: 'bottom-right' },
  render: args => <><Rig filtered={false} /><FrameRate {...args} /></>,
};

/** The same drag through a referenced SVG filter, which is what the counter is for. */
export const UnderStrain: Story = {
  args: { label: 'filtered layers', corner: 'bottom-right' },
  render: args => <><Rig filtered /><FrameRate {...args} /></>,
};

/** Just the number, for sitting in the corner of something being worked on. */
export const JustTheNumber: Story = {
  args: { detail: false, corner: 'top-right' },
  render: args => <><Rig filtered={false} /><FrameRate {...args} /></>,
};

/** Over the desk itself. Pick anything up and the dragged figure is the one to read. */
export const OnTheDesk: Story = {
  args: { label: 'promoter’s desk', corner: 'bottom-left' },
  render: args => <><PerspectiveDesk showSettings={false} /><FrameRate {...args} /></>,
};
