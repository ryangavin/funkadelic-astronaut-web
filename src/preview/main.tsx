import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Render } from '@puckeditor/core';
import { SiteNav } from '../components/SiteNav/SiteNav';
import { pageConfig, starterPage, type PageData } from '../puck/config';
import { loadPublished, PUBLISHED_STORAGE_KEY } from '../puck/storage';
import '../workshop/workshop.css';

function SavedPreview() {
  const [published, setPublished] = useState<PageData | null>(() => loadPublished());

  useEffect(() => {
    const syncPublishedPage = (event: StorageEvent) => {
      if (event.key === PUBLISHED_STORAGE_KEY) {
        setPublished(loadPublished());
      }
    };

    window.addEventListener('storage', syncPublishedPage);
    return () => window.removeEventListener('storage', syncPublishedPage);
  }, []);

  const status = published
    ? 'Showing the page published in this browser.'
    : 'Nothing published yet; showing the starter page.';

  return (
    <>
      <SiteNav status={status} />
      <Render config={pageConfig} data={published ?? starterPage} />
    </>
  );
}

const root = document.getElementById('root');

if (!root) {
  throw new Error('Saved preview root was not found.');
}

createRoot(root).render(
  <StrictMode>
    <SavedPreview />
  </StrictMode>,
);
