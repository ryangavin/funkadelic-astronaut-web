import type { Meta, StoryObj } from '@storybook/react-vite';
import { PosterButton } from './PosterButton';
import '../../workshop/workshop.css';

const meta = {
  title: 'Components/PosterButton',
  component: PosterButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    children: 'Book the band',
  },
} satisfies Meta<typeof PosterButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Coral: Story = {};

export const Mint: Story = {
  args: {
    tone: 'mint',
  },
};

export const Link: Story = {
  args: {
    children: 'Press kit',
    href: '#press-kit',
  },
};
