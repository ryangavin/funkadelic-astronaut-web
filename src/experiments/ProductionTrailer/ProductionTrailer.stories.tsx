import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductionTrailer } from './ProductionTrailer';
const meta = { title: 'Experiments/Production Trailer', component: ProductionTrailer, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof ProductionTrailer>;
export default meta;
export const Backstage: StoryObj<typeof meta> = {};
