# Local website and Storybook preview

Run `npm run dev` for one browser origin: the live website at `/` and Storybook at `/storybook/`. The launcher starts Storybook internally, then Vite proxies its manager, iframe, assets and websocket connections. Both bind only to localhost. Ctrl-C stops both; a child failure stops its sibling and returns an error. Occupied ports fail instead of silently selecting another port.

Each worktree needs its own dependencies and pair of ports. For example:

```sh
PREVIEW_LABEL="Coordinator" PREVIEW_PORT=4174 STORYBOOK_PORT=6009 npm run dev
PREVIEW_LABEL="Agent · room-study" PREVIEW_PORT=4175 STORYBOOK_PORT=6010 npm run dev
```

The defaults are public port 4173 and internal port 6007. Open only the public port: `/`, `/press-kit.html`, or `/storybook/`. The internal Storybook port is an implementation detail, and its preview uses the public subpath. `PREVIEW_LABEL` prefixes browser titles without replacing the page/story name and survives story navigation. Omit it for ordinary titles. Restart the launcher to change the label or ports.

`npm run storybook` remains an independent root-path Storybook on port 6006. `npm run build`, `npm run build-storybook`, and `npm run preview` keep their previous production behavior; labels are development-only.

The routes `/storybook/`, `/storybook-server-channel`, `/vite-inject-mocker-entry.js`, and `/@id/__x00__virtual:/@storybook/` are reserved by the unified development preview. The last two cover Storybook's root bootstrap imports; other Vite module routes and all website routes stay with the website server. Storybook uses separate websocket paths for its event channel and Vite HMR. The setup uses Storybook's `viteFinal`, `managerHead`, and `previewHead` configuration hooks. A small title observer is needed because Storybook rewrites the manager title after navigation; no proxied HTML response is rewritten.

Lifecycle regression tests use lightweight child-server fixtures to verify signal cleanup and startup failure. Browser checks should include a story change, iframe render, font/media requests and an actual source edit, since a loaded manager alone does not verify its preview or HMR connection.
