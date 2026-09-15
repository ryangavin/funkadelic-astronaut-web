import type { PageData } from './config';

export const DRAFT_STORAGE_KEY = 'funkadelic-astronaut:puck-draft';
export const PUBLISHED_STORAGE_KEY = 'funkadelic-astronaut:puck-published';

function readPage(key: string): PageData | null {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}

function writePage(key: string, data: PageData) {
  window.localStorage.setItem(key, JSON.stringify(data));
}

export const loadDraft = () => readPage(DRAFT_STORAGE_KEY);
export const loadPublished = () => readPage(PUBLISHED_STORAGE_KEY);
export const saveDraft = (data: PageData) => writePage(DRAFT_STORAGE_KEY, data);
export const savePublished = (data: PageData) => writePage(PUBLISHED_STORAGE_KEY, data);
