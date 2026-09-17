import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentProps } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { PaperSheet } from '../PaperSheet/PaperSheet';
import { Pen } from '../../3D/Pen/Pen';
import {
  CONTRACT_PAGE,
  CONTRACT_PAPERS,
  CONTRACT_SIGNED_LENGTH,
  Contract,
  isSigned,
  nibWidth,
  signatureLength,
  type ContractSignature,
} from './Contract';
import { handAt } from './ink';

/** A signature already on the page: the house hand, written at the pace a hand writes it. */
const WRITTEN: ContractSignature = {
  strokes: [Array.from({ length: 96 }, (_, index) => ({ ...handAt(index / 95), t: index * 16 }))],
  signedAt: '2026-09-09T15:12:00.000Z',
};

const meta = {
  title: 'Components/2D/Contract',
  component: Contract,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    paper: { control: 'inline-radio', options: CONTRACT_PAPERS },
    rotation: { control: { type: 'range', min: -20, max: 20, step: 0.5 } },
    artist: { control: 'text' },
    title: { control: 'text' },
    reference: { control: 'text' },
    preamble: { control: 'text' },
    termsHeading: { control: 'text' },
    clausesHeading: { control: 'text' },
    signerName: { control: 'text' },
    signerRole: { control: 'text' },
    foot: { control: 'text' },
    stampText: { control: 'text' },
    stampBy: { control: 'text' },
    stampDate: { control: 'text' },
    stamped: { control: 'boolean' },
    terms: { control: 'object' },
    clauses: { control: 'object' },
    countersignature: { control: 'object' },
    signature: { control: 'object' },
  },
  args: {
    paper: 'bond',
    rotation: -1.5,
    signature: null,
    stamped: false,
    onSign: fn(),
    onStamp: fn(),
  },
  decorators: [
    (Story, context) =>
      context.parameters.composition ? (
        <Story />
      ) : (
        /* Room to the right of the sheet for the stamp, which lies on the desk beside it. */
        <div style={{ padding: '48px 230px 48px 48px', background: '#ead3a7' }}>
          <div style={{ width: 560, maxWidth: '100%' }}>
            <Story />
          </div>
        </div>
      ),
  ],
} satisfies Meta<typeof Contract>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Straight out of the envelope, nothing on the line yet. Drag along the purchaser's rule and sign it. */
export const Unsigned: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const page = canvas.getByRole('group', { name: 'Performance Agreement: Funkadelic Astronaut' });

    // US letter: 8½ by 11 inches, which is the 720 by 932 the page is drawn in.
    // Measured off the layout box, since the page is lying at an angle on the desk.
    await expect(page.offsetHeight / page.offsetWidth).toBeCloseTo(11 / 8.5, 2);
    await expect(CONTRACT_PAGE.height / CONTRACT_PAGE.width).toBeCloseTo(11 / 8.5, 2);
    // An inch of margin a side leaves each signature rule a shade under three inches.
    const pad = canvas.getByRole('button', { name: /^Sign here/ });
    await expect(pad.offsetWidth / page.offsetWidth).toBeCloseTo(CONTRACT_PAGE.rule / CONTRACT_PAGE.width, 2);
    await expect((pad.offsetWidth / page.offsetWidth) * 8.5).toBeCloseTo(2.9, 1);
    const rule = pad.getBoundingClientRect();

    // Nothing signed, so there is nothing to stamp yet.
    await expect(canvasElement.querySelector('.contract__ink-line')).toBeNull();
    await expect(canvas.getByRole('button', { name: /^Stamp it/ })).toBeDisabled();
    await expect(canvas.getByRole('status')).toHaveTextContent('Not signed yet');

    // Sign it: down at the left of the rule, up and over, back on itself, and away to the right.
    const at = (across: number, down: number) => ({
      clientX: rule.left + rule.width * across,
      clientY: rule.top + rule.height * down,
    });
    await userEvent.pointer([
      { keys: '[MouseLeft>]', target: pad, coords: at(0.07, 0.78) },
      { coords: at(0.1, 0.4) },
      { coords: at(0.17, 0.14) },
      { coords: at(0.25, 0.44) },
      { coords: at(0.18, 0.6) },
      { coords: at(0.3, 0.78) },
      { coords: at(0.44, 0.44) },
      { coords: at(0.58, 0.72) },
      { coords: at(0.74, 0.38) },
      { coords: at(0.93, 0.62) },
      { keys: '[/MouseLeft]', coords: at(0.93, 0.62) },
    ]);

    // The ink is really there, and it runs most of the way along the rule.
    const written = canvasElement.querySelector<SVGPathElement>('.contract__ink-line');
    await expect(written).not.toBeNull();
    await expect(written!.getBBox().width).toBeGreaterThan(200);
    // The hand doubled back, so the ink pooled where it turned.
    await expect(canvasElement.querySelectorAll('.contract__ink-pool').length).toBeGreaterThan(0);
    // A starved nib is finer than a standing one: that is what makes the line vary.
    await expect(nibWidth(0.02)).toBeGreaterThan(nibWidth(1.6) * 2);
    await expect(args.onSign).toHaveBeenCalled();
    await expect(pad).toHaveAccessibleName(/^Signed/);
    await expect(canvas.getByRole('status')).toHaveTextContent('Signed');

    // Signed, the stamp can come down, and what it leaves is off square.
    const stamper = canvas.getByRole('button', { name: /^Stamp it/ });
    await expect(stamper).toBeEnabled();
    await userEvent.click(stamper);
    await expect(args.onStamp).toHaveBeenCalled();
    const stamp = await waitFor(() => canvas.getByRole('img', { name: 'Stamped Confirmed' }));
    const crooked = getComputedStyle(canvasElement.querySelector('.contract__stamp')!).rotate;
    await expect(crooked).not.toBe('none');
    await expect(Math.abs(parseFloat(crooked))).toBeGreaterThan(2);
    await expect(stamp).toBeInTheDocument();
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('stamped confirmed'), { timeout: 2000 });
  },
};

