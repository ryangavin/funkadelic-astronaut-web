import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { expect, waitFor } from 'storybook/test';
import { landOnHash } from './landOnHash';
import { PressKit } from './PressKit/PressKit';

/** The press kit as a cold load of a `#hash` link opens it. */
function DeepLink({ hash }: { hash: string }) {
  useEffect(() => landOnHash(hash), [hash]);
  return <PressKit />;
}

const meta = {
  title: 'Site/Deep Link',
  component: DeepLink,
  parameters: { layout: 'fullscreen' },
  // Each story opens at the top of the page with nothing focused, as a cold load does.
  beforeEach: () => {
    window.scrollTo(0, 0);
    (document.activeElement as HTMLElement | null)?.blur();
  },
} satisfies Meta<typeof DeepLink>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The booking section is on screen and has focus, so the keyboard carries on from it. */
const landsOnBooking: Story['play'] = async ({ canvasElement }) => {
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
};

/** A link to the booking section opens the page there, with the keyboard carrying on from it. */
export const ToASection: Story = {
  args: { hash: '#book' },
  play: landsOnBooking,
};

/** A hash as a browser may percent-encode it (`%62` is `b`) still finds its section. */
export const PercentEncoded: Story = {
  args: { hash: '#%62ook' },
  play: landsOnBooking,
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
