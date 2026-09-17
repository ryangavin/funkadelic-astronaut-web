/** Match Handheld.css in its 720 × 327 drawing space, normalized for desk relief/shadows. */
const x = (value: number) => value / 720 * 100;
const y = (value: number) => value / 327 * 100;

// Shell: top inset 14, 720 × 313, circular 54-unit corners.
const shell = `M${x(54)} ${y(14)} H${x(666)}
  A${x(54)} ${y(54)} 0 0 1 ${x(720)} ${y(68)} V${y(273)}
  A${x(54)} ${y(54)} 0 0 1 ${x(666)} ${y(327)} H${x(54)}
  A${x(54)} ${y(54)} 0 0 1 0 ${y(273)} V${y(68)}
  A${x(54)} ${y(54)} 0 0 1 ${x(54)} ${y(14)} Z`;

// Shoulders: 150 × 30, inset 46 on each side, with 12-unit top corners.
const shoulder = (left: number) => `M${x(left + 12)} 0 H${x(left + 138)}
  A${x(12)} ${y(12)} 0 0 1 ${x(left + 150)} ${y(12)} V${y(30)}
  H${x(left)} V${y(12)} A${x(12)} ${y(12)} 0 0 1 ${x(left + 12)} 0 Z`;

export const HANDHELD_SILHOUETTE = `${shell} ${shoulder(46)} ${shoulder(524)}`;
