import { checkDeskStudy } from '../../../behaviors/Perspective/DeskObjectStudy.check';
import { DeskObjectStudy } from '../../../behaviors/Perspective/DeskObjectStudy';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { ROLODEX_CARDS, ROLODEX_FINISHES, Rolodex } from './Rolodex';
import { RolodexCard } from './RolodexCard';
import type { RolodexEntry } from './wheel';

const meta = {
  title: 'Components/3D/Rolodex',
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
export const OnTheDesk: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const file = canvas.getByRole('group', { name: 'Rotary card file' });
    /* The whole drawing is the wheel, a gutter and one 4 by 2 5/8 card: 960 by 624 ninety-sixths of an inch.
       Measured off the layout box, because both of them are lying on the desk at an angle. */
    await expect((file as HTMLElement).offsetHeight / (file as HTMLElement).offsetWidth).toBeCloseTo(624 / 960, 2);
    /* And the card really is 4 inches by 2 5/8. */
    const card = canvas.getByRole('article') as HTMLElement;
    await expect(card.offsetHeight / card.offsetWidth).toBeCloseTo(252 / 384, 2);
    await expect(canvas.getByRole('status').textContent).toContain('Olive’s');
  },
};

/** A click on the right-hand knob turns the wheel one card on, and the card lying on the desk changes with it. */
export const TurnTheKnob: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('article', { name: 'Card: Olive’s' })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Turn on a card' }));
    await expect(canvas.getByRole('article', { name: 'Card: Saturn Lanes' })).toBeInTheDocument();
    await expect(canvas.getByRole('status').textContent).toContain('card 8 of 10');
    await userEvent.click(canvas.getByRole('button', { name: 'Turn back a card' }));
    await expect(canvas.getByRole('article', { name: 'Card: Olive’s' })).toBeInTheDocument();
  },
};

/** Pressing an alphabet tab jumps the wheel to that letter. */
export const JumpByTab: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Go to B' }));
    await expect(canvas.getByRole('article', { name: 'Card: Bellweather Sound' })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Go to T' }));
    await expect(canvas.getByRole('article', { name: 'Card: Teddy Vasquez' })).toBeInTheDocument();
  },
};

/** The arrow keys step it from either knob, and the gap travels along the comb as they do. */
export const StepWithTheKeys: Story = {
  args: { defaultIndex: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const knob = canvas.getByRole('button', { name: 'Turn back a card' });
    knob.focus();
    const gapBefore = canvas.getByRole('button', { name: 'Go to W' }).getBoundingClientRect().top;
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await expect(canvas.getByRole('article', { name: 'Card: Dinah Okonkwo' })).toBeInTheDocument();
    await userEvent.keyboard('{ArrowUp}');
    await expect(canvas.getByRole('article', { name: 'Card: Cosmo’s Cartage' })).toBeInTheDocument();
    await userEvent.keyboard('{End}');
    await expect(canvas.getByRole('article', { name: 'Card: Wallace & Sons' })).toBeInTheDocument();
    /* With the last card out of the wheel, everything behind it has closed up: the comb has visibly shifted. */
    await waitFor(async () => {
      const gapAfter = canvas.getByRole('button', { name: 'Go to W' }).getBoundingClientRect().top;
      await expect(Math.abs(gapAfter - gapBefore)).toBeGreaterThan(2);
    });
  },
};

/** Typing a letter files straight to it, the way you would walk the tabs with a thumb. */
export const TypeALetter: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: 'Turn on a card' }).focus();
    await userEvent.keyboard('f');
    await expect(canvas.getByRole('article', { name: 'Card: Funkadelic Astronaut' })).toBeInTheDocument();
  },
};

/** The wheel by itself, for a page that would rather lay the card out where it likes. */
export const WheelAlone: Story = {
  args: { loose: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const file = canvas.getByRole('group', { name: 'Rotary card file' });
    /* The tray with a knob standing off each end: 518 by 624. */
    await expect((file as HTMLElement).offsetHeight / (file as HTMLElement).offsetWidth).toBeCloseTo(624 / 518, 2);
    await expect(canvas.queryByRole('article')).toBeNull();
  },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    /* A name that would never have fitted is typed smaller and wraps; the card is still 4 by 2 5/8. */
    const face = canvas.getByRole('article') as HTMLElement;
    await expect(face.offsetHeight / face.offsetWidth).toBeCloseTo(252 / 384, 2);
    await userEvent.click(canvas.getByRole('button', { name: 'Turn on a card' }));
    await expect(canvas.getByRole('article', { name: 'Card: Ed' })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Turn on a card' }));
    const many = canvas.getByRole('article', { name: 'Card: Saturn Lanes' });
    /* Nine lines still lie inside the card, because the rules close up to take them. */
    const stock = many.getBoundingClientRect();
    const lines = many.querySelectorAll('.rolodex-card__line');
    await expect(lines.length).toBe(9);
    const last = lines[lines.length - 1].getBoundingClientRect();
    await expect(last.bottom).toBeLessThanOrEqual(stock.bottom + 1);
  },
};

export const OnDesk: Story = {
  play: checkDeskStudy,
  name: 'On desk',
  parameters: { layout: 'fullscreen', composition: true },
  render: (args) => <DeskObjectStudy name="Rolodex" widthMm={137.05} depthRatio={624/518} heightMm={107.95} solid={{ localCoordinates: true, height: 408/518, foot: { x: .5, y: 312/518 } }} note="Dimensions derived from the existing inch-scaled drawing. Simplified whole-file shadow; individual cards are not separate occluders."><Rolodex {...args} rotation={0} loose={false} /></DeskObjectStudy>,
};
