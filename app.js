/* Shared top-edge geometry drives both clipping and every colored seam. */
// Ribbon settings use viewport-relative units and leave untouched designs intact.
const ribbonDefaults = {
  listen: { frequency: 1.38, amplitude: 27.4, rotation: 0, x: 0.5, y: 6.3 },
  learn: { frequency: 1, amplitude: 30, rotation: 0, x: 0, y: 0 },
  live: { frequency: 2, amplitude: 28, rotation: 0, x: 0, y: 0 },
};
const ribbonLimits = { frequency: [.25, 4], amplitude: [0, 80], rotation: [-20, 20], x: [-100, 100], y: [-100, 100] };
const ribbonKey = 'fa-ribbons-v1';
let ribbonDraft = {};
function validateRibbons(data) {
  const clean = {};
  for (const id of Object.keys(ribbonDefaults)) {
    if (!data?.[id] || typeof data[id] !== 'object') continue;
    const values = {};
    for (const [key, [min, max]] of Object.entries(ribbonLimits)) {
      const value = data[id][key];
      if (typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max) values[key] = value;
    }
    if (Object.keys(values).length) clean[id] = values;
  }
  return clean;
}
try { ribbonDraft = validateRibbons(JSON.parse(localStorage.getItem(ribbonKey))); } catch {}
function customRibbon(id, width, height) {
  const v = { ...ribbonDefaults[id], ...ribbonDraft[id] };
  const phase = id === 'listen' ? .165 : id === 'learn' ? .23 : .1;
  const baseline = id === 'listen' ? 96 / 230 : .5;
  const omega = 2 * Math.PI * v.frequency;
  const tilt = Math.tan(v.rotation * Math.PI / 180);
  const y = x => height * (baseline + v.y / 100 + v.amplitude / 100 * Math.cos(omega * (x / width - phase - v.x / 100))) + tilt * (x - width / 2);
  const slope = x => -height / width * v.amplitude / 100 * omega * Math.sin(omega * (x / width - phase - v.x / 100)) + tilt;
  const point = (x, y) => `${x.toFixed(3)} ${y.toFixed(3)}`;
  const count = Math.max(8, Math.ceil(v.frequency * 8));
  let path = `M ${point(0, y(0))}`;
  for (let i = 0; i < count; i++) {
    const x = i * width / count, end = (i + 1) * width / count, third = (end - x) / 3;
    path += ` C ${point(x + third, y(x) + slope(x) * third)} ${point(end - third, y(end) - slope(end) * third)} ${point(end, y(end))}`;
  }
  return path;
}