/** Signed on the day and stamped: what the desk hands back once the promoter has taken the deal. */
export const SignedAndStamped: Story = {
  args: { signature: WRITTEN, stamped: true, rotation: 1 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(isSigned(args.signature ?? null)).toBe(true);
    await expect(signatureLength(args.signature ?? null)).toBeGreaterThan(CONTRACT_SIGNED_LENGTH);
    // The ink came back off the stored strokes, not out of a picture.
    const written = canvasElement.querySelector<SVGPathElement>('.contract__ink-line');
    await expect(written).not.toBeNull();
    await expect(written!.getBBox().width).toBeGreaterThan(200);
    await expect(canvas.getByRole('img', { name: 'Stamped Confirmed' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /^Stamped/ })).toBeDisabled();
  },
};

/** Signable with no mouse at all: put focus on the rule and hold Enter, and the hand writes until you let go. */
export const SignedByKeyboard: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const pad = canvas.getByRole('button', { name: /^Sign here/ });
    pad.focus();
    await expect(pad).toHaveFocus();

    // Held down, the pen goes down and writes.
    await userEvent.keyboard('{Enter>}');
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('Ink flowing'), { timeout: 2000 });
    await new Promise((settle) => setTimeout(settle, 900));
    await userEvent.keyboard('{/Enter}');

    // Letting go lifts the nib, and what it wrote stays on the page.
    await waitFor(() => expect(pad).toHaveAccessibleName(/^Signed/), { timeout: 2000 });
    const written = canvasElement.querySelector<SVGPathElement>('.contract__ink-line');
    await expect(written).not.toBeNull();
    await expect(written!.getBBox().width).toBeGreaterThan(80);
    await expect(args.onSign).toHaveBeenCalled();

    // And the stamp is a button like any other, so the keyboard can thump that too.
    const stamper = canvas.getByRole('button', { name: /^Stamp it/ });
    stamper.focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onStamp).toHaveBeenCalled();
    await waitFor(() => expect(canvas.getByRole('img', { name: 'Stamped Confirmed' })).toBeInTheDocument());
  },
};

/** What a desk has to keep: hand `onSign`'s signature back as `signature` and the ink comes back as written. */
function FiledCopy(args: ComponentProps<typeof Contract>) {
  const [kept, setKept] = useState<ContractSignature | null>(null);
  const [copy, setCopy] = useState(0);
  return (
    <div style={{ padding: '48px 230px 48px 48px', background: '#ead3a7', display: 'grid', gap: 20, justifyItems: 'start' }}>
      <button type="button" onClick={() => setCopy((was) => was + 1)}>
        File it and fetch it out again
      </button>
      <span>{signatureLength(kept).toFixed(0)} units of ink on file</span>
      <div style={{ width: 560, maxWidth: '100%' }}>
        <Contract
          {...args}
          key={copy}
          signature={kept}
          onSign={(signature) => {
            setKept(signature);
            args.onSign?.(signature);
          }}
        />
      </div>
    </div>
  );
}

/** The ink goes home with the desk: signed, filed and fetched back out, it is the same signature. */
export const KeptByTheDesk: Story = {
  parameters: { composition: true },
  render: (args) => <FiledCopy {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pad = canvas.getByRole('button', { name: /^Sign here/ });
    pad.focus();
    await userEvent.keyboard('{Enter>}');
    await new Promise((settle) => setTimeout(settle, 800));
    await userEvent.keyboard('{/Enter}');
    await waitFor(() => expect(pad).toHaveAccessibleName(/^Signed/), { timeout: 2000 });
    const before = canvasElement.querySelector<SVGPathElement>('.contract__ink-line')!.getAttribute('d');

    // Put away and taken out again: a fresh page, drawn from what the desk kept.
    await userEvent.click(canvas.getByRole('button', { name: 'File it and fetch it out again' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: /^Signed/ })).toBeInTheDocument());
    await expect(canvasElement.querySelector('.contract__ink-line')!.getAttribute('d')).toBe(before);
  },
};

/** The three stocks a set comes off on: the top copy, the carbon, and the goldenrod that stays in the file. */
export const Stocks: Story = {
  parameters: { composition: true },
  args: { signature: WRITTEN, stamped: true },
  render: (args) => (
    <div style={{ display: 'flex', gap: 150, padding: 48, background: '#ead3a7', flexWrap: 'wrap', justifyContent: 'center' }}>
      {CONTRACT_PAPERS.map((paper) => (
        <div key={paper} style={{ width: 320 }}>
          <Contract {...args} paper={paper} rotation={0} />
        </div>
      ))}
    </div>
  ),
};

/** Lying on the promoter's desk with the pen beside it, which is where it is asking to be signed. */
export const OnTheDesk: Story = {
  parameters: { composition: true, layout: 'fullscreen' },
  args: { rotation: -3.5, paper: 'goldenrod' },
  render: (args) => (
    <PaperSheet height={0}>
      <div style={{ padding: '6% 8%', display: 'flex', alignItems: 'center', gap: '3%' }}>
        {/* The pen on the near side, so the desk to the right of the sheet is left for the stamp. */}
        <div style={{ width: 200, alignSelf: 'flex-end', marginBottom: '16%' }}>
          <Pen kind="ballpoint" ink="#1c2a56" rotation={100} />
        </div>
        <div style={{ width: 480, maxWidth: '100%' }}>
          <Contract {...args} />
        </div>
      </div>
    </PaperSheet>
  ),
};
