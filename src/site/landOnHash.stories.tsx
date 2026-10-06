import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { useLandOnHash } from './landOnHash';
import { PressKit } from './PressKit/PressKit';

/** The press kit as a cold load of a `#hash` link opens it. */
function DeepLink({ hash }: { hash: string }) {
  useLandOnHash(hash);
  return <PressKit />;
}

const meta = {
  title: 'Site/Deep Link',
  component: DeepLink,
  parameters: { layout: 'fullscreen' },
  // Each story opens at the top of the page, as a cold load does.
  beforeEach: () => {
    window.scrollTo(0, 0);
  },
} satisfies Meta<typeof DeepLink>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A link to the booking section opens the page there, with the keyboard carrying on from it. */
export const ToASection: Story = {
  args: { hash: '#book' },
  play: async ({ canvasElement }) => {
    const book = canvasElement.querySelector<HTMLElement>('#book')!;
    await expect(book).not.toBeNull();
    await waitFor(() => {
      const { top } = book.getBoundingClientRect();
      expect(top).toBeGreaterThanOrEqual(0);
      expect(top).toBeLessThan(window.innerHeight);
    });
    await expect(window.scrollY).toBeGreaterThan(0);
    await expect(document.activeElement).toBe(book);
    // The section was only made focusable to take focus; leaving it puts the page back as it was.
    book.blur();
    await expect(book).not.toHaveAttribute('tabindex');
  },
};

/** A hash that names nothing on the page leaves the page at the top and focus where it was. */
export const ToNothing: Story = {
  args: { hash: '#nowhere' },
  play: async ({ canvasElement }) => {
    await expect(window.scrollY).toBe(0);
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
    await expect(canvasElement.querySelector('[tabindex="-1"]')).toBeNull();
  },
};
