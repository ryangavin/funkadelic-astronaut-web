import { StrictMode, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Puck } from '@puckeditor/core';
import '@puckeditor/core/puck.css';
import { emptyPage, pageConfig, type PageData } from '../puck/config';
import { loadDraft, loadPublished, saveDraft, savePublished } from '../puck/storage';
import '../styles/fonts.css';
import './editor.css';

function Editor() {
  const [initialData] = useState<PageData>(() => loadDraft() ?? loadPublished() ?? emptyPage);

  const handlePublish = (data: PageData) => {
    saveDraft(data);
    savePublished(data);
  };

  return (
    <Puck
      config={pageConfig}
      data={initialData}
      onChange={saveDraft}
      onPublish={handlePublish}
    />
  );
}

const root = document.getElementById('root');

if (!root) {
  throw new Error('Puck editor root was not found.');
}

// Reuse the root across Vite hot reloads instead of creating a second one.
const container = root as HTMLElement & { reactRoot?: Root };
container.reactRoot ??= createRoot(container);
container.reactRoot.render(
  <StrictMode>
    <Editor />
  </StrictMode>,
);
