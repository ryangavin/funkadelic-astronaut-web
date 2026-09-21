import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { CafeCounter } from './CafeCounter';
const meta = { title: 'Experiments/Cafe Counter', component: CafeCounter, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof CafeCounter>;
export default meta;
type Story = StoryObj<typeof meta>;
export const WindowCounter: Story = {
  play: async ({ canvasElement }) => {
    if (import.meta.env.MODE !== 'test') return;
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('group', { name: 'Next show sample pass' })).toBeVisible();
    await expect(canvas.getByRole('img', { name: 'Decorative Zyn-style pouch tin' })).toBeVisible();
    const handheld = canvas.getByRole('group', { name: 'Handheld' });
    await userEvent.click(within(handheld).getByRole('button', { name: 'Select: show readout' }));
    await expect(within(handheld).getByRole('button', { name: 'Select: show readout' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Open the press package' }));
    await waitFor(() => expect(canvasElement.querySelector('.desk-dossier__contents')).toHaveAttribute('data-phase', 'open'), { timeout: 12000 });
    await userEvent.click(canvas.getByRole('button', { name: 'Close the press package' }));
    await waitFor(() => expect(canvasElement.querySelector('.desk-dossier__contents')).toBeNull(), { timeout: 12000 });
    await expect(canvas.getByRole('button', { name: 'Open the press package' })).toBeVisible();
    await expect(within(handheld).getByRole('button', { name: 'Select: show readout' })).toHaveAttribute('aria-pressed', 'true');
  },
};
