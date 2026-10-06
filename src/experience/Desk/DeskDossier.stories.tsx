import type { Meta, StoryObj } from '@storybook/react-vite';
import { PerspectiveDesk } from './PerspectiveDesk';

const meta = {
  title: 'Experience/Desk Dossier',
  component: PerspectiveDesk,
  parameters: { layout: 'fullscreen' },
  args: { showSettings: false, only: ['dossier', 'pen', 'walkman'] },
} satisfies Meta<typeof PerspectiveDesk>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The closed dossier beside the pen and the Walkman: open it and the papers spill out and the pen is shoved aside; close it and they go back. */
export const OpenAndReturn: Story = {};

/** Complete room composition for visual arrangement inspection. */
export const WholeRoom: Story = { args: { only: undefined } };

/** The dossier among the solid things, seen from higher up, so the shoved objects can be watched mid-flight. */
export const MotionStaysAligned: Story = {
  args: { only: ['dossier', 'pen', 'mug', 'phone', 'rolodex', 'labelBro'], headTiltDegrees: 80, eyeHeightMm: 2400, viewerSetbackMm: 700 },
};

/** The dossier alone, close up, for watching the papers pack under the cover as it swings. */
export const CoverOcclusion: Story = {
  args: { only: ['dossier'], eyeHeightMm: 2100, viewerSetbackMm: 750 },
};
