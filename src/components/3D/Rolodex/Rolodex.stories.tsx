import { DeskObjectStudy } from '../../../experience/debug/ObjectStudy/DeskObjectStudy';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ROLODEX_CARDS, ROLODEX_FINISHES, Rolodex } from './Rolodex';
import { RolodexCard } from './RolodexCard';
import type { RolodexEntry } from './wheel';

const meta = {
  title: 'Library/Components/3D/Rolodex',
  component: Rolodex,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    finish: { control: 'inline-radio', options: ROLODEX_FINISHES },
    rotation: { control: { type: 'range', min: -20, max: 20, step: 0.5 } },
    cardRotation: { control: { type: 'range', min: -20, max: 20, step: 0.5 } },
    defaultIndex: { control: { type: 'range', min: 0, max: ROLODEX_CARDS.length - 1, step: 1 } },
    index: { control: { type: 'range', min: 0, max: ROLODEX_CARDS.length - 1, step: 1 } },
    loose: { control: 'boolean' },
    label: { control: 'text' },
    cards: { control: false },
  },
  args: {
    cards: ROLODEX_CARDS,
    defaultIndex: 6,
    finish: 'putty',
    rotation: -2,
    cardRotation: -3,
    loose: true,
    label: 'Rotary card file',
  },
  decorators: [
    (Story, context) =>
      context.parameters.composition ? (
        <Story />
      ) : (
        <div style={{ padding: 48, background: '#ead3a7' }}>
          <div style={{ width: 860, maxWidth: '100%' }}>
            <Story />
          </div>
        </div>
      ),
  ],
} satisfies Meta<typeof Rolodex>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The file open at Olive's: the comb of card edges in the tray, and the card itself lying beside it. */
export const OnTheDesk: Story = {};

/** Open at the first card, with the gap at the front of the comb. The knobs, the arrow keys and the tabs all turn it. */
export const StepWithTheKeys: Story = {
  args: { defaultIndex: 0 },
};

/** The wheel by itself, for a page that would rather lay the card out where it likes. */
export const WheelAlone: Story = {
  args: { loose: false },
};

/** One card on its own, off the wheel: the only way a rotary card is ever readable from overhead. */
export const OneCard: StoryObj<typeof RolodexCard> = {
  parameters: { composition: true },
  render: () => (
    <div style={{ padding: 48, background: '#ead3a7' }}>
      <div style={{ width: 420 }}>
        <RolodexCard card={ROLODEX_CARDS[2]} seed={2} rotation={-2} />
      </div>
    </div>
  ),
};

/** The three finishes: the office putty, the black one, and the older bare steel. */
export const Finishes: Story = {
  parameters: { composition: true },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36, padding: 48, background: '#ead3a7' }}>
      {ROLODEX_FINISHES.map((finish) => (
        <div key={finish} style={{ width: 720, maxWidth: '100%' }}>
          <Rolodex {...args} finish={finish} rotation={0} />
        </div>
      ))}
    </div>
  ),
};

/** A file of two, which is what a wheel looks like when there is nothing in it to hold the packs up. */
export const NearlyEmpty: Story = {
  args: {
    defaultIndex: 0,
    cards: [
      { name: 'Aunt Vi', lines: ['Will not be told', 'tel. 845 · 555 · 0100'] },
      { name: 'Zeb, the van', lines: ['Only answers after six'] },
    ],
  },
};

/**
 * The card set the owner will actually hand it: a name far too long for the
 * heading, a card with one line, a card with nine, a card that is nothing but
 * a name, and a correction typed over the top of a correction.
 */
export const AwkwardCards: Story = {
  args: {
    defaultIndex: 0,
    cards: [
      {
        tab: 'N',
        name: 'Nyack Neighborhood Music & Arts Festival Committee (Provisional), Inc.',
        lines: ['5 First Avenue, Nyack NY 10960', 'Ask for the chair, not the treasurer'],
        note: 'they mean well',
      },
      { name: 'Ed', lines: ['tel. 914 · 555 · 0199'] },
      {
        name: 'Saturn Lanes',
        lines: [
          'Hackensack NJ · bowling alley',
          'Doors 8.30 · set 9.30',
          'tel. ~~201 · 555 · 0270~~ 201 · 555 · 0271',
          'Ask for Ruth on the desk',
          'Lane 7 is the stage, lanes 1–6 still bowl',
          'PA is theirs, and it hums',
          'Load in by the shoe counter',
          'No cab bigger than a 2×12',
          '$90 and the bar tab, cash on the night',
        ],
        stamp: 'HOLD',
      },
      { name: 'Sam' },
      {
        name: 'Wallace & Sons',
        lines: ['Piano tuning, upright or grand', 'Two days’ notice, more in winter'],
        note: 'ring the workshop, not the house, and ask for the younger one',
        stamp: 'PAID',
      },
    ] as RolodexEntry[],
  },
};

export const OnDesk: Story = {
  name: 'On desk',
  parameters: { layout: 'fullscreen', composition: true },
  render: (args) => <DeskObjectStudy name="Rolodex" widthMm={137.05} depthRatio={624/518} heightMm={107.95} solid={{ localCoordinates: true, height: 408/518, foot: { x: .5, y: 312/518 } }} note="Dimensions derived from the existing inch-scaled drawing. Simplified whole-file shadow; individual cards are not separate occluders."><Rolodex {...args} rotation={0} loose={false} /></DeskObjectStudy>,
};
