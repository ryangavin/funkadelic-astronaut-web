import type React from 'react';
import { Distressed } from '../../foundations/Distressed/Distressed';
import type { PressKitInk } from './inks';
import '../styles/newsprint.css';
import './PressKitBar.css';

/** A headline bar: heavy caps reversed out of a band of one spot ink, as the paper's two big sections are introduced. */
export function PressKitBar({ ink, id, children }: { ink: PressKitInk; id?: string; children: React.ReactNode }) {
  // A spot colour run on the press: multiplied onto the newsprint and worn at the edges, never a flat fill.
  return (
    <Distressed className="epk-print">
      <h2 className="epk-bar epk-headline" data-ink={ink} id={id}>
        {children}
      </h2>
    </Distressed>
  );
}
