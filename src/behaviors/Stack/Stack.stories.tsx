import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MemberPile } from '../../sections/BandDossier/BandDossier';

const meta = {
  title: 'Behaviors/Stack',
  component: MemberPile,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    spread: { control: { type: 'range', min: 0, max: 3, step: 0.1 } },
    spreadX: { control: { type: 'range', min: 0, max: 4, step: 0.1 }, description: 'Sideways lean of the cards, on its own. Follows spread until set.' },
    duration: { control: { type: 'range', min: 200, max: 2400, step: 50 } },
    side: { control: 'inline-radio', options: [1, -1] },
  },
  args: { initial: 0, spread: 1, spreadX: 1, duration: 900, side: 1 },
  decorators: [
    (Story) => (
      <div style={{ padding: '72px 56px', background: '#ead3a7' }}>
        <div style={{ width: 560, maxWidth: '100%' }}>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof MemberPile>;

export default meta;
type Story = StoryObj<typeof meta>;

const topItem = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>('.stack__item')].reduce((top, item) => (Number(item.style.zIndex) > Number(top.style.zIndex) ? item : top));

/** Click a peeking packet to pull it out and land it on top; click the top one to send it under. */
export const Sift: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(topItem(canvasElement).textContent).toContain('Ryan Gavin');
    await userEvent.click(canvas.getByRole('button', { name: 'Bring Sam Luba to the front' }));
    await waitFor(() => expect(topItem(canvasElement).textContent).toContain('Sam Luba'));
    await userEvent.click(canvas.getByRole('button', { name: /Sam Luba, on top/ }));
    await waitFor(() => expect(topItem(canvasElement).textContent).toContain('Ryan Gavin'), { timeout: 2000 });
    await userEvent.click(canvas.getByRole('button', { name: 'Bring Kevin O’Neill to the front' }));
    await waitFor(() => expect(topItem(canvasElement).textContent).toContain('Kevin O’Neill'), { timeout: 2000 });
    await expect(canvas.getByRole('status').textContent).toBe('Kevin O’Neill · 2 of 3');
  },
};

/** A slower, looser pile, to study the flight. */
export const SlowMotion: Story = {
  args: { duration: 2400, spread: 1.4 },
};
