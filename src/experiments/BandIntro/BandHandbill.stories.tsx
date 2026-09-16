import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { BandHandbill } from './BandHandbill';

const meta = {
  title: 'Experiments/Band Introduction/Color Handbill',
  component: BandHandbill,
  parameters: { layout: 'fullscreen' },
  args: { initialBack: false, duration: 1100 },
  decorators: [(Story) => <div style={{ minHeight: '100vh', boxSizing: 'border-box', padding: '64px 28px', background: '#b9ad90', backgroundImage: 'url(/assets/paper-flecks.svg)' }}><Story /></div>],
} satisfies Meta<typeof BandHandbill>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Poster: Story = {};
export const BandBio: Story = { args: { initialBack: true } };
export const SlowMotionStudy: Story = { args: { duration: 3200 } };

export const ReducedMotion: Story = { args: { reducedMotion: true } };

/** Exercise repeated input while turning and keyboard reversal after settling. */
export const InteractionCheck: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Flip handbill to band bio' });
    const card = canvasElement.querySelector('.band-handbill')!;
    await userEvent.click(button);
    await expect(card).toHaveAttribute('data-back', 'true');
    if (card.getAttribute('data-turning') === 'true') {
      await userEvent.click(button);
      await userEvent.keyboard('{Enter}');
      await expect(card).toHaveAttribute('data-back', 'true');
    }
    await waitFor(() => expect(button).toHaveAttribute('aria-disabled', 'false'), { timeout: 2500 });
    await userEvent.keyboard(' ');
    await waitFor(() => expect(card).toHaveAttribute('data-back', 'false'));
    await waitFor(() => expect(button).toHaveAttribute('aria-disabled', 'false'), { timeout: 2500 });
    await expect(canvas.getByRole('status')).toHaveTextContent('Mini poster');
  },
};
