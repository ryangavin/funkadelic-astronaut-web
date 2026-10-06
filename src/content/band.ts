/**
 * Facts about the band as data, for what describes them to machines (the
 * site's structured data and llms.txt). The page's own wording of them, such
 * as the dateline, lives in the copy catalogue.
 */

/** Their genre, in their own words. */
export const GENRE = 'Future rock';

/** Where they are from: a state, not a town, since the members come from all over it. */
export const HOME = { name: 'New Jersey', region: 'NJ', country: 'US' } as const;
