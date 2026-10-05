import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Epk } from './pages/Epk/Epk';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Epk />
  </StrictMode>,
);
