import type { Meta, StoryObj } from '@storybook/react-vite';
import { KEVIN_SIGNATURE, RYAN_SIGNATURE, SAM_SIGNATURE } from '../sections/BandDossier/signatures';
import '../styles/fonts.css';

/** The three bundled hands, one per member, as the cards use them. */
const BUNDLED = [
  { member: 'Ryan Gavin', font: 'var(--font-signature-ryan)', family: 'Homemade Apple', size: 40 },
  { member: 'Kevin O’Neill', font: 'var(--font-signature-kevin)', family: 'Kristi', size: 68 },
  { member: 'Sam Luba', font: 'var(--font-signature-sam)', family: 'Herr Von Muellerhoff', size: 84 },
];

/** Other open-licensed hands worth trying. Loaded from Google Fonts for comparison only;
    pick one and it gets bundled locally like the others. */
const CANDIDATES: { family: string; size: number }[] = [
  { family: 'Homemade Apple', size: 30 },
  { family: 'Kristi', size: 52 },
  { family: 'Herr Von Muellerhoff', size: 64 },
  { family: 'Zeyada', size: 46 },
  { family: 'Mrs Saint Delafield', size: 54 },
  { family: 'Dr Sugiyama', size: 56 },
  { family: 'Meddon', size: 30 },
  { family: 'Nothing You Could Do', size: 34 },
  { family: 'Reenie Beanie', size: 44 },
  { family: 'Mr Dafoe', size: 44 },
  { family: 'Monsieur La Doulaise', size: 56 },
  { family: 'La Belle Aurore', size: 40 },
  { family: 'Dawning of a New Day', size: 44 },
  { family: 'Cedarville Cursive', size: 34 },
];
const NAMES = ['Ryan Gavin', 'Kevin O’Neill', 'Sam Luba'];
const GOOGLE = `https://fonts.googleapis.com/css2?${CANDIDATES.map(({ family }) => `family=${family.replace(/ /g, '+')}`).join('&')}&display=swap`;

const ink: React.CSSProperties = { color: '#1f1c2b', lineHeight: 1, whiteSpace: 'nowrap', textShadow: '0 0 .5px rgb(31 28 43 / .35)' };

function Sheet({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 40, background: '#ead3a7' }}>
      <div style={{ padding: '28px 36px', borderRadius: 8, background: '#f4ecd8', boxShadow: '2px 4px 0 rgb(18 20 32 / .4)' }}>{children}</div>
    </div>
  );
}

const meta = {
  title: 'Foundations/Styles/Signatures',
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const SCRAWLS = [
  { member: 'Ryan Gavin', path: RYAN_SIGNATURE },
  { member: 'Kevin O’Neill', path: KEVIN_SIGNATURE },
  { member: 'Sam Luba', path: SAM_SIGNATURE },
];

/** The scrawls the cards are signed with: pen strokes, not type. */
export const Scrawls: Story = {
  render: () => (
    <Sheet>
      <div style={{ display: 'grid', gap: 20 }}>
        {SCRAWLS.map(({ member, path }) => (
          <div key={member} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <svg viewBox="0 0 320 110" width="360" role="img" aria-label={`Signed, ${member}`} style={{ color: '#1f1c2b', overflow: 'visible' }}>
              <path d={path} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d={path} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" transform="translate(0.8 0.6)" opacity="0.7" />
            </svg>
            <span style={{ font: '12px sans-serif', color: '#7a6a55' }}>{member}</span>
          </div>
        ))}
      </div>
    </Sheet>
  ),
};

/** Legible hands, for cards that want a readable signature. */
export const Bundled: Story = {
  render: () => (
    <Sheet>
      <div style={{ display: 'grid', gap: 28 }}>
        {BUNDLED.map(({ member, font, family, size }) => (
          <div key={member} style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
            <span style={{ ...ink, fontFamily: font, fontSize: size * 1.4 }}>{member}</span>
            <span style={{ font: '12px sans-serif', color: '#7a6a55' }}>{family}</span>
          </div>
        ))}
      </div>
    </Sheet>
  ),
};

/** Every name in every candidate hand, side by side. Needs a network connection for the unbundled ones. */
export const Candidates: Story = {
  render: () => (
    <>
      <link rel="stylesheet" precedence="default" href={GOOGLE} />
      <Sheet>
        <div style={{ display: 'grid', gridTemplateColumns: '160px repeat(3, 1fr)', alignItems: 'baseline', columnGap: 24, rowGap: 24 }}>
          {CANDIDATES.map(({ family, size }) => (
            <div key={family} style={{ display: 'contents' }}>
              <span style={{ font: '12px sans-serif', color: '#7a6a55' }}>{family}</span>
              {NAMES.map((name) => (
                <span key={name} style={{ ...ink, fontFamily: `'${family}', cursive`, fontSize: size * 1.2 }}>{name}</span>
              ))}
            </div>
          ))}
        </div>
      </Sheet>
    </>
  ),
};
