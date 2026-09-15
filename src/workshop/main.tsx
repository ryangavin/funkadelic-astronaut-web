import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PosterButton } from '../components/PosterButton/PosterButton';
import './workshop.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('React workshop root was not found.');
}

createRoot(root).render(
  <StrictMode>
    <main className="workshop-shell">
      <p className="workshop-kicker">React migration lab</p>
      <h1>Funkadelic Astronaut component workshop</h1>
      <p>
        The existing site remains live while project-owned React components are built and
        proven here and in Storybook.
      </p>
      <PosterButton href="./index.html">Return to the current site</PosterButton>
    </main>
  </StrictMode>,
);
