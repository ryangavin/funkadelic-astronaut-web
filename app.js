/* Shared top-edge geometry drives both clipping and every colored seam. */
// Ribbon settings use viewport-relative units and leave untouched designs intact.
const ribbonDefaults = {
  footer: { frequency: 1.3, amplitude: 15, rotation: 0, x: 0, y: -8 },
  listen: { frequency: 1.38, amplitude: 27.4, rotation: 0, x: 71.5, y: 6.3 },
  learn: { frequency: 0.93, amplitude: 37.3, rotation: 0, x: -51.4, y: 3.9 },
  live: { frequency: 2.28, amplitude: 17.2, rotation: 0, x: -5.3, y: -15.6 },
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
// Browser drafts are restored by the temporary editor, never by production layout.
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
  // Carry stroke ends beyond the paper edge, including the ink filter displacement.
  const bleed = Math.max(32, width * .05);
  const start = -bleed, span = width + 2 * bleed;
  let path = `M ${point(start, y(start))}`;
  for (let i = 0; i < count; i++) {
    const x = start + i * span / count, end = start + (i + 1) * span / count, third = (end - x) / 3;
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
  const scaled = customRibbon(section.id, w, wave);
  section.style.clipPath = `path('${scaled} L ${w} ${h} L 0 ${h} Z')`;
  const svg = section.querySelector(".seam");
  svg.setAttribute("viewBox", `0 0 ${w} ${wave}`);
  const colors = hero
    ? ["#a52837", "#ead3a7", "#121420"]
    : section.id === "learn"
      ? ["#121420", "#ead3a7", "#c58930"]
      : ["#c58930", "#ead3a7", "#121420"];
  svg.innerHTML = colors.map((color, i) =>
    `<path d="${scaled}" fill="none" stroke="${color}" stroke-width="${(hero ? [44, 30, 20] : [44, 26, 14])[i] * (w / 1090)}"/>`
  ).join("");
}
// The editor redraws the same path used by clipping and all ink layers.
if (typeof window !== 'undefined') window.ribbonStudio = {
  defaults: ribbonDefaults, limits: ribbonLimits,
  get: () => JSON.parse(JSON.stringify(ribbonDraft)),
  preview(data) { ribbonDraft = validateRibbons(data); scenes.forEach(shape); },
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
    const isMember = !focalPhoto.src.endsWith("performance.webp");
    const isRyan = focalPhoto.src.endsWith("band-13.webp");
    const targetX = w * (mobile ? (isRyan ? .32 : .62) : (isRyan ? .27 : (isMember ? .74 : .26)));
    const targetY = h * (mobile ? 270 / 760 : 220 / 760);
    const scale = mobile
      ? Math.max(w / focalPhoto.naturalWidth, h / focalPhoto.naturalHeight)
      : Math.max(w / focalPhoto.naturalWidth, h / focalPhoto.naturalHeight, (h - targetY + h * 48 / 760) / (focalPhoto.naturalHeight * (1 - fy)));
    const width = focalPhoto.naturalWidth * scale, height = focalPhoto.naturalHeight * scale;
    Object.assign(focalPhoto.style, {
      width: `${width}px`, height: `${height}px`,
      left: `${Math.max(w - width, Math.min(0, targetX - fx * width))}px`,
      top: `${Math.max(h - height, Math.min(0, targetY - fy * height))}px`,
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
      role: "New Jersey · Future Rock",
      photo: "assets/performance.webp",
      alt: "Funkadelic Astronaut performing together",
      crop: "band",
      paragraphs: [
        "Three friends blending funk and electronics with keyboards, drums, bass and vocals.",
        "Founded in New Jersey in 2012 by Ryan Gavin and Kevin O’Neill, with Sam Luba joining in 2017. Together, they’ve been bringing that sound to stages across the Northeast.",
      ],
    },
    {
      name: "Ryan Gavin",
      role: "Keyboard Wizard",
      photo: "assets/band-13.webp",
      alt: "Ryan Gavin playing keyboards at Crossroads",
      crop: "ryan",
      paragraphs: [
        "Ryan co-founded Funkadelic Astronaut in 2012 with longtime friend Kevin O’Neill.",
        "Blending music and technology, he brings an adventurous touch to the keys—taking chances and helping steer the trio into unexpected territory.",
      ],
    },
    {
      name: "Kevin O’Neill",
      role: "Drums · Co-founder",
      photo: "assets/band-22.webp",
      alt: "Kevin O’Neill playing drums at Crossroads",
      crop: "kevin",
      paragraphs: [
        "A naturally gifted drummer, Kevin has been making music with Ryan since before Funkadelic Astronaut had a name.",
        "Behind the kit since day one, he brings a steady presence to a bond that runs deeper than bandmates—more like brothers.",
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
  const previous = document.querySelector("#previous-member");
  const nextButton = document.querySelector("#next-member");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const movingContent = [photo, document.querySelector("#learn-title"), document.querySelector("#band-slide")];
  let animations = [];
  function slideContent(direction, outgoing) {
    animations.forEach(animation => animation.cancel());
    animations = motion.matches ? [] : movingContent.map(element => element.animate(
      outgoing
        ? [{ transform: "translateX(0)", opacity: 1 }, { transform: `translateX(${-direction * 48}px)`, opacity: 0 }]
        : [{ transform: `translateX(${direction * 72}px)`, opacity: 0 }, { transform: "translateX(0)", opacity: 1 }],
      { duration: outgoing ? 150 : 420, easing: "cubic-bezier(.22,.61,.36,1)", fill: outgoing ? "forwards" : "none" },
    ));
    return Promise.all(animations.map(animation => animation.finished.catch(() => {})));
  }
  function updateArrows() {
    previous.hidden = selected === 0;
    nextButton.hidden = selected === members.length - 1;
    if (document.activeElement === previous && previous.hidden) nextButton.focus();
    if (document.activeElement === nextButton && nextButton.hidden) previous.focus();
  }
  const announcement = document.querySelector("#gallery-status");
  let selected = 0,
    requested = 0,
    version = 0;
  async function selectMember(index) {
    if (index < 0 || index >= members.length || index === requested) return;
    animations.forEach(animation => animation.cancel());
    requested = index;
    const next = requested,
      request = ++version,
      member = members[next];
    gallery.setAttribute("aria-busy", "true");
    try {
      const image = new Image();
      image.src = member.photo;
      await image.decode();
      if (request !== version) return;
      const direction = next > selected ? 1 : -1;
      await slideContent(direction, true);
      if (request !== version) return;
      photo.src = member.photo;
      photo.alt = member.alt;
      section.dataset.member = member.crop;
      document.querySelector("#member-role").textContent = member.role;
      document.querySelector("#member-name").textContent = member.name;
      document.querySelector("#member-name").hidden = member.crop === "band";
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
      selected = next;
      updateArrows();
      slideContent(direction, false);
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
  if (typeof window !== "undefined") window.bandGalleryStudio = {
    select: id => selectMember(members.findIndex(member => member.crop === id)),
    current: () => members[selected].crop,
  };
  updateArrows();
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
