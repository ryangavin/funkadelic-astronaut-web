// Opt-in browser context for the reduced-motion dossier acceptance story.
import base from './vite.config.mts';
import { playwright } from '@vitest/browser-playwright';
export default { ...base, test: { ...base.test, projects: base.test.projects.map(project => ({ ...project, test: { ...project.test, browser: { ...project.test.browser, provider: playwright({ contextOptions: { reducedMotion: 'reduce' } }) } } })) } };
