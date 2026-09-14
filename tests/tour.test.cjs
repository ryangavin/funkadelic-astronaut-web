const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("styles/sections.css", "utf8");
const tour = html.match(/<section\s+class="scene live"[\s\S]+?<\/section>/)?.[0] || "";

test("Tour title is a code-native festival wristband", () => {
  assert.match(tour, /id="live-title"[\s\S]+?class="tour-wristband"/);
  assert.match(tour, /<svg class="wristband-shape"[^>]+viewBox="0 0 720 214"/);
  assert.match(tour, /class="wristband-(?:stock|fold|crease|perf|holes)"/);
  assert.match(tour, /Funkadelic Astronaut · All access/);
  assert.match(tour, /id="wristband-title-curve"[\s\S]+?<text class="wristband-title"[^>]*>[\s\S]*?<textPath href="#wristband-title-curve">TOUR<\/textPath>/);
  assert.match(css, /\.tour-wristband::after[^{]*\{[^}]+repeating-linear-gradient/s);
  assert.match(css, /\.wristband-stock\s*\{[^}]+fill:\s*url\(#wristband-stock-depth\)/s);
  assert.match(css, /\.wristband-rim-bottom\s*\{[^}]+stroke:/s);
});

test("Tour keeps its semantic show table and intentional empty-state path", () => {
  assert.match(tour, /<table class="print-copy tour-schedule"/);
  assert.match(tour, /<caption class="sr-only">Three-day Funkadelic Astronaut tour schedule concept<\/caption>/);
  assert.match(tour, /<thead><tr><th scope="col">Date<\/th><th scope="col">Venue \/ City<\/th><th scope="col">Tickets<\/th><\/tr><\/thead>/);
  assert.match(tour, /<template id="tour-empty-state">[\s\S]*?<tr class="tour-empty-day">[\s\S]*?<td colspan="3">/);
  assert.match(tour, /No upcoming shows announced\. Check back for dates\./);
  assert.match(tour, /href="https:\/\/www\.bandsintown\.com\/a\/6719052-funkadelic-astronaut"/);
  assert.match(tour, /class="tour-header"[\s\S]+?class="tour-follow-link"\s+data-paper-cutout="scrap"\s+data-paper-edge="soft"[\s\S]+?Follow for show announcements/);
  assert.match(css, /\.tour-header\s*\{[^}]+display:\s*grid;[^}]+grid-template-columns:/s);
});

test("Tour preview contains three clearly sourced or labeled festival days", () => {
  assert.equal((tour.match(/<tr class="tour-day" data-show-status=/g) || []).length, 3);
  assert.equal((tour.match(/class="tour-ticket(?: |")/g) || []).length, 3);
  assert.match(tour, /data-show-status="sample"[\s\S]*?Sample date[\s\S]*?Olive’s[\s\S]*?Ticket TBD/);
  assert.match(tour, /data-show-status="verified"[\s\S]*?datetime="2026-09-26"[\s\S]*?Verified event[\s\S]*?Nyack Neighborhood Music &amp; Arts Festival[\s\S]*?5 First Avenue[\s\S]*?6:00 PM/);
  assert.doesNotMatch(tour, /Neighborhood stage/);
  assert.match(tour, /href="https:\/\/www\.instagram\.com\/p\/DdIkEEZRTxT\/"[^>]*>Event details<\/a>/);
  assert.match(tour, /data-show-status="fictional"[\s\S]*?Fictional preview[\s\S]*?Saturn Lanes[\s\S]*?bowling-alley gig/);
});

test("Tour rows become full-day panels with detachable ticket actions", () => {
  assert.match(css, /\.tour-schedule tbody\s*\{[^}]+display:\s*grid/s);
  assert.match(css, /\.tour-schedule tbody > tr\s*\{[^}]+display:\s*grid/s);
  assert.match(css, /\.tour-schedule tbody:has\(> \.tour-day:nth-child\(2\):last-child\)\s*\{[^}]+grid-template-columns:\s*repeat\(2,/s);
  assert.equal((tour.match(/<tr class="tour-day"[^>]+data-paper-cutout="scrap" data-paper-edge="soft"/g) || []).length, 3);
  assert.equal((tour.match(/class="tour-field-label"/g) || []).length, 12);
  for (const label of ["Venue", "City", "Location", "Time"]) {
    assert.equal((tour.match(new RegExp(`class="tour-field-label">${label}<`, "g")) || []).length, 3);
  }
  assert.match(css, /\.tour-schedule tbody > tr > \.paper-cutout\s*\{[^}]+--paper-shadow:[^}]+drop-shadow/s);
  assert.doesNotMatch(css, /\.tour-schedule tbody > tr:nth-child\([^}]+(?:translate|rotate):/s);
  assert.match(css, /\.tour-day > \.tour-show-cell\s*\{[^}]+display:\s*grid;[^}]+grid-template-rows:/s);
  assert.match(css, /\.tour-ticket\s*\{[^}]+clip-path:/s);
  assert.match(css, /\.tour-ticket\s*\{[^}]+width:\s*100%/s);
  assert.match(css, /\.tour-ticket::before\s*\{[^}]+radial-gradient/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]+?\.tour-schedule tbody,[\s\S]+?grid-template-columns:\s*1fr/s);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]+?\.tour-ticket[^}]+transition:\s*none/s);
});
