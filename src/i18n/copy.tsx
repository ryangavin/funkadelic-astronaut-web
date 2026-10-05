import { Fragment, type ReactNode } from 'react';
import en from '../content/locales/en.json';

/**
 * The copy catalogue (src/content/locales/en.json), English only. It is not
 * here for translation: it keeps the site's words out of its components, in
 * one file that reads as copy. `t` reads one entry by its dotted path, which
 * TypeScript checks against the catalogue, so a key it lacks fails `tsc`.
 */
type Catalogue = typeof en;

/** Every dotted path to an entry: a string, or a list of paragraphs. */
type Paths<T> = {
  [K in keyof T & string]: T[K] extends string | readonly string[] ? K : `${K}.${Paths<T[K]>}`;
}[keyof T & string];

/** The entry a path leads to. */
type At<T, P extends string> = P extends `${infer Head}.${infer Rest}`
  ? Head extends keyof T
    ? At<T[Head], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

export type CopyKey = Paths<Catalogue>;

/** Values for an entry's `{{name}}` placeholders. */
export type CopyValues = Record<string, string | number>;

const fill = (text: string, values: CopyValues = {}) =>
  text.replace(/\{\{(\w+)\}\}/g, (placeholder, name: string) => (name in values ? String(values[name]) : placeholder));

/** The catalogue's entry at `key`, with its placeholders filled from `values`; a list comes back a paragraph per item. */
export function t<K extends CopyKey>(key: K, values?: CopyValues): At<Catalogue, K> {
  const entry = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], en) as string | string[];
  return (typeof entry === 'string' ? fill(entry, values) : entry.map(item => fill(item, values))) as At<Catalogue, K>;
}

/** The inline markup an entry may carry, and the element each tag prints as. */
const TAGS = { span: 'span', strong: 'strong', em: 'em' } as const;

/**
 * An entry with inline markup, such as `<strong>blast off</strong>`, printed
 * as React elements (never as HTML). Only the tags in TAGS are read, one level
 * deep; anything else stays text.
 */
export function Copy({ k, values }: { k: CopyKey; values?: CopyValues }) {
  const text = t(k, values);
  if (typeof text !== 'string') throw new Error(`Copy: ${k} is a list, not one entry`);
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(/<(span|strong|em)>(.*?)<\/\1>/g)) {
    const Tag = TAGS[match[1] as keyof typeof TAGS];
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(<Tag key={match.index}>{match[2]}</Tag>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <Fragment>{parts}</Fragment>;
}
