import 'i18next';
import type { defaultNS, resources } from './i18n';

/** Keys are checked against the catalogue: a key it lacks fails `tsc`. */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)['en'];
    returnNull: false;
  }
}
