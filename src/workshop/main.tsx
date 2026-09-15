import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PosterButton } from '../components/PosterButton/PosterButton';
import { SiteNav } from '../components/SiteNav/SiteNav';
import './workshop.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('React workshop root was not found.');
}

createRoot(root).render(
  <StrictMode>
    <>
      <SiteNav status="Development surfaces · local only" />
      <main className="workshop-shell">
        <p className="workshop-kicker">React migration lab</p>
        <h1>Funkadelic Astronaut component workshop</h1>
        <p>
          Build project-owned components here, exercise them in Storybook, and compose them
          into pages with Puck.
        </p>
        <div className="workshop-actions">
          <PosterButton href="/editor/">Open Puck editor</PosterButton>
          <PosterButton href="/" tone="mint">Return to the current site</PosterButton>
        </div>
      </main>
    </>
  </StrictMode>,
);
