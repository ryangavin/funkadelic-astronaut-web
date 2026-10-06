import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { expect, waitFor } from 'storybook/test';
import { NYACK_SET } from '../content/liveSet';
import { Site } from './Site';

/** The site, with a callback once it has hydrated: the same tree on the server and in the browser. */
function Probe({ onHydrated }: { onHydrated: () => void }) {
  useEffect(onHydrated, [onHydrated]);
  return <Site />;
}

/**
 * The site as the browser meets it: the build's HTML (rendered here, as scripts/prerender.mjs renders it) taken over
 * by `hydrateRoot`. Storybook runs React's development build, which reports every server/client difference,
 * attributes included, where the production build only reports the ones it must recover from.
 */
function Hydrated() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // A fresh container each time, so a remount never hydrates into a container another root still holds.
    const element = document.createElement('div');
    host.current!.replaceChildren(element);
    const problems: string[] = [];
    const report = console.error;
    console.error = (...args: unknown[]) => {
      problems.push(args.map(String).join(' '));
      report(...args);
    };
    // Rendered as in Node, where there is no visitor to ask: no matchMedia.
    const matchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', { value: undefined, configurable: true, writable: true });
    try {
      element.innerHTML = renderToString(<Probe onHydrated={() => {}} />);
    } finally {
      window.matchMedia = matchMedia;
    }
    const root = hydrateRoot(
      element,
      <Probe
        onHydrated={() => {
          element.dataset.hydrated = '';
          element.dataset.problems = JSON.stringify(problems);
        }}
      />,
      { onRecoverableError: error => problems.push(String(error)) },
    );
    return () => {
      console.error = report;
      // Not synchronously: this runs while React is committing the story's own root.
      queueMicrotask(() => {
        root.unmount();
        element.remove();
      });
    };
  }, []);
  return <div ref={host} />;
}

const meta = {
  title: 'Site/Hydration',
  component: Hydrated,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Hydrated>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Reads what hydration reported once it is done. */
const hydratesCleanly: Story['play'] = async ({ canvasElement }) => {
  const host = canvasElement.firstElementChild!.firstElementChild as HTMLElement;
  await waitFor(() => expect(host).toHaveAttribute('data-hydrated'));
  await expect(JSON.parse(host.dataset.problems!)).toEqual([]);
};

/** The pre-rendered page and the browser's first render agree, so React takes the page over without a difference. */
export const Hydrates: Story = { play: hydratesCleanly };

/** The same for a visitor who asks for reduced motion: the live set turns to its still only after hydrating. */
export const HydratesWithReducedMotion: Story = {
  beforeEach: () => {
    const original = window.matchMedia;
    window.matchMedia = query => original.call(window, query.includes('prefers-reduced-motion') ? 'all' : query);
    return () => {
      window.matchMedia = original;
    };
  },
  play: async context => {
    await hydratesCleanly(context);
    await expect(context.canvasElement.querySelector('video')).toBeNull();
  },
};

/**
 * The pre-rendered loop shows its poster and downloads nothing before the page has loaded. (The preloads in the
 * head come from the build's server render only, so the e2e tests check those.)
 */
export const PrerendersTheLoopWithoutItsFile: Story = {
  play: async () => {
    const parsed = document.createElement('div');
    parsed.innerHTML = renderToString(<Site />);
    const loop = parsed.querySelector('video');
    await expect(loop).toHaveAttribute('poster', NYACK_SET.poster);
    await expect(loop).not.toHaveAttribute('src');
  },
};
