import type { Config, Data } from '@puckeditor/core';
import { PosterButton } from '../components/PosterButton/PosterButton';
import './page.css';

export type PageComponents = {
  HeroBlock: {
    eyebrow: string;
    heading: string;
    body: string;
    tone: 'coral' | 'mint';
  };
  CopyBlock: {
    heading: string;
    body: string;
    align: 'left' | 'center';
  };
  PosterButton: {
    label: string;
    href: string;
    tone: 'coral' | 'mint';
  };
};

export const pageConfig: Config<PageComponents> = {
  categories: {
    layout: {
      title: 'Page sections',
      components: ['HeroBlock', 'CopyBlock'],
    },
    actions: {
      title: 'Actions',
      components: ['PosterButton'],
    },
  },
  components: {
    HeroBlock: {
      label: 'Poster hero',
      fields: {
        eyebrow: { type: 'text', label: 'Eyebrow' },
        heading: { type: 'text', label: 'Heading' },
        body: { type: 'textarea', label: 'Body' },
        tone: {
          type: 'select',
          label: 'Paper tone',
          options: [
            { label: 'Coral', value: 'coral' },
            { label: 'Mint', value: 'mint' },
          ],
        },
      },
      defaultProps: {
        eyebrow: 'New Jersey funktronica',
        heading: 'Funkadelic Astronaut',
        body: 'A project-owned React block, composed with Puck.',
        tone: 'coral',
      },
      render: ({ eyebrow, heading, body, tone }) => (
        <section className={`puck-hero puck-hero--${tone}`}>
          <p className="puck-hero__eyebrow">{eyebrow}</p>
          <h1>{heading}</h1>
          <p className="puck-hero__body">{body}</p>
        </section>
      ),
    },
    CopyBlock: {
      label: 'Copy section',
      fields: {
        heading: { type: 'text', label: 'Heading' },
        body: { type: 'textarea', label: 'Body' },
        align: {
          type: 'radio',
          label: 'Alignment',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
          ],
        },
      },
      defaultProps: {
        heading: 'Build it in the workshop',
        body: 'Every block here stays ordinary React, so Storybook remains the source of truth for component behavior.',
        align: 'center',
      },
      render: ({ heading, body, align }) => (
        <section className={`puck-copy puck-copy--${align}`}>
          <h2>{heading}</h2>
          <p>{body}</p>
        </section>
      ),
    },
    PosterButton: {
      label: 'Poster button',
      fields: {
        label: { type: 'text', label: 'Label' },
        href: { type: 'text', label: 'Link' },
        tone: {
          type: 'select',
          label: 'Tone',
          options: [
            { label: 'Coral', value: 'coral' },
            { label: 'Mint', value: 'mint' },
          ],
        },
      },
      defaultProps: {
        label: 'Book the band',
        href: 'mailto:samluba1@gmail.com?subject=Funkadelic%20Astronaut%20Booking',
        tone: 'mint',
      },
      render: ({ label, href, tone }) => (
        <div className="puck-action">
          <PosterButton href={href} tone={tone}>{label}</PosterButton>
        </div>
      ),
    },
  },
  root: {
    render: ({ children }) => <main className="puck-page">{children}</main>,
  },
};

export type PageData = Data<PageComponents>;

export const starterPage: PageData = {
  root: { props: {} },
  content: [
    {
      type: 'HeroBlock',
      props: {
        id: 'starter-hero',
        eyebrow: 'New Jersey funktronica',
        heading: 'Build the next transmission',
        body: 'Edit this page with the project’s own React blocks, then publish it to the saved preview.',
        tone: 'coral',
      },
    },
    {
      type: 'CopyBlock',
      props: {
        id: 'starter-copy',
        heading: 'The component library is the instrument panel',
        body: 'Puck handles composition while Storybook documents and exercises each reusable part.',
        align: 'center',
      },
    },
    {
      type: 'PosterButton',
      props: {
        id: 'starter-action',
        label: 'Return to the live site',
        href: '/',
        tone: 'mint',
      },
    },
  ],
};
