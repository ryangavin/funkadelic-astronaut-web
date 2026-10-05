/* Temporary design handoff model. Never consumed as production defaults. */
(function (root) {
  const scopes = ["all", "desktop", "mobile"],
    members = ["band", "ryan", "kevin", "sam"];
  const ambient = typeof module !== "undefined" ? require("./ambient-treatment.js") : root.AmbientTreatment;
  const fields = {
    ...ambient.fields,
    x: ["Horizontal adjustment · px", -1600, 1600, 1],
    y: ["Vertical adjustment · px", -1600, 1600, 1],
    rotation: ["Rotation adjustment · °", -180, 180, 0.5],
    scale: ["Proportional scale", 0.1, 4, 0.01],
    width: ["Container width · px", 10, 1800, 1],
    size: ["Font size · px / SVG units", 1, 500, 0.5],
    line: ["Line height", 0.5, 3, 0.05],
    paragraph: ["Paragraph spacing · px", 0, 150, 1],
    iconSize: ["Icon size · px", 8, 300, 1],
    spacing: ["Icon spacing · px", 0, 300, 1],
    scaleX: ["Width scale", 0.1, 4, 0.01],
    scaleY: ["Height scale", 0.1, 4, 0.01],
    frequency: ["Frequency · cycles/page", 0.25, 4, 0.01],
    amplitude: ["Amplitude · % ribbon height", 0, 80, 0.1],
    ribbonX: ["Horizontal · % page width", -100, 100, 0.1],
    ribbonY: ["Vertical · % ribbon height", -100, 100, 0.1],
    ribbonRotation: ["Rotation · °", -20, 20, 0.1],
  };
  const move = ["x", "y", "rotation", "scale"],
    type = [...move, "width", "size", "line"];
  const targets = [
    { id: "ambient-video", label: "Ambient video treatment", selector: "#inline-player", ambient: true, fields: Object.keys(ambient.fields) },
    {
      id: "wordmark",
      label: "Whole wordmark",
      selector: ".wordmark",
      fields: [...move, "width", "scaleX", "scaleY"],
    },
    ...["funk", "astro"].map((id) => ({
      id,
      label: id === "funk" ? "FUNKADELIC word" : "ASTRONAUT word",
      selector: `[data-layout-word="${id}"]`,
      fields: [...move, "scaleX", "scaleY"],
      svg: true,
    })),
    {
      id: "astronaut",
      label: "Header astronaut",
      selector: ".astronaut",
      fields: [...move, "width"],
    },
    {
      id: "streaming",
      label: "Streaming icon group",
      selector: ".hero > .streaming-links",
      fields: [...move, "iconSize", "spacing"],
    },
    ...["Apple Music", "Spotify", "YouTube", "Deezer"].map((label, i) => ({
      id: `icon${i}`,
      label: `${label} icon`,
      selector: `.hero > .streaming-links > a:nth-of-type(${i + 1})`,
      fields: [...move, "iconSize"],
    })),
    ...[
      ["socials", ["Instagram", "Facebook", "Bandsintown"]],
      ["music", ["Apple Music", "Spotify", "YouTube", "Deezer", "Bandcamp"]],
    ].flatMap(([group, names]) => [
      {
        id: `footer-${group}`,
        label: `Footer ${group} group`,
        selector: `.launch-footer nav[aria-labelledby="footer-${group}"]`,
        fields: [...move, "iconSize", "spacing"],
        icons: true,
      },
      ...names.map((name, i) => ({
        id: `footer-${group}-${i}`,
        label: `Footer ${name}`,
        selector: `.launch-footer nav[aria-labelledby="footer-${group}"] > a:nth-of-type(${i + 1})`,
        fields: [...move, "iconSize"],
        icons: true,
      })),
    ]),
    {
      id: "heading",
      label: "The Band heading",
      selector: "#learn-title",
      member: "band",
      fields: type,
    },
    ...members.flatMap((member) => [
      ...(member === "band"
        ? []
        : [
            {
              id: `name:${member}`,
              label: `${member} · name`,
              selector: "#member-name",
              member,
              fields: type,
            },
          ]),
      {
        id: `role:${member}`,
        label: `${member} · role`,
        selector: "#member-role",
        member,
        fields: type,
      },
      {
        id: `story:${member}`,
        label: `${member} · biography`,
        selector: "#member-story",
        member,
        fields: [...type, "paragraph"],
      },
    ]),
    ...["listen", "learn", "live", "footer"].map((id) => ({
      id: `ribbon:${id}`,
      label: `Ribbon · ${id}`,
      selector: `#${id} > .seam`,
      ribbon: id,
      fields: [
        "frequency",
        "amplitude",
        "ribbonRotation",
        "ribbonX",
        "ribbonY",
      ],
    })),
    {
      id: "pressTitle",
      label: "Press page title",
      selector: ".press-page h1",
      fields: type,
    },
  ];
  const empty = () => ({ all: {}, desktop: {}, mobile: {} });
  function validate(data) {
    const out = empty();
    for (const s of scopes)
      for (const t of targets) {
        const v = data?.[s]?.[t.id];
        if (!v || typeof v !== "object") continue;
        const values = {};
        for (const f of t.fields) {
          const [, min, max] = fields[f];
          if (min === "source") {
            if (ambient.validate({source: v[f]}).source) values[f] = v[f];
            continue;
          }
          if (min === "color") {
            if (typeof v[f] === "string" && /^#[0-9a-f]{6}$/i.test(v[f])) values[f] = v[f];
            continue;
          }
          if (
            typeof v[f] === "number" &&
            Number.isFinite(v[f]) &&
            v[f] >= min &&
            v[f] <= max
          )
            values[f] = v[f];
        }
        if (Object.keys(values).length) out[s][t.id] = values;
      }
    return out;
  }
  const effective = (data, id, scope) => ({
    ...data?.all?.[id],
    ...(scope === "all" ? {} : data[scope][id]),
  });
  function parse(data) {
    if (
      data?.kind !== "funkadelic-layout-handoff" ||
      data.version !== 1 ||
      !data.draft
    )
      throw Error("Use a Layout studio handoff, version 1.");
    return {
      draft: validate(data.draft),
      legacy: data.legacy || empty(),
      archive: data.archive || {},
      context: data.context || {},
    };
  }
  function migrate(legacy, ribbons) {
    const draft = empty(),
      rest = structuredClone(legacy || empty());
    for (const s of scopes) {
      rest[s] ??= {};
      for (const [old, id] of [
        ["wordmark", "wordmark"],
        ["funk", "funk"],
        ["astro", "astro"],
        ["learn", "heading"],
        ["role", "role:band"],
        ["story", "story:band"],
      ]) {
        const values = rest[s][old];
        if (!values) continue;
        const mapped = {};
        for (const f of [
          "x",
          "y",
          "rotation",
          "scaleX",
          "scaleY",
          "size",
          "line",
        ]) {
          if (!targets.find((t) => t.id === id).fields.includes(f)) continue;
          if (values[f] !== undefined) {
            mapped[f] = values[f];
            delete values[f];
          }
        }
        if (Object.keys(mapped).length) draft[s][id] = mapped;
      }
    }
    for (const [id, v] of Object.entries(ribbons || {}))
      draft.all[`ribbon:${id}`] = {
        frequency: v.frequency,
        amplitude: v.amplitude,
        ribbonX: v.x,
        ribbonY: v.y,
        ribbonRotation: v.rotation,
      };
    return { draft: validate(draft), legacy: rest };
  }
  function history(initial) {
    let value = structuredClone(initial),
      past = [];
    return {
      get: () => structuredClone(value),
      set(next) {
        past.push(value);
        if (past.length > 100) past.shift();
        value = structuredClone(next);
      },
      replace(next) {
        value = structuredClone(next);
      },
      undo() {
        if (past.length) value = past.pop();
        return this.get();
      },
      get canUndo() {
        return !!past.length;
      },
    };
  }
  const api = {
    scopes,
    members,
    fields,
    targets,
    empty,
    validate,
    effective,
    parse,
    migrate,
    history,
  };
  if (typeof module !== "undefined") module.exports = api;
  else root.LayoutStudioCore = api;
})(typeof window === "undefined" ? globalThis : window);
