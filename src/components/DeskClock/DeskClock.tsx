import type React from 'react';
import { useEffect, useState } from 'react';
import { SegmentDisplay } from '../Walkman/SegmentDisplay';
import '../../styles/fonts.css';
import '../Walkman/Walkman.css';
import './DeskClock.css';

export const DESK_CLOCK_FINISHES = ['black', 'silver', 'white'] as const;
export type DeskClockFinish = (typeof DESK_CLOCK_FINISHES)[number];

/** The clock on the wall. One function, so a live clock's effect does not restart every render. */
const wallClock = () => new Date();

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** What the display shows for a moment: the hours and minutes, the meridian flag, and the date line. */
export function readout(at: Date, hours: 12 | 24) {
  const h = at.getHours();
  const shown = hours === 12 ? h % 12 || 12 : h;
  const time = `${hours === 12 ? String(shown).padStart(2, ' ') : String(shown).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
  const date = `${DAYS[at.getDay()]} ${MONTHS[at.getMonth()]} ${String(at.getDate()).padStart(2, ' ')}`;
  const meridian = hours === 12 ? (h < 12 ? 'AM' : 'PM') : '';
  return { time, date, meridian, seconds: at.getSeconds() };
}

export type DeskClockProps = {
  /** A twelve-hour face with an AM/PM flag, or twenty-four. */
  hours?: 12 | 24;
  /** The casing. */
  finish?: DeskClockFinish;
  /** Tilt on the desk, in degrees. */
  rotation?: number;
  /** Where the time comes from. Defaults to the clock on the wall; a story can hold it still. */
  now?: () => Date;
  /** Whether it keeps time. Off, it shows `now` once. */
  running?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * A digital desk clock, the wedge-shaped LCD kind, 90 by 70 millimetres,
 * seen from above: the top of the case with its three small buttons, and
 * the face tilted up toward whoever is sitting at the desk, with the hours
 * and minutes in big seven-segment digits, the colon blinking the seconds,
 * the meridian flag, and the day and date on a smaller row. Measured in
 * 720ths of its width. It keeps real time.
 */
export function DeskClock({ hours = 12, finish = 'black', rotation = 0, now = wallClock, running = true, className = '', style }: DeskClockProps) {
  const [at, setAt] = useState(now);
  useEffect(() => {
    if (!running) return;
    setAt(now());
    const timer = window.setInterval(() => setAt(now()), 1000);
    return () => window.clearInterval(timer);
  }, [running, now]);
  const { time, date, meridian, seconds } = readout(at, hours);
  return (
    <div className={`desk-clock ${className}`} data-finish={finish} role="timer" aria-label={`Desk clock: ${[time.trim(), meridian].filter(Boolean).join(' ')}, ${date}`} style={{ '--desk-clock-rotation': `${rotation}deg`, ...style } as React.CSSProperties}>
      <div className="desk-clock__case">
        <div className="desk-clock__top" aria-hidden="true">
          <span className="desk-clock__button" />
          <span className="desk-clock__button" />
          <span className="desk-clock__button" />
        </div>
        <div className="desk-clock__face">
          <div className="desk-clock__lcd" data-blink={running ? (seconds % 2 ? 'off' : 'on') : undefined}>
            <div className="desk-clock__row">
              <span className="desk-clock__flags" aria-hidden="true">
                <span className="desk-clock__flag" data-lit={meridian === 'AM' ? '' : undefined}>AM</span>
                <span className="desk-clock__flag" data-lit={meridian === 'PM' ? '' : undefined}>PM</span>
              </span>
              <SegmentDisplay className="desk-clock__time" text={time} kind="digit" />
            </div>
            <div className="desk-clock__row desk-clock__row--date">
              <SegmentDisplay className="desk-clock__date" text={date} cells={10} />
            </div>
          </div>
          <span className="desk-clock__brand" aria-hidden="true">
            quartz
          </span>
        </div>
      </div>
    </div>
  );
}
