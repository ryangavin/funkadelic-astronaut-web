import { StrictMode, useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Render } from '@puckeditor/core';
import { pageConfig, type PageData } from '../puck/config';
import { loadPublished, PUBLISHED_STORAGE_KEY } from '../puck/storage';
import '../styles/fonts.css';
import './preview.css';

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

  if (!published?.content.length) {
    return (
      <p className="preview-empty">
        Nothing published yet. <a href="/editor/">Open the Puck editor</a>
      </p>
    );
  }

  return <Render config={pageConfig} data={published} />;
}

const root = document.getElementById('root');

if (!root) {
  throw new Error('Saved preview root was not found.');
}

// Reuse the root across Vite hot reloads instead of creating a second one.
const container = root as HTMLElement & { reactRoot?: Root };
container.reactRoot ??= createRoot(container);
container.reactRoot.render(
  <StrictMode>
    <SavedPreview />
  </StrictMode>,
);
