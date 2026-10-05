import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { EPK_NAV_LOOKS, Epk, type EpkNavLook } from './pages/Epk/Epk';

// `?nav=index` (or tabs, ticker) previews another look for the section index while one is being chosen.
const asked = new URLSearchParams(location.search).get('nav');
const nav = EPK_NAV_LOOKS.find(look => look === asked) as EpkNavLook | undefined;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Epk nav={nav} />
  </StrictMode>,
);
