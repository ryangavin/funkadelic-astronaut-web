import React, { type ReactNode } from 'react';

const { Children, Fragment, cloneElement, createElement, isValidElement } = React;

export const GLYPH_CLASS = 'printed-wordmark__glyph';
/** Supplied artwork moves as one print, never its individual paths. */
const PRINTS = new Set(['svg', 'img']);
const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

type HostProps = { children?: ReactNode; className?: string };

/**
 * Every character of the content becomes its own glyph that can move independently,
 * while whitespace still wraps between words. Each text run keeps a visually hidden
 * copy for assistive technology so the split letters are not read one at a time.
 * Text inside supplied markup is split the same way; other components are left as they are.
 */
export function printGlyphs(node: ReactNode): ReactNode {
  if (typeof node === 'string' || typeof node === 'number') return splitText(String(node));
  if (Array.isArray(node)) return Children.map(node, printGlyphs);
  if (!isValidElement<HostProps>(node)) return node;
  if (typeof node.type === 'string' && PRINTS.has(node.type)) {
    return cloneElement(node, { className: [node.props.className, GLYPH_CLASS].filter(Boolean).join(' ') });
  }
  if ((typeof node.type === 'string' || node.type === Fragment) && node.props.children !== undefined) {
    return cloneElement(node, undefined, printGlyphs(node.props.children));
  }
  return node;
}

function splitText(text: string): ReactNode {
  if (!text.trim()) return text;
  const words = text.split(/(\s+)/).filter(Boolean).map((part, index) => /\s/.test(part) ? part
    : createElement('span', { key: index, className: 'printed-wordmark__word', 'aria-hidden': true },
      [...graphemes.segment(part)].map(({ segment }, glyph) => createElement('span', { key: glyph, className: GLYPH_CLASS }, segment))));
  return createElement(Fragment, null, createElement('span', { className: 'printed-wordmark__text' }, text), ...words);
}
