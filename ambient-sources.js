/* Vite enumerates this project folder at dev refresh/build; no filesystem permission UI. */
const files = import.meta.glob("/assets/ambient/*.{mp4,webm}", { eager: true, query: "?url", import: "default" });
const original = { id: "original-performance-hls", label: "Original full performance · 8:42", type: "hls" };
window.ambientVideoSources = [original, ...Object.entries(files).map(([path, url]) => ({
  id: path.split("/").pop(), label: path.split("/").pop(), url,
})).filter(s => /^[a-z0-9][a-z0-9 ._-]{0,120}\.(mp4|webm)$/i.test(s.id)).sort((a,b) => a.label.localeCompare(b.label))];
window.dispatchEvent(new Event("ambient-sources-ready"));
