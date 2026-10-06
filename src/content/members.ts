/**
 * The three of them, in the order they are always introduced. What is said
 * about each (their part, photo captions, bio) lives in the copy catalogue,
 * under `band:members.<id>`.
 */
export type MemberId = 'ryan' | 'kevin' | 'sam';

type Member = { id: MemberId; name: string; since: number };

export const MEMBERS = [
  { id: 'ryan', name: 'Ryan Gavin', since: 2012 },
  { id: 'kevin', name: 'Kevin O’Neill', since: 2012 },
  { id: 'sam', name: 'Sam Luba', since: 2017 },
] as const satisfies Member[];
