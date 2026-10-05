import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PressKit } from './PressKit/PressKit';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PressKit />
  </StrictMode>,
);
