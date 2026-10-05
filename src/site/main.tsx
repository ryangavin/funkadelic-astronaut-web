// The copy catalogue first: the press kit reads every word from it.
import '../i18n/i18n';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PressKit } from './PressKit/PressKit';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PressKit />
  </StrictMode>,
);
