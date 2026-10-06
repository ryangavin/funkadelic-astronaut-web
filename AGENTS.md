# AGENTS.md

How to work in this repo: where things go, which tests to run, what CI runs and what a review checks. The [README](README.md) explains the project.

## Where things go

| Folder | What it is | Storybook title |
| --- | --- | --- |
| `src/site/` | The public site, funkadelicastronaut.com: `Site.tsx` (the tree), `main.tsx` (hydrates it in the browser), `entry-server.tsx` (renders it at build time), `PressKit/` | **Site / ...** (e.g. Site / Press Kit) |
| `src/experience/` | The desk experience, Storybook only, not deployed: `Arrival/`, `Desk/`, `Poster/`, `sections/`, `experiments/`, `debug/` | **Experience / ...** |
| `src/content/` | Band data as TypeScript (links, members, releases, live set, stages) and `locales/en.json`, the copy catalogue. No CSS, no components. | — |
| `src/components`, `src/behaviors`, `src/foundations`, `src/styles`, `src/geometry` | Shared library | **Library / Components / 2D/...**, **Library / Components / 3D/...**, **Library / Foundations / ...** |
| `legacy/` | The old vanilla-JS poster with its scripts and styles; kept, not deployed, not served by `npm run dev` | — |
| `assets/` | Images, fonts, audio and video; copied whole into `dist/` by `scripts/copy-static-build.cjs` because the site loads some files by fixed `/assets/...` URL | — |
| `e2e/` | Playwright tests of the built site. `e2e/goals/` holds what the site must accomplish, one file per audience (`everyone`, `booking-agents`, `fans`), each test titled as the goal; `navigation`, `layout`, `accessibility` and `page-health` are supporting checks; shared fixtures and role-based locators are in `e2e/support/`; config in `playwright.config.ts`. They import band data as `@content/...` (tsconfig `paths` and Vite `resolve.alias`; `tests/*.cjs` can't use it) | — |
| `docs/` | Design notes; the experience is in `docs/experience.md` | — |

Rules:

1. **Import direction.** `src/site` never imports from `src/experience`. Anything both need goes in `src/content` or the library. Library components should not import from `src/site` or `src/experience` (some library stories borrow experience scenes, such as the desk, for their "On desk" previews).
2. **Copy catalogue.** New user-visible site text goes in `src/content/locales/en.json` and is read with `t('section.key')` or, for inline `<span>`/`<strong>`/`<em>`, `<Copy k="section.key" />` from `src/i18n/copy.tsx`, never written inline in a component. English only, no i18n library; keys are type-checked by `tsc`, so a missing or misspelt key fails the build.
3. **Storybook titles** start with `Site/`, `Experience/` or `Library/` to match the folder the story's component lives in.
4. Nothing new goes in `legacy/`; it is kept for reference only.
5. **The site is pre-rendered.** `npm run build` renders `src/site/Site.tsx` to HTML in Node and writes it into `dist/index.html`'s `#root`; the browser then hydrates it. A site component's first render must be the same on both sides: nothing read from the browser (`window`, `matchMedia`, reduced motion, sizes, `location`) in render or a `useState` initialiser; read it in an effect (`useLayoutEffect` when it must change the page before it is next painted). No `autoplay`, so nothing moves before reduced motion has been asked. A mismatch is logged as a console error, which fails the e2e tests.

## Tests and when to run them

Node is the version in `.nvmrc` (the current Active LTS; `nvm use` picks it up), which CI uses too.

| Command | What it checks | Run it when |
| --- | --- | --- |
| `node --test tests/<file>.test.cjs` | One Node test file | While working, for the area you touched |
| `npx tsc --noEmit` | Types, including copy-catalogue keys | Fast check after TypeScript edits |
| `npm test` | All Node tests in `tests/`: the site/experience boundary, the dev preview, and the experience's pure geometry and maths | Once before pushing |
| `npm run build` | `tsc --noEmit`; the Vite build of the site into `dist/`; `vite build --ssr src/site/entry-server.tsx` into `node_modules/.cache/prerender/` and `scripts/prerender.mjs`, which pre-renders the page into `dist/index.html` (asset URLs match the client build through `experimental.renderBuiltUrl` in `vite.config.mts`); static copy | Once before pushing (it includes the `tsc` check, so skip the separate one) |
| `npm run test:stories` | The site's stories (`src/site/**`) as browser tests in headless Chromium, with their play functions as assertions | Once before pushing site changes |
| `npm run build-storybook` | Storybook builds, every story included | Before pushing story or Storybook config changes |
| `npm run test:e2e` | The released site end to end (`e2e/`, Playwright): `npm run build`, then `playwright test`, which serves `dist/` with `vite preview` on port 4180 (set up in `vite.config.mts` to answer a missing path with `dist/404.html` and status 404, as GitHub Pages does) and checks the site's goals for each audience (the band name up front, booking, socials, hearing and seeing the band, who they are, where to see them) plus in-page tabs, old URLs and broken links, keyboard, axe and reduced motion, the page without JavaScript and hydration without errors, at phone, tablet and desktop sizes in Google Chrome (installed Chrome, not Playwright's Chromium, so the H.264 live set can play). Third-party origins are stubbed. It includes `npm run build`, so skip that one when you run this | Once before pushing changes to the site, `src/content`, `index.html`, `public/` or the build |
| `npx playwright test e2e/<file>.spec.ts --project=desktop` | One e2e file at one size, against the current `dist/` (run `npm run build` first if the site changed) | While working on the e2e tests |

Only the site is tested end to end. The e2e tests check behaviour a visitor can see or do (roles, names, link destinations, what gets mounted, the URL); they never check CSS, class names, layout geometry or exact copy, which the site's stories cover. Their locators are by role, label or text; a site section a test needs to find is a landmark named by its visible heading, so add the accessible name in `src/site` rather than selecting by class or id. The experience and the shared library are unreleased: their stories are visual only by policy, with no play functions, and `vite.config.mts` excludes everything outside `src/site` from `npm run test:stories`. Their only tests are the pure geometry and maths in `tests/`. `legacy/` has no tests.

Run each command once; don't run the full suites in overlapping configurations. `npm run dev` serves the site at `/` and Storybook at `/storybook/`; stop it when you are done.

## CI

- Pull requests (`.github/workflows/ci.yml`): `npm test` and `npm run build`; `npm run build-storybook`; `npm run test:stories`; the E2E tests job, which runs `npm run build` and `npx playwright test` as separate steps and uploads the Playwright report when they fail. CI on the PR is the final check.
- Pushes to `main` (`.github/workflows/pages.yml`): `npm test`, `npm run build`, then deploy `dist/` to GitHub Pages.

## PR review checklist

Real bugs and project rules only, never style:

- Bugs: broken behaviour, wrong logic, regressions, accessibility failures (keyboard, labels, reduced motion), console errors.
- `src/site` importing from `src/experience`.
- User-visible site text written inline instead of in `src/content/locales/en.json`.
- Storybook titles outside `Site/`, `Experience/`, `Library/`, or not matching the folder.
- New site behaviour without a test that would fail without it, or new experience geometry/maths without a Node test.
- A play function on a story outside `src/site`, or a test of the experience other than pure geometry/maths.
- Docs (`README.md`, `AGENTS.md`, `docs/`) left stale by the change.
- Placeholder tour dates or content presented as real.