const scenes = [...document.querySelectorAll(".scene")];
function shape(section) {
  const w = section.clientWidth,
    h = section.clientHeight,
    wave = parseFloat(getComputedStyle(section.querySelector(".seam")).height) ||
      parseFloat(getComputedStyle(section).getPropertyValue("--wave"));
  const hero = section.dataset.wave === "hero";
  const normalized = section.id === "learn"
      ? "M 0 40 C 200 130 300 100 500 50 C 700 0 800 25 1000 64"
      : "M 0 40 C 160 135 215 -8 355 36 C 500 105 545 112 685 52 C 825 -12 885 86 1000 64";
  const source = hero ? 230 : 120;
  const amplitude = hero ? 1 : Math.min(1, Math.max(.35, w / 760));
  const nums = normalized.match(/[A-Z]|-?\d+(?:\.\d+)?/g);
  let axis = 0;
  const scaled = hero || ribbonDraft[section.id] ? customRibbon(section.id, w, wave) : nums
    .map((t) => {
      if (/[A-Z]/.test(t)) {
        axis = 0;
        return t;
      }
      const vertical = axis++ % 2;
      const baseline = hero ? 45 : 60;
      const value = vertical ? baseline + (+t - baseline) * amplitude : +t;
      return (value * (vertical ? wave / source : w / 1000)).toFixed(3);
    })
    .join(" ");
  section.style.clipPath = `path('${scaled} L ${w} ${h} L 0 ${h} Z')`;
  const svg = section.querySelector(".seam");
  svg.setAttribute("viewBox", `0 0 ${w} ${wave}`);
  const colors = hero
    ? ["#a52837", "#ead3a7", "#121420"]
    : section.id === "learn"
      ? ["#c58930", "#ead3a7", "#a52837"]
      : ["#a52837", "#ead3a7", "#121420"];
  svg.innerHTML = colors.map((color, i) =>
    `<path d="${scaled}" fill="none" stroke="${color}" stroke-width="${(hero ? [44, 30, 20] : [44, 26, 14])[i] * (w < 760 ? .65 : 1)}"/>`
  ).join("");
}
// The editor redraws the same path used by clipping and all ink layers.
if (typeof window !== 'undefined') window.ribbonStudio = {
  defaults: ribbonDefaults, limits: ribbonLimits,
  get: () => JSON.parse(JSON.stringify(ribbonDraft)),
  set(data) {
    ribbonDraft = validateRibbons(data);
    let saved = true;
    try { localStorage.setItem(ribbonKey, JSON.stringify(ribbonDraft)); } catch { saved = false; }
    scenes.forEach(shape);
    return saved;
  },
};
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let queued = false;
function updateParallax() {
  queued = false;
  const travel = innerWidth < 760 ? 14 : 32;
  for (const section of scenes) {
    const r = section.getBoundingClientRect();
    const position =
      (r.top + r.height / 2 - innerHeight / 2) /
      (innerHeight / 2 + r.height / 2);
    section.style.setProperty(
      "--shift",
      `${reduced.matches ? 0 : Math.max(-1, Math.min(1, position)) * travel}px`,
    );
  }
}
function requestParallax() {
  if (!queued) {
    queued = true;
    requestAnimationFrame(updateParallax);
  }
}
new ResizeObserver(() => {
  scenes.forEach(shape);
  requestParallax();
}).observe(document.body);
scenes.forEach(shape);
addEventListener("scroll", requestParallax, { passive: true });
addEventListener("resize", requestParallax);
reduced.addEventListener("change", requestParallax);
requestParallax();
// Source-space face coordinates stay anchored in the clear part of the scene.
const focalPhoto = document.querySelector("#learn .media-plane img");
if (focalPhoto) {
  const focalPoints = {
    "performance.webp": [0.25, 0.075],
    "band-13.webp": [0.335, 0.24],
    "band-22.webp": [0.66, 0.15],
    "band-21.webp": [0.21, 0.33],
  };
  const frame = focalPhoto.closest(".scene");
  function positionFocalPhoto() {
    if (!focalPhoto.naturalWidth) return;
    const [fx, fy] = focalPoints[focalPhoto.src.split("/").pop()] || [.5, .5];
    const w = frame.clientWidth, h = frame.clientHeight;
    const mobile = w <= 760;
    const targetX = w * (mobile ? .44 : .26);
    const targetY = mobile ? 270 : Math.max(220, h * .28);
    const scale = mobile
      ? Math.max(w / focalPhoto.naturalWidth, 520 / focalPhoto.naturalHeight)
      : Math.max(w / focalPhoto.naturalWidth, (h - targetY + 48) / (focalPhoto.naturalHeight * (1 - fy)));
    const width = focalPhoto.naturalWidth * scale, height = focalPhoto.naturalHeight * scale;
    Object.assign(focalPhoto.style, {
      width: `${width}px`, height: `${height}px`,
      left: `${Math.min(0, targetX - fx * width)}px`,
      top: `${Math.min(0, targetY - fy * height)}px`,
    });
  }
  focalPhoto.addEventListener("load", positionFocalPhoto);
  new ResizeObserver(positionFocalPhoto).observe(frame);
  positionFocalPhoto();
}

