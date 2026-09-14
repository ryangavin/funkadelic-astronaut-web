/* Explicit production defaults; the removable studio alone owns persisted drafts. */
(function(root) {
  const defaults = Object.freeze({ source: "original-performance-hls", fps: 10, contrast: 1.08, brightness: 1,
    blackPoint: .025, whitePoint: .975, grain: .32 });
  const fields = {
    source: ["Ambient clip", "source"],
    fps: ["Ambient displayed frames / second", 2, 24, .5],
    contrast: ["Contrast", .7, 1.5, .01],
    brightness: ["Brightness", .7, 1.3, .01],
    blackPoint: ["Shadow threshold", 0, .35, .005],
    whitePoint: ["Highlight threshold", .65, 1, .005],
    grain: ["Paper grain strength", 0, .8, .01],
  };
  function validate(input = {}) {
    return Object.fromEntries(Object.entries(fields).filter(([key, [,min,max]]) =>
      min === "source" ? input[key] === "original-performance-hls" ||
        (typeof input[key] === "string" && /^[a-z0-9][a-z0-9 ._-]{0,120}\.(mp4|webm)$/i.test(input[key])) :
      typeof input[key] === "number" && Number.isFinite(input[key]) && input[key] >= min && input[key] <= max
    ).map(([key]) => [key,input[key]]));
  }
  function transfer(v) {
    const slope = v.contrast * v.brightness / (v.whitePoint - v.blackPoint);
    return { slope, intercept: (.5 - .5*v.contrast)*v.brightness - v.blackPoint*slope };
  }
  const api = { defaults, fields, validate, transfer };
  if (typeof module !== "undefined") module.exports = api;
  else root.AmbientTreatment = api;
})(typeof window === "undefined" ? globalThis : window);
