import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import deskStories, { Desk as DeskStory } from '../Desk/PerspectiveDesk.stories';
import type { PerspectiveDeskProps } from '../Desk/PerspectiveDesk';
import { Arrival, type ArrivalProps } from './Arrival';
import { TitleScreen } from './TitleScreen';

/**
 * Prototypes for the question the desk on its own does not answer: whose site
 * is this? A title that says so before anything else, two ways of keeping the
 * name and the useful links on screen once you are on the desk, and the move
 * from one to the other.
 *
 * The desk is the Perspective Desk's own composition, unchanged. The links
 * that stay on the site go to the thing on the desk that already does the job
 * and pick it up — Listen is the Walkman, Watch the handheld, Press kit opens
 * the dossier — so the header is a way through the room, not out of it.
 */
const DESK = { ...deskStories.args, ...DeskStory.args } as PerspectiveDeskProps;

const meta = {
  title: 'Pages/Arrival',
  component: Arrival,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    header: { control: 'inline-radio', options: ['bar', 'wall', 'none'] },
    title: { control: 'boolean' },
    desk: { table: { disable: true } },
  },
  args: { desk: DESK, header: 'bar', title: true },
} satisfies Meta<ArrivalProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The title on its own, as a page: who, what they sound like, and when to see them. */
export const Title: Story = {
  render: () => <TitleScreen />,
};

/** The desk under a floating bar that is plainly the site's own chrome. */
export const FloatingBar: Story = {
  args: { header: 'bar', title: false },
  play: async ({ canvasElement }) => {
    if (import.meta.env.MODE !== 'test') return;
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: /Listen/ }));
    await waitFor(() => expect(canvasElement.querySelector('.inspector[data-inspecting]')).toBeInTheDocument());
  },
};

/** The desk under its own wall, with the band wheat-pasted on it and the links pasted over as snipes. */
export const PastedWall: Story = {
  args: { header: 'wall', title: false },
};

/** The whole visit: the title, and going in — the flyer is put down on the desk and the name goes up into the bar. */
export const TitleIntoBar: Story = {
  args: { header: 'bar', title: true },
};

/** The same, going in under the pasted wall. */
export const TitleIntoWall: Story = {
  args: { header: 'wall', title: true },
};