// One manually selected introduction; photo and copy commit together after decode.
const gallery = document.querySelector("#band-gallery");
if (gallery) {
  const members = [
    {
      name: "Funkadelic Astronaut",
      role: "New Jersey · Funktronica",
      photo: "assets/performance.webp",
      alt: "Funkadelic Astronaut performing together",
      crop: "band",
      paragraphs: [
        "Three friends. One cosmic groove. Funkadelic Astronaut brings keyboards, drums, bass and vocals together in a collision of funk and electronics.",
        "Launched in New Jersey in 2012 by Ryan Gavin and Kevin O’Neill, with Sam Luba joining in 2017. They’ve been taking that sound across the Northeast ever since. Come for the groove. Stay for the ride.",
      ],
    },
    {
      name: "Ryan Gavin",
      role: "Keyboards · Co-founder",
      photo: "assets/band-13.webp",
      alt: "Ryan Gavin playing keyboards at Crossroads",
      crop: "ryan",
      paragraphs: [
        "Ryan co-founded Funkadelic Astronaut in 2012 with high school friend Kevin O’Neill.",
        "He plays keyboards in the New Jersey trio.",
      ],
    },
    {
      name: "Kevin O’Neill",
      role: "Drums · Co-founder",
      photo: "assets/band-22.webp",
      alt: "Kevin O’Neill playing drums at Crossroads",
      crop: "kevin",
      paragraphs: [
        "Kevin co-founded Funkadelic Astronaut in 2012 with high school friend Ryan Gavin.",
        "He plays drums in the New Jersey trio.",
      ],
    },
    {
      name: "Sam Luba",
      role: "Bass & vocals",
      photo: "assets/band-21.webp",
      alt: "Sam Luba singing and playing bass at Crossroads",
      crop: "sam",
      paragraphs: [
        "Sam joined Funkadelic Astronaut in 2017, solidifying the band’s current lineup.",
        "He plays bass and sings alongside Ryan Gavin and Kevin O’Neill.",
      ],
    },
  ];
  const section = document.querySelector("#learn"),
    photo = section.querySelector(".media-plane img");
  const indicators = [...gallery.querySelectorAll("[data-member]")];
  const announcement = document.querySelector("#gallery-status");
  let selected = 0,
    requested = 0,
    version = 0;
  async function selectMember(index) {
    requested = (index + members.length) % members.length;
    const next = requested,
      request = ++version,
      member = members[next];
    gallery.setAttribute("aria-busy", "true");
    try {
      const image = new Image();
      image.src = member.photo;
      await image.decode();
      if (request !== version) return;
      photo.src = member.photo;
      photo.alt = member.alt;
      section.dataset.member = member.crop;
      document.querySelector("#member-role").textContent = member.role;
      document.querySelector("#member-name").textContent = member.name;
      document.querySelector("#member-story").replaceChildren(
        ...member.paragraphs.map((text) => {
          const p = document.createElement("p");
          p.textContent = text;
          return p;
        }),
      );
      document
        .querySelector("#band-slide")
        .setAttribute(
          "aria-label",
          `${next + 1} of ${members.length}: ${member.name}`,
        );
      indicators.forEach((button, i) => {
        if (i === next) button.setAttribute("aria-current", "true");
        else button.removeAttribute("aria-current");
      });
      selected = next;
      announcement.textContent = `${next + 1} of ${members.length}: ${member.name}. ${member.role}.`;
    } catch {
      if (request === version) {
        requested = selected;
        announcement.textContent =
          "That photograph could not load. Please try again.";
      }
    } finally {
      if (request === version) gallery.removeAttribute("aria-busy");
    }
  }
  document
    .querySelector("#previous-member")
    .addEventListener("click", () => selectMember(requested - 1));
  document
    .querySelector("#next-member")
    .addEventListener("click", () => selectMember(requested + 1));
  indicators.forEach((button, i) =>
    button.addEventListener("click", () => selectMember(i)),
  );
  gallery
    .querySelector(".gallery-controls")
    .addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        selectMember(requested + (event.key === "ArrowRight" ? 1 : -1));
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        selectMember(event.key === "Home" ? 0 : members.length - 1);
      }
    });
}
