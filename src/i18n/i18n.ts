import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../content/locales/en.json';

/**
 * The copy catalogue, English only. It is not here for translation: it keeps
 * the site's words out of its components, in one file that reads as copy.
 * Resources are bundled, so this initialises synchronously the moment it is
 * imported: the site entry and Storybook's preview import it first, and data
 * modules that need a string at load time import it themselves.
 */
export const resources = { en } as const;

export const defaultNS = 'pressKit';

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    ns: ['band', 'pressKit'],
    defaultNS,
    // React escapes what it renders.
    interpolation: { escapeValue: false },
    initAsync: false,
    returnNull: false,
  });
}

export default i18n;
