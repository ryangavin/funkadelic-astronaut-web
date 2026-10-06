import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentProps } from 'react';
import { PaperSheet } from '../PaperSheet/PaperSheet';
import { Pen } from '../../3D/Pen/Pen';
import { CONTRACT_PAPERS, Contract, signatureLength, type ContractSignature } from './Contract';
import { handAt } from './ink';

/** A signature already on the page: the house hand, written at the pace a hand writes it. */
const WRITTEN: ContractSignature = {
  strokes: [Array.from({ length: 96 }, (_, index) => ({ ...handAt(index / 95), t: index * 16 }))],
  signedAt: '2026-09-09T15:12:00.000Z',
};

const meta = {
  title: 'Library/Components/2D/Contract',
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
export const Unsigned: Story = {};

/** Signed on the day and stamped: what the desk hands back once the promoter has taken the deal. */
export const SignedAndStamped: Story = {
  args: { signature: WRITTEN, stamped: true, rotation: 1 },
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
