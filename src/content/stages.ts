/** Bands they have opened for or shared a bill with, their own favorites among them. */
export const SHARED_STAGES = ['The New Deal', 'Dopapod', 'Kung Fu', 'Consider the Source', 'Space Bacon', 'Solar Circuit'];

/** "A, B and C", as the bios run a list of names. */
export const list = (names: readonly string[]) => `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
