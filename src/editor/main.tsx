import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Puck } from '@puckeditor/core';
import '@puckeditor/core/puck.css';
import { SiteNav } from '../components/SiteNav/SiteNav';
import { pageConfig, starterPage, type PageData } from '../puck/config';
import { loadDraft, loadPublished, saveDraft, savePublished } from '../puck/storage';
import '../workshop/workshop.css';
import './editor.css';

function Editor() {
  const [initialData] = useState<PageData>(() => loadDraft() ?? loadPublished() ?? starterPage);
  const [status, setStatus] = useState('Drafts auto-save in this browser only. Publish updates Saved preview.');

  const handleChange = (data: PageData) => {
    saveDraft(data);
    setStatus('Draft saved locally. Publish when it is ready for Saved preview.');
  };

  const handlePublish = (data: PageData) => {
    saveDraft(data);
    savePublished(data);
    setStatus(`Published locally at ${new Date().toLocaleTimeString()}.`);
  };

  return (
    <div className="editor-shell">
      <SiteNav status={status} />
      <Puck
        config={pageConfig}
        data={initialData}
        headerTitle="Funkadelic Astronaut page composer"
        headerPath="Local browser draft"
        onChange={handleChange}
        onPublish={handlePublish}
        height="calc(100vh - 4.5rem)"
      />
    </div>
  );
}

const root = document.getElementById('root');

if (!root) {
  throw new Error('Puck editor root was not found.');
}

createRoot(root).render(
  <StrictMode>
    <Editor />
  </StrictMode>,
);
