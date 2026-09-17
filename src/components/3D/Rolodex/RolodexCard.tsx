import type React from 'react';
import '../../../styles/fonts.css';
import './Rolodex.css';
import { runsOf, wobble, type RolodexEntry } from './wheel';

/**
 * Type set one key at a time: every letter sits a hair off the line and takes
 * its own bite of ribbon. Words are kept whole, so a long name breaks where a
 * typist would have broken it and not in the middle of a word.
 */
function typed(text: string, seed: number) {
  let struck = 0;
  return text.split(/(\s+)/).map((word, place) => {
    if (!word.trim()) return word;
    const letters = Array.from(word).map((letter, mark) => {
      const key = struck + mark;
      return (
        <span
          key={mark}
          className="rolodex-card__type"
          style={
            {
              '--rolodex-hop': wobble(seed * 31 + key),
              '--rolodex-press': (wobble(seed * 17 + key * 7) + 1) / 2,
            } as React.CSSProperties
          }
        >
          {letter}
        </span>
      );
    });
    struck += word.length;
    return (
      <span className="rolodex-card__word" key={place}>
        {letters}
      </span>
    );
  });
}

/** The name across the top, in units of the card's width, and how small it is allowed to get for a long one. */
const NAME_SIZE = 27;
const NAME_MIN = 15;
/** The rules printed on the card, and the room there is for them once the name has had its share. */
const RULE_PITCH = 24;
const RULE_MIN = 12;
const LINES_ROOM = 167;

export type RolodexCardProps = {
  /** What was typed on it: the name, the lines under it, whatever was added later in pen, and any stamp. */
  card: RolodexEntry;
  /** Which card in the file this is, so its type always strikes the same way twice. */
  seed?: number;
  /** How it came to rest on the desk, in degrees. Negative turns it counter-clockwise. */
  rotation?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * One rotary card lying face up on the desk, drawn from straight above: 4
 * inches by 2 5/8 of buff stock, the two V notches it hangs by cut in the
 * bottom edge, the name typed across the top, the detail typed on the printed
 * rules under it, whatever was added afterwards in pen, and any stamp that
 * went across the lot.
 *
 * This is the only honest way to read a card at all. On the wheel it is stood
 * on its edge, and from above there is nothing of it to see but the 4-inch
 * line of its top edge. Take it out and lay it down and it is all there.
 * Sized by its parent.
 */
export function RolodexCard({ card, seed = 0, rotation = 0, className = '', style }: RolodexCardProps) {
  const lines = card.lines ?? [];
  const name = card.name ?? '';
  /* A long name is typed smaller, the way you would have had to, and then it is allowed to wrap. */
  const nameSize = name.length > 24 ? Math.max(NAME_MIN, Math.round((NAME_SIZE * 24) / name.length)) : NAME_SIZE;
  /* The rules close up when there is a lot on the card and never open past the ruling the card was printed with. */
  const pitch = lines.length > 0 ? Math.max(RULE_MIN, Math.min(RULE_PITCH, LINES_ROOM / lines.length)) : RULE_PITCH;
  const vars = {
    '--rolodex-card-rotation': `${rotation}deg`,
    '--rolodex-card-name': nameSize,
    '--rolodex-card-pitch': pitch,
    '--rolodex-card-line': Math.min(17, pitch * 0.68),
    ...style,
  } as React.CSSProperties;
  return (
    <article className={`rolodex-card ${className}`} style={vars} aria-label={`Card: ${name}`}>
      {/* The card throws its own thin shadow, which is why the stock it is cut from is a level in. */}
      <div className="rolodex-card__lift">
        <div className="rolodex-card__stock">
          <div className="rolodex-card__name">{typed(name, seed + 1)}</div>
          <div className="rolodex-card__lines">
            {lines.map((line, place) => (
              <div className="rolodex-card__line" key={place}>
                {runsOf(line).map((run, part) =>
                  run.struck ? (
                    <span className="rolodex-card__struck" key={part}>
                      {typed(run.text, seed + place + 2)}
                    </span>
                  ) : (
                    <span key={part}>{typed(run.text, seed + place + 2)}</span>
                  ),
                )}
              </div>
            ))}
          </div>
          {card.note ? <div className="rolodex-card__note">{card.note}</div> : null}
          {card.stamp ? <div className="rolodex-card__stamp">{card.stamp}</div> : null}
        </div>
      </div>
    </article>
  );
}
