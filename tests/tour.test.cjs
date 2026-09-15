const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("styles/sections.css", "utf8");
const cutoutCss = fs.readFileSync("styles/cutout.css", "utf8");
const tour = html.match(/<section\s+class="scene live"[\s\S]+?<\/section>/)?.[0] || "";

test("Tour title is a code-native vintage admission ticket", () => {
  assert.match(tour, /id="live-title"[\s\S]+?class="tour-admission-ticket"/);
  assert.match(tour, /<svg class="tour-ticket-shape"[^>]+viewBox="0 0 720 276"/);
  assert.match(tour, /class="tour-ticket-composition" transform="matrix\(1 -\.012 \.018 1 -1 9\)"/);
  assert.match(tour, /class="tour-ticket-stub tour-ticket-stub-left"[\s\S]+?class="tour-ticket-stub tour-ticket-stub-right"/);
  assert.match(tour, /class="tour-ticket-rail tour-ticket-rail-left"[\s\S]+?class="tour-ticket-rail tour-ticket-rail-right"/);
  assert.match(tour, /FUNKadelic ASTRONAUT[\s\S]+?PRESENTS[\s\S]+?class="tour-ticket-title"[^>]*>TOUR<\/text>/);
  assert.match(tour, /class="tour-ticket-price"[^>]*>\$42\.69<\/text>/);
  assert.match(tour, /class="tour-ticket-season-year"[^>]*>2026<\/text>[\s\S]+?class="tour-ticket-season-label"[^>]*>SEASON<\/text>/);
  assert.match(tour, /class="tour-ticket-subtitle"[^>]*>LIVE · ALL ACCESS<\/text>/);
  assert.match(tour, /class="tour-ticket-location"[^>]*>NORTHEAST \+ BEYOND<\/text>[\s\S]+?class="tour-ticket-detail"[^>]*>2026 DATES BELOW<\/text>/);
  assert.match(tour, /id="tour-ticket-edge-silhouette"[\s\S]+?clipPath id="tour-ticket-edge-clip"[\s\S]+?class="tour-ticket-sheet" clip-path="url\(#tour-ticket-edge-clip\)"/);
  assert.match(tour, /id="tour-ticket-edge-silhouette" d="M20 16 90 15 160 16[^"]+700 251[^"]+19 70Z"/);
  assert.match(tour, /<use class="cutout-offset-edge cutout-offset-edge--bottom-right tour-ticket-offset-edge" href="#tour-ticket-edge-silhouette" \/>[\s\S]+?class="tour-ticket-sheet"/);
  assert.match(tour, /class="tour-ticket-stub-copy tour-ticket-stub-copy-left" transform="translate\(46 219\) rotate\(-90\)" data-safe-area="34 27 38 192"/);
  assert.doesNotMatch(tour, /class="tour-admission-ticket"[^>]+data-paper-cutout|class="tour-admission-ticket"[^>]+data-paper-edge/);
  assert.doesNotMatch(tour, /wristband|wristband-emblem/);
  assert.match(css, /\.tour-ticket-stock\s*\{[^}]+fill:\s*url\(#tour-ticket-paper\)/s);
  assert.match(cutoutCss, /\.cutout-offset-edge\s*\{[^}]+fill:\s*var\(--cutout-edge-color, #121420\);[^}]+translate\(var\(--cutout-edge-offset-x, 2px\), var\(--cutout-edge-offset-y, 2px\)\)[^}]+scale\(var\(--cutout-edge-scale-x, 1\), var\(--cutout-edge-scale-y, 1\)\)[^}]+transform-box:\s*fill-box/s);
  assert.match(cutoutCss, /\.cutout-offset-edge--bottom-right\s*\{[^}]+--cutout-edge-offset-x:\s*\.75px;[^}]+--cutout-edge-offset-y:\s*\.75px;[^}]+--cutout-edge-scale-x:\s*1\.005;[^}]+--cutout-edge-scale-y:\s*1\.012/s);
  assert.match(css, /\.tour-ticket-offset-edge\s*\{[^}]+--cutout-edge-color:\s*#121420/s);
  assert.doesNotMatch(tour, /tour-ticket-outline/);
  assert.doesNotMatch(css, /\.tour-ticket-outline/);
  assert.doesNotMatch(css, /\.tour-admission-ticket > \.paper-cutout/);
  assert.doesNotMatch(css, /\.tour-admission-ticket\s*\{[^}]+(?:box-shadow|filter:|drop-shadow)/s);
  assert.doesNotMatch(css, /\.tour-admission-ticket::(?:before|after)/);
  assert.match(css, /\.tour-ticket-shape\s*\{[^}]+filter:[^}]+drop-shadow[^}]+drop-shadow/s);
  assert.match(css, /\.tour-ticket-fiber-layer\s*\{[^}]+mix-blend-mode:\s*multiply/s);
  assert.match(tour, /id="tour-ticket-weathering"[\s\S]+?id="tour-ticket-age-wash"[\s\S]+?class="tour-ticket-age-wash"[\s\S]+?class="tour-ticket-weathering-layer"/);
  assert.match(css, /\.tour-ticket-weathering-layer\s*\{[^}]+opacity:\s*\.52;[^}]+mix-blend-mode:\s*multiply/s);
  assert.match(css, /\.tour-ticket-rail\s*\{[^}]+fill:\s*#dc5127;[^}]+opacity:\s*\.9;[^}]+filter:\s*url\(#printed-ink\)/s);
  assert.match(css, /\.tour-ticket-star\s*\{[^}]+filter:\s*url\(#printed-ink\)/s);
  assert.match(css, /\.tour-ticket-title\s*\{[^}]+Georgia[^}]+filter:\s*url\(#printed-ink\)/s);
  assert.doesNotMatch(css, /\.tour-ticket-(?:price|detail|location|season-label|season-year|stub-label|stub-stamp|stub-serial)[^{]*\{[^}]+filter:/s);
});

test("Tour keeps its semantic show table and intentional empty-state path", () => {
  assert.match(tour, /<table class="print-copy tour-schedule"/);
  assert.match(tour, /<p class="sr-only" id="tour-schedule-note">Upcoming festival days\. One verified event and two design samples\.<\/p>/);
  assert.doesNotMatch(tour, /class="tour-board-heading"/);
  assert.match(tour, /<caption class="sr-only">Three-day Funkadelic Astronaut tour schedule concept<\/caption>/);
  assert.match(tour, /<thead><tr><th scope="col">Date<\/th><th scope="col">Venue \/ City<\/th><th scope="col">Tickets<\/th><\/tr><\/thead>/);
  assert.match(tour, /<template id="tour-empty-state">[\s\S]*?<tr class="tour-empty-day">[\s\S]*?<td colspan="3">/);
  assert.match(tour, /No upcoming shows announced\. Check back for dates\./);
  assert.match(tour, /href="https:\/\/www\.bandsintown\.com\/a\/6719052-funkadelic-astronaut"/);
  assert.match(tour, /class="tour-header"[\s\S]+?class="tour-follow-link"\s+data-paper-cutout="scrap"\s+data-paper-edge="soft"[\s\S]+?Follow for show announcements/);
  assert.match(css, /\.tour-header\s*\{[^}]+display:\s*grid;[^}]+grid-template-columns:/s);
});

test("Tour preview contains three clearly sourced or labeled festival days", () => {
  assert.equal((tour.match(/<tr class="tour-day tour-pass-(?:artist|ga|vip)" data-show-status=/g) || []).length, 3);
  assert.equal((tour.match(/class="tour-speech-bubble(?: |")/g) || []).length, 3);
  assert.equal((tour.match(/class="tour-action-portrait"/g) || []).length, 3);
  for (const member of ["ryan", "kevin", "sam"]) {
    assert.match(tour, new RegExp(`assets/tour-pass-${member}-cutout\\.png`));
  }
  assert.match(tour, /data-show-status="sample"[\s\S]*?Sample date[\s\S]*?Olive’s[\s\S]*?Ticket TBD/);
  assert.match(tour, /data-show-status="verified"[\s\S]*?datetime="2026-09-26"[\s\S]*?Verified event[\s\S]*?Nyack Neighborhood Music &amp; Arts Festival[\s\S]*?5 First Avenue[\s\S]*?6:00 PM/);
  assert.doesNotMatch(tour, /Neighborhood stage/);
  assert.match(tour, /href="https:\/\/www\.instagram\.com\/p\/DdIkEEZRTxT\/"[^>]*>Event details<\/a>/);
  assert.match(tour, /data-show-status="fictional"[\s\S]*?Fictional preview[\s\S]*?Saturn Lanes[\s\S]*?bowling-alley gig/);
});

test("Tour rows become distinct laminated passes with member portrait speech-bubble actions", () => {
  assert.match(css, /\.tour-schedule tbody\s*\{[^}]+display:\s*grid/s);
  assert.match(css, /\.tour-schedule tbody > tr\s*\{[^}]+display:\s*grid/s);
  assert.match(css, /\.tour-schedule tbody:has\(> \.tour-day:nth-child\(2\):last-child\)\s*\{[^}]+grid-template-columns:\s*repeat\(2,/s);
  assert.match(tour, /class="tour-day tour-pass-artist"[\s\S]+?Artist pass/);
  assert.match(tour, /class="tour-day tour-pass-ga"[\s\S]+?GA pass/);
  assert.match(tour, /class="tour-day tour-pass-vip"[\s\S]+?VIP pass/);
  assert.equal((tour.match(/class="tour-field-label"/g) || []).length, 12);
  for (const label of ["Venue", "City", "Location", "Time"]) {
    assert.equal((tour.match(new RegExp(`class="tour-field-label">${label}<`, "g")) || []).length, 3);
  }
  assert.match(css, /\.tour-schedule tbody > tr\s*\{[^}]+border-radius:[^}]+background:\s*var\(--pass-stock/s);
  assert.match(css, /\.tour-schedule tbody > tr\s*\{[^}]+box-shadow:[^}]+calc\(4 \* var\(--composition-unit\)\)[^}]+calc\(5 \* var\(--composition-unit\)\)[^}]+rgb\(18 20 32 \/ \.38\)[^}]+rgb\(18 20 32 \/ \.12\)[^}]+filter:\s*none/s);
  assert.match(css, /\.tour-schedule tbody > tr::after\s*\{[^}]+linear-gradient[^}]+inset 0 0/s);
  assert.match(css, /\.tour-day::before\s*\{[^}]+background:[^}]+var\(--pass-ink\)[^}]+clip-path:/s);
  assert.match(css, /\.tour-day > \.tour-date-cell::before\s*\{[^}]+border-radius:\s*999px/s);
  assert.match(css, /\.tour-schedule tbody > \.tour-day:nth-child\(1\)\s*\{[^}]+translateY\(calc\(20 \* var\(--composition-unit\)\)\)[^}]+rotate\(-2\.15deg\)/s);
  assert.match(css, /\.tour-schedule tbody > \.tour-day:nth-child\(2\)\s*\{[^}]+translateY\(calc\(-5 \* var\(--composition-unit\)\)\)[^}]+rotate\(\.45deg\)/s);
  assert.match(css, /\.tour-schedule tbody > \.tour-day:nth-child\(3\)\s*\{[^}]+translateY\(calc\(34 \* var\(--composition-unit\)\)\)[^}]+rotate\(1\.35deg\)/s);
  assert.match(css, /\.tour-day > \.tour-show-cell\s*\{[^}]+display:\s*grid;[^}]+grid-template-rows:/s);
  assert.match(css, /\.tour-pass-action\s*\{[^}]+display:\s*flex/s);
  assert.match(css, /\.tour-speech-bubble\s*\{[^}]+border-radius:/s);
  assert.match(css, /\.tour-speech-bubble::before\s*\{[^}]+clip-path:\s*polygon/s);
  assert.match(css, /\.tour-day :is\(p, span, strong, time, a\)\s*\{[^}]+text-shadow:\s*none !important/s);
  assert.match(css, /\.live-content \.tour-city\s*\{[^}]+Caveat/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]+?\.tour-schedule tbody,[\s\S]+?grid-template-columns:\s*1fr/s);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]+?\.tour-day:nth-child\(1\)[^{]*\{[^}]+translateY\(calc\(3 \* var\(--composition-unit\)\)\)[^}]+rotate\(-\.42deg\)[^}]*\}[\s\S]*?\.tour-day:nth-child\(2\)[^{]*\{[^}]+translateY\(calc\(-2 \* var\(--composition-unit\)\)\)[^}]+rotate\(\.14deg\)[^}]*\}[\s\S]*?\.tour-day:nth-child\(3\)[^{]*\{[^}]+translateY\(calc\(6 \* var\(--composition-unit\)\)\)[^}]+rotate\(\.31deg\)/s);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]+?\.tour-speech-bubble[^}]+transition:\s*none/s);
});

test("Tour follow link stays on one line", () => {
  assert.match(css, /\.tour-follow-link\s*\{[^}]+white-space:\s*nowrap/s);
});
