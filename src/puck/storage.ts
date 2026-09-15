import type { PageData } from './config';

export const DRAFT_STORAGE_KEY = 'funkadelic-astronaut:puck-draft:v1';
export const PUBLISHED_STORAGE_KEY = 'funkadelic-astronaut:puck-published:v1';

function readPage(key: string): PageData | null {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? 'null');

    if (
      value &&
      typeof value === 'object' &&
      'content' in value &&
      Array.isArray(value.content) &&
      'root' in value &&
      value.root &&
      typeof value.root === 'object'
    ) {
      return value as PageData;
    }
  } catch {
    // Ignore malformed or unavailable browser storage and use the starter page.
  }

  return null;
}

function writePage(key: string, data: PageData) {
  window.localStorage.setItem(key, JSON.stringify(data));
}

export const loadDraft = () => readPage(DRAFT_STORAGE_KEY);
export const loadPublished = () => readPage(PUBLISHED_STORAGE_KEY);
export const saveDraft = (data: PageData) => writePage(DRAFT_STORAGE_KEY, data);
export const savePublished = (data: PageData) => writePage(PUBLISHED_STORAGE_KEY, data);
