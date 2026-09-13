/* One removable editor owns all temporary CSS and ribbon drafts. */
(() => {
  const C = window.LayoutStudioCore;
  if (!C) return;
  for (const id of ["funk", "astro"]) {
    const word = document.querySelector(`.${id}-word`);
    if (word) {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.dataset.layoutWord = id;
      word.before(group);
      group.append(word);
    }
  }
  const targets = C.targets.filter((t) => document.querySelector(t.selector));
  if (!targets.length) return;
  const storageKey = `fa-layout-studio-v1:${location.pathname}`,
    clone = (v) => structuredClone(v);
  const read = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  };
  const archive = {
    typography: read(`fa-typography-v1:${location.pathname}`),
    ribbons: read("fa-ribbons-v1"),
  };
  let state = {
    ...C.migrate(window.legacyTypography?.get(), archive.ribbons),
    archive,
  };
  let storageError = "";
  try {
    const saved = read(storageKey);
    if (saved) state = C.parse(saved);
  } catch (e) {
    state.archive.previousStudio = read(storageKey);
    storageError =
      "An older studio format is preserved in the handoff archive. Legacy typography and ribbons remain available.";
  }
  const history = C.history(state);
  let selected = targets[0],
    scope = "all",
    defaults = false,
    picking = false,
    selecting = false,
    selectionVersion = 0;
  const sheet = document.createElement("style");
  sheet.id = "layout-studio-overrides";
  document.head.append(sheet);
  const lengths = new Map(
    [...document.querySelectorAll(".funk-word, .astro-word")].map((n) => [
      n,
      n.getAttribute("textLength"),
    ]),
  );
  const actualScope = () => (innerWidth <= 760 ? "mobile" : "desktop");
  const rule = (sel, css) =>
    `${sel}{${Object.entries(css)
      .map(([p, v]) => `${p}:${v} !important`)
      .join(";")}}`;
  const selector = (t) =>
    t.member
      ? `${t.member === "band" ? '#learn:is(:not([data-member]),[data-member="band"])' : `#learn[data-member="${t.member}"]`} ${t.selector}`
      : t.selector;
  function apply() {
    sheet.textContent = "";
    for (const [node, original] of lengths) {
      if (original === null) node.removeAttribute("textLength");
      else node.setAttribute("textLength", original);
    }
    const ribbons = {},
      rules = [];
    if (!defaults) {
      for (const r of window.legacyTypography?.rules(state.legacy) || []) {
        const css = rule(r.selector, r.css);
        rules.push(r.media ? `@media ${r.media}{${css}}` : css);
      }
      for (const [node, original] of lengths) {
        const id = node.matches(".funk-word") ? "funk" : "astro",
          v = C.effective(state.legacy, id, actualScope());
        if (v.length !== undefined) node.setAttribute("textLength", v.length);
      }
      // Measure the site's responsive transform without any editor stylesheet.
      const bases = new Map(
        targets.map((t) => [
          t.id,
          getComputedStyle(document.querySelector(t.selector)).transform,
        ]),
      );
      for (const t of targets) {
        const v = C.effective(state.draft, t.id, actualScope());
        if (!Object.keys(v).length) continue;
        if (t.ribbon) {
          const names = {
            ribbonX: "x",
            ribbonY: "y",
            ribbonRotation: "rotation",
          };
          ribbons[t.ribbon] = Object.fromEntries(
            Object.entries(v).map(([k, val]) => [names[k] || k, val]),
          );
          continue;
        }
        const css = {},
          sel = selector(t);
        if (
          ["x", "y", "rotation", "scale", "scaleX", "scaleY"].some(
            (f) => v[f] !== undefined,
          )
        ) {
          if (t.svg) {
            css["transform-box"] = "fill-box";
            css["transform-origin"] = "center";
          }
          const base = bases.get(t.id);
          css.transform = `translate(${v.x || 0}px,${v.y || 0}px) rotate(${v.rotation || 0}deg) scale(${(v.scale || 1) * (v.scaleX || 1)},${(v.scale || 1) * (v.scaleY || 1)}) ${base === "none" ? "" : base}`;
        }
        if (v.width !== undefined) {
          css.width = `${v.width}px`;
          css["max-width"] = "none";
        }
        if (v.size !== undefined) css["font-size"] = `${v.size}px`;
        if (v.line !== undefined) css["line-height"] = v.line;
        if (v.spacing !== undefined) css.gap = `${v.spacing}px`;
        rules.push(rule(sel, css));
        if (v.size !== undefined || v.line !== undefined)
          rules.push(
            rule(`${sel} p`, {
              ...(v.size !== undefined ? { "font-size": `${v.size}px` } : {}),
              ...(v.line !== undefined ? { "line-height": v.line } : {}),
            }),
          );
        if (v.paragraph !== undefined)
          rules.push(
            rule(`${sel} p + p`, { "margin-top": `${v.paragraph}px` }),
          );
        if (v.iconSize !== undefined) {
          rules.push(
            rule(
              `${sel} ${t.icons ? ":is(svg,.streaming-logo)" : ".streaming-logo"}`,
              { width: `${v.iconSize}px`, height: `${v.iconSize}px` },
            ),
          );
          rules.push(
            rule(
              t.id === "streaming" ||
                t.id === "footer-socials" ||
                t.id === "footer-music"
                ? `${sel} > a`
                : sel,
              { width: `${v.iconSize}px`, height: `${v.iconSize}px` },
            ),
          );
        }
      }
    }
    sheet.textContent = rules.join("\n");
    window.ribbonStudio?.preview(ribbons);
    dispatchEvent(new Event("layout-studio-type-change"));
    highlight();
  }
  const host = document.createElement("div");
  host.id = "layout-studio";
  host.style.cssText =
    "position:fixed;inset:0;z-index:10001;pointer-events:none";
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `<style>
  :host{font:13px/1.4 Arial,sans-serif;color:#f2f0e9}*{box-sizing:border-box}[hidden]{display:none!important}
  aside{pointer-events:auto;position:absolute;right:12px;top:12px;width:min(370px,calc(100vw - 24px));max-height:calc(100dvh - 24px);overflow:auto;overscroll-behavior:contain;background:rgb(23 28 37 / var(--opacity,.92));border:1px solid #596375;border-radius:12px;padding:16px;box-shadow:0 12px 40px #0008}
  header{display:flex;justify-content:space-between;align-items:center;cursor:grab;touch-action:none}h2{font-size:18px;margin:0}p,small{color:#c1cbd8}button,input,select,textarea{font:inherit;color:inherit;background:#282f3c;border:1px solid #596375;border-radius:5px;padding:6px;min-width:0}button{cursor:pointer}button:disabled{opacity:.45;cursor:default}:focus-visible{outline:2px solid #cef091;outline-offset:2px}label{display:block;margin:8px 0}select,textarea{width:100%}.inputs{display:grid;grid-template-columns:1fr 86px;gap:8px}.inputs input{width:100%}input[type=range]{padding:0;accent-color:#cef091;min-height:28px}.actions{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}#launcher{pointer-events:auto;position:absolute;right:12px;bottom:12px}#highlight{position:fixed;border:2px dashed #d1ff85;background:#d1ff8510;pointer-events:none}#status{min-height:18px;color:#cef091}textarea{height:120px}#scope-note{display:block} @media print{:host{display:none}}
  </style><div id="highlight" hidden></div><button id="launcher">Layout studio · D</button>
  <aside hidden aria-label="Layout studio"><header><h2 tabindex="0" title="Drag or use arrow keys to move panel">Layout studio</h2><button id="close" aria-label="Close studio">×</button></header>
  <p>Temporary browser draft. Export for later translation into site styles. D toggles · Escape closes.</p>
  <label>Target<select id="target"></select></label><label>Draft scope<select id="scope"><option value="all">Shared</option><option value="desktop">Desktop · above 760px</option><option value="mobile">Mobile · up to 760px</option></select></label><small id="scope-note"></small>
  <div class="actions"><button id="locate">Show target</button><button id="pick" aria-pressed="false">Pick on page</button></div>
  <label><input id="defaults" type="checkbox"> Preview actual site defaults</label><div id="fields"></div>
  <div class="actions" id="nudges"><button data-x="-1" data-y="0" aria-label="Nudge left">←</button><button data-x="0" data-y="-1" aria-label="Nudge up">↑</button><button data-x="0" data-y="1" aria-label="Nudge down">↓</button><button data-x="1" data-y="0" aria-label="Nudge right">→</button></div><small>Arrow buttons move 1 unit; Shift moves 10. Focus Show target for keyboard nudges.</small>
  <div class="actions"><button id="undo">Undo</button><button id="reset">Reset selected scope</button></div>
  <label>Panel opacity<input id="opacity" type="range" min="20" max="100" value="92"></label>
  <div class="actions"><button id="dock">Dock panel</button><button id="copy">Copy handoff</button><button id="export">Export JSON</button><button id="import">Import JSON</button></div>
  <input id="file" type="file" accept="application/json,.json" hidden><textarea id="json" aria-label="Handoff JSON" hidden readonly></textarea><p id="status" role="status"></p></aside>`;
  document.body.append(host);
  const $ = (id) => root.getElementById(id),
    panel = root.querySelector("aside");
  targets.forEach((t) => $("target").add(new Option(t.label, t.id)));
  function values() {
    return C.effective(state.draft, selected.id, scope);
  }
  function fallback(f) {
    if (["scale", "scaleX", "scaleY"].includes(f)) return 1;
    if (selected.ribbon)
      return window.ribbonStudio.defaults[selected.ribbon][
        { ribbonX: "x", ribbonY: "y", ribbonRotation: "rotation" }[f] || f
      ];
    const node = document.querySelector(selected.selector),
      cs = getComputedStyle(node.querySelector("p") || node);
    if (f === "width") return node.getBoundingClientRect().width;
    if (f === "size") return parseFloat(cs.fontSize);
    if (f === "line")
      return parseFloat(cs.lineHeight) / parseFloat(cs.fontSize) || 1.2;
    if (f === "spacing") return parseFloat(cs.gap) || 0;
    if (f === "paragraph") {
      const p = node.querySelector("p + p");
      return p ? parseFloat(getComputedStyle(p).marginTop) : 0;
    }
    if (f === "iconSize")
      return (
        node.querySelector(".streaming-logo, svg")?.getBoundingClientRect()
          .width || 40
      );
    return 0;
  }
  function render() {
    $("fields").replaceChildren();
    const v = values();
    for (const f of selected.fields) {
      const [label, min, max, step] = C.fields[f],
        row = document.createElement("label");
      row.textContent = label;
      const inputs = document.createElement("div");
      inputs.className = "inputs";
      for (const type of ["range", "number"]) {
        const input = document.createElement("input");
        Object.assign(input, {
          type,
          min,
          max,
          step,
          value: v[f] ?? fallback(f),
          disabled: defaults || selecting,
        });
        input.dataset.field = f;
        input.setAttribute(
          "aria-label",
          `${label}${type === "number" ? " precise value" : ""}`,
        );
        let gesture = false;
        input.onfocus = () => {
          gesture = false;
        };
        input.onpointerdown = () => {
          gesture = false;
        };
        input.oninput = () => {
          if (input.value === "") return;
          const n = Number(input.value);
          if (!Number.isFinite(n) || n < min || n > max) {
            status(`Value must be between ${min} and ${max}.`);
            return;
          }
          const next = clone(state);
          next.draft[scope][selected.id] = {
            ...next.draft[scope][selected.id],
            [f]: n,
          };
          next.draft = C.validate(next.draft);
          if (gesture) history.replace(next);
          else history.set(next);
          gesture = true;
          state = history.get();
          apply();
          save();
          for (const peer of inputs.querySelectorAll("input"))
            if (peer !== input) peer.value = n;
          $("undo").disabled = false;
        };
        inputs.append(input);
      }
      row.append(inputs);
      $("fields").append(row);
    }
    $("undo").disabled = !history.canUndo;
    $("reset").disabled = defaults || selecting;
    $("nudges").hidden = !selected.fields.includes("x") && !selected.ribbon;
    $("nudges")
      .querySelectorAll("button")
      .forEach((b) => (b.disabled = defaults || selecting));
    $("scope-note").textContent =
      `Viewing ${actualScope()} at ${innerWidth}px. ${scope !== "all" && scope !== actualScope() ? "This scope is inactive at this viewport." : "Shared values inherit into each viewport scope."}`;
    highlight();
  }
  function status(message) {
    $("status").textContent = message;
  }
  function handoff() {
    return {
      kind: "funkadelic-layout-handoff",
      version: 1,
      purpose:
        "Temporary tuning; translate intended appearance into site code, then remove overrides. Never load as production defaults.",
      page: location.pathname,
      exportedAt: new Date().toISOString(),
      breakpoint: 760,
      viewport: {
        width: innerWidth,
        height: innerHeight,
        dpr: devicePixelRatio,
      },
      ...clone(state),
      targets: targets.map((t) => ({
        id: t.id,
        label: t.label,
        selector: selector(t),
        member: t.member || null,
        units: Object.fromEntries(t.fields.map((f) => [f, C.fields[f][0]])),
        bounds: (() => {
          const r = document.querySelector(t.selector).getBoundingClientRect();
          return {
            x: r.x + scrollX,
            y: r.y + scrollY,
            width: r.width,
            height: r.height,
            visible:
              !t.member ||
              t.member ===
                (document.querySelector("#learn")?.dataset.member || "band"),
          };
        })(),
      })),
    };
  }
  function save() {
    if (!defaults && !selecting) {
      const node = document.querySelector(selected.selector);
      const rect = node.getBoundingClientRect();
      const computed = getComputedStyle(node.querySelector("p") || node);
      state.context ||= {};
      state.context[`${scope}/${selected.id}`] = {
        viewport: { width: innerWidth, height: innerHeight },
        activeScope: actualScope(),
        member: document.querySelector("#learn")?.dataset.member || "band",
        bounds: {
          x: rect.x + scrollX,
          y: rect.y + scrollY,
          width: rect.width,
          height: rect.height,
        },
        typography: {
          fontSize: computed.fontSize,
          lineHeight: computed.lineHeight,
        },
      };
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(handoff()));
      status("Draft saved in this browser.");
    } catch {
      status("Storage unavailable — export to keep this draft.");
    }
  }
  function commit(next) {
    history.set(next);
    state = history.get();
    apply();
    save();
    render();
  }
  function edit(patch) {
    if (defaults || selecting) return;
    const next = clone(state);
    next.draft[scope][selected.id] = {
      ...next.draft[scope][selected.id],
      ...patch,
    };
    next.draft = C.validate(next.draft);
    commit(next);
  }
  function highlight() {
    const mark = $("highlight");
    mark.hidden = panel.hidden || defaults;
    if (mark.hidden) return;
    const r = document.querySelector(selected.selector).getBoundingClientRect();
    Object.assign(mark.style, {
      left: `${r.left}px`,
      top: `${r.top}px`,
      width: `${r.width}px`,
      height: `${r.height}px`,
    });
  }
  async function select(id, locate = false) {
    const requested = targets.find((t) => t.id === id) || selected;
    const version = ++selectionVersion;
    selected = requested;
    $("target").value = requested.id;
    selecting = !!requested.member;
    render();
    if (requested.member) {
      status("Loading selected introduction…");
      await window.bandGalleryStudio?.select(requested.member);
      if (version !== selectionVersion) return;
      if (window.bandGalleryStudio?.current() !== requested.member) {
        status("Selected photo could not load. Retry Show target.");
        // Leave editing disabled until the requested photo and text commit together.
        return;
      }
    }
    selecting = false;
    render();
    if (locate)
      document
        .querySelector(selected.selector)
        .scrollIntoView({ block: "center", behavior: "instant" });
    highlight();
    status("Target ready.");
  }
  $("target").onchange = () => select($("target").value, true);
  $("scope").onchange = () => {
    scope = $("scope").value;
    render();
  };
  $("locate").onclick = () => select(selected.id, true);
  $("defaults").onchange = () => {
    defaults = $("defaults").checked;
    apply();
    render();
    status(
      defaults
        ? "All temporary draft effects disabled."
        : "Draft preview restored.",
    );
  };
  $("reset").onclick = () => {
    const next = clone(state);
    delete next.draft[scope][selected.id];
    commit(next);
  };
  $("undo").onclick = () => {
    state = history.undo();
    apply();
    save();
    render();
  };
  function nudge(x, y, shift) {
    const f = selected.ribbon ? ["ribbonX", "ribbonY"] : ["x", "y"];
    if (!selected.fields.includes(f[0])) return;
    const v = values(),
      factor = shift ? 10 : 1;
    edit({
      [f[0]]: (v[f[0]] ?? fallback(f[0])) + x * factor,
      [f[1]]: (v[f[1]] ?? fallback(f[1])) + y * factor,
    });
  }
  $("nudges").onclick = (e) => {
    const b = e.target.closest("button");
    if (b) nudge(+b.dataset.x, +b.dataset.y, e.shiftKey);
  };
  $("locate").onkeydown = (e) => {
    const d = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[e.key];
    if (d) {
      e.preventDefault();
      nudge(...d, e.shiftKey);
    }
  };
  function pick(on) {
    picking = on;
    $("pick").setAttribute("aria-pressed", on);
    $("pick").textContent = on ? "Click a target…" : "Pick on page";
  }
  $("pick").onclick = () => pick(!picking);
  document.addEventListener(
    "click",
    (e) => {
      if (!picking || e.composedPath().includes(host)) return;
      const matches = targets.filter(
        (t) =>
          (!t.member ||
            t.member ===
              (document.querySelector("#learn")?.dataset.member || "band")) &&
          e.target.closest(t.selector),
      );
      if (!matches.length) return;
      const t = matches.reduce((best, t) =>
        document
          .querySelector(best.selector)
          .contains(document.querySelector(t.selector))
          ? t
          : best,
      );
      e.preventDefault();
      e.stopImmediatePropagation();
      pick(false);
      select(t.id);
    },
    true,
  );
  let previousFocus;
  function toggle(open) {
    panel.hidden = !open;
    $("launcher").hidden = open;
    if (open) {
      previousFocus = document.activeElement;
      render();
      place();
      root.querySelector("h2").focus();
    } else {
      pick(false);
      previousFocus?.focus();
    }
    highlight();
  }
  $("launcher").onclick = () => toggle(true);
  $("close").onclick = () => toggle(false);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) {
      e.preventDefault();
      if (picking) pick(false);
      else toggle(false);
      return;
    }
    if (
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      e.repeat ||
      e
        .composedPath()
        .some(
          (n) =>
            n instanceof Element &&
            (n.matches("input,textarea,select") || n.isContentEditable),
        )
    )
      return;
    if (e.key.toLowerCase() === "d") {
      e.preventDefault();
      toggle(panel.hidden);
    }
  });
  let position = read("fa-layout-panel-v1") || {
      x: null,
      y: null,
      opacity: 92,
    },
    drag;
  function place() {
    position.opacity = Math.max(
      20,
      Math.min(100, Number(position.opacity) || 92),
    );
    panel.style.setProperty("--opacity", position.opacity / 100);
    $("opacity").value = position.opacity;
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
      panel.style.left = "";
      panel.style.top = "";
      panel.style.right = "12px";
      return;
    }
    position.x = Math.max(
      0,
      Math.min(position.x, innerWidth - panel.offsetWidth),
    );
    position.y = Math.max(
      0,
      Math.min(position.y, innerHeight - panel.offsetHeight),
    );
    Object.assign(panel.style, {
      left: `${position.x}px`,
      top: `${position.y}px`,
      right: "auto",
    });
  }
  function savePanel() {
    try {
      localStorage.setItem("fa-layout-panel-v1", JSON.stringify(position));
    } catch {}
  }
  $("opacity").oninput = () => {
    position.opacity = +$("opacity").value;
    place();
    savePanel();
  };
  $("dock").onclick = () => {
    position.x = position.y = null;
    panel.scrollTop = 0;
    place();
    savePanel();
  };
  const handle = root.querySelector("header");
  handle.onpointerdown = (e) => {
    if (e.target.closest("button") || e.button !== 0) return;
    const r = panel.getBoundingClientRect();
    drag = { x: e.clientX - r.left, y: e.clientY - r.top };
    handle.setPointerCapture(e.pointerId);
    e.preventDefault();
  };
  handle.onpointermove = (e) => {
    if (!drag) return;
    position.x = e.clientX - drag.x;
    position.y = e.clientY - drag.y;
    place();
  };
  handle.onpointerup = handle.onpointercancel = () => {
    drag = null;
    savePanel();
  };
  root.querySelector("h2").onkeydown = (e) => {
    const d = {
      ArrowLeft: [-16, 0],
      ArrowRight: [16, 0],
      ArrowUp: [0, -16],
      ArrowDown: [0, 16],
    }[e.key];
    if (!d) return;
    const r = panel.getBoundingClientRect();
    position.x = r.left + d[0];
    position.y = r.top + d[1];
    place();
    savePanel();
    e.preventDefault();
  };
  $("copy").onclick = async () => {
    const json = JSON.stringify(handoff(), null, 2);
    try {
      await navigator.clipboard.writeText(json);
      status("Handoff copied.");
    } catch {
      $("json").hidden = false;
      $("json").value = json;
      $("json").focus();
      $("json").select();
    }
  };
  $("export").onclick = () => {
    const url = URL.createObjectURL(
        new Blob([JSON.stringify(handoff(), null, 2)], {
          type: "application/json",
        }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = "funkadelic-layout-handoff.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $("import").onclick = () => $("file").click();
  $("file").onchange = async () => {
    try {
      const file = $("file").files[0];
      if (!file) return;
      if (file.size > 2000000) throw Error("Handoff is too large.");
      const data = JSON.parse(await file.text());
      if (data.page && data.page !== location.pathname)
        throw Error(
          `Handoff belongs to ${data.page}. Open that page to import it.`,
        );
      commit(C.parse(data));
      status("Handoff imported. Undo restores the previous draft.");
    } catch (e) {
      status(`Import failed: ${e.message}`);
    } finally {
      $("file").value = "";
    }
  };
  new MutationObserver(() => {
    if (selected.member && !selecting) {
      const current = document.querySelector("#learn").dataset.member;
      const next = targets.find(
        (t) => t.id === selected.id.split(":")[0] + ":" + current,
      );
      if (next) {
        selected = next;
        $("target").value = next.id;
      }
    }
    apply();
    render();
  }).observe(document.querySelector("#learn") || document.body, {
    attributes: true,
    attributeFilter: ["data-member"],
  });
  addEventListener("resize", () => {
    apply();
    render();
    if (!panel.hidden) place();
  });
  addEventListener("scroll", highlight, { passive: true });
  document.fonts?.ready.then(() => {
    apply();
    render();
  });
  apply();
  render();
  place();
  status(
    storageError ||
      "Ready. Existing drafts preserved; no site defaults adopted.",
  );
})();
