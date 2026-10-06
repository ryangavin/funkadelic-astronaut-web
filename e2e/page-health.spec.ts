import { GENRE, HOME } from '@content/band';
import { BOOKING_EMAIL } from '@content/links';
import catalogue from '@content/locales/en.json';
import type { APIRequestContext, Page } from '@playwright/test';
import { BANDCAMP_HREF, BAND_NAME, BOOKING_HREF, EARLIER_RELEASES, FEATURED_RELEASE, LISTEN_HREFS, MEMBERS, memberPart, SOCIAL_HREFS } from './support/content';
import { bringIntoView, escapeRegExp, expect, openSite, settle, STUB_HEADING, test } from './support/fixtures';
import { livePlayer, liveSetButton, recordPlayer } from './support/page';

/** The page as it arrives: it loads cleanly, says what it is, and old addresses still find it. */

test('the press kit loads in English with a title, a main landmark and a page heading', async ({ page }) => {
  await openSite(page);
  await expect(page).toHaveTitle(/\S/);
  // The document's language is read by screen readers and translators; the root element has no role to find it by.
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  // Every built script, stylesheet, font and image it asked for loaded: the error fixture fails on any 4xx/5xx.
});

/** Every URL the page asks for from here on, in order. */
function watchRequests(page: Page) {
  const requested: string[] = [];
  page.on('request', request => requested.push(request.url()));
  return requested;
}

test.describe('what the page downloads', () => {
  test.describe('with no motion preference', () => {
    test.use({ reducedMotion: 'no-preference' });

    test('the whole live set is not downloaded until the visitor presses play', async ({ page }) => {
      const requested = watchRequests(page);
      await openSite(page);
      await settle(page);
      const beforePress = [...requested];

      await bringIntoView(liveSetButton(page));
      await liveSetButton(page).click();
      const player = livePlayer(page);
      await expect(player).toBeVisible();
      const set = new URL((await player.getAttribute('src'))!, page.url()).href;
      expect(beforePress, 'the whole set was asked for before the press').not.toContain(set);
      await expect.poll(() => requested.includes(set), { message: 'the press asks for the whole set' }).toBe(true);
    });
  });

  test.describe('with reduced motion requested', () => {
    test.use({ reducedMotion: 'reduce' });

    test('the page asks for no video at all', async ({ page }) => {
      const videos: string[] = [];
      page.on('request', request => {
        if (request.resourceType() === 'media' || new URL(request.url()).pathname.endsWith('.mp4')) videos.push(request.url());
      });
      await openSite(page);
      await settle(page);
      // Nothing is still on its way that could be a video.
      await page.waitForLoadState('networkidle');
      expect(videos).toEqual([]);
    });
  });

  test('the head asks early for the nameplate font and the first screen images, and each is downloaded once', async ({ page }) => {
    const requested = watchRequests(page);
    await openSite(page);
    await settle(page);
    const preloads = await page.locator('head link[rel="preload"]').evaluateAll(links =>
      links.map(link => ({ href: (link as HTMLLinkElement).href, as: link.getAttribute('as'), crossOrigin: link.getAttribute('crossorigin') })),
    );
    // The nameplate's font is among them. A font preload must be CORS, as the stylesheet's font requests are, or the
    // browser downloads the font twice.
    const fonts = preloads.filter(preload => preload.as === 'font');
    const nameplateFont = await page.evaluate(() => getComputedStyle(document.querySelector('h1')!).fontFamily.split(',')[0].replace(/['"]/g, '').trim());
    expect(fonts.some(font => decodeURIComponent(font.href).replace(/[\s_-]/g, '').toLowerCase().includes(nameplateFont.replace(/\s/g, '').toLowerCase())), `the ${nameplateFont} font is preloaded`).toBe(true);
    for (const font of fonts) expect(font, font.href).toEqual(expect.objectContaining({ href: expect.stringMatching(/\.woff2$/), crossOrigin: '' }));
    expect(preloads.filter(preload => preload.as === 'image').length).toBeGreaterThanOrEqual(1);
    for (const { href } of preloads) {
      expect(requested.filter(url => url === href), `${href} is downloaded once`).toHaveLength(1);
    }
  });

  test('the record player is mounted once and asks Bandcamp for its player once', async ({ page }) => {
    const frames: string[] = [];
    page.on('frameattached', frame => frames.push(frame.url()));
    const requested = watchRequests(page);
    await openSite(page);
    await settle(page);

    const player = recordPlayer(page, FEATURED_RELEASE.title);
    await expect(player).toHaveCount(1);
    await bringIntoView(player);
    // The (stubbed) player has loaded in the frame: any earlier or second frame would have been asked for by now.
    await expect(player.contentFrame().getByRole('heading', { name: STUB_HEADING })).toBeVisible();
    expect(frames, 'frames attached to the page').toHaveLength(1);
    const asked = requested.filter(url => url.startsWith('https://bandcamp.com/EmbeddedPlayer/'));
    expect(asked).toEqual([await player.getAttribute('src')]);
  });
});

/** The `content` of a `<meta>` or the `href` of a `<link>` in the head; head tags have no role, so they are found by name. */
const meta = (page: Page, attribute: 'name' | 'property', value: string) =>
  page.locator(`head meta[${attribute}="${value}"]`);

/** A `<link>` in the head, by its `rel`. */
const link = (page: Page, rel: string) => page.locator(`head link[rel="${rel}"]`);

/** Where a head `<link>`'s or manifest's relative address points, as a URL on the site under test. */
const onSite = (page: Page, href: string) => new URL(href, page.url()).href;

/**
 * Fetches `url` from the site and checks it is served as an image the browser can decode, as the type it is served
 * with; returns its size in pixels and bytes. (The bytes are handed to the page as a data URL rather than loaded by
 * address, so the test's network interception has no part in it.) An SVG with only a viewBox has no intrinsic size,
 * so callers check only that it decodes.
 */
async function servedImage(page: Page, request: APIRequestContext, url: string) {
  const served = await request.get(url);
  expect(served.status(), `${url} is in the build`).toBe(200);
  const type = served.headers()['content-type'];
  expect(type, `${url} is served as an image`).toMatch(/^image\//);
  const body = await served.body();
  const size = await page.evaluate(async src => {
    const image = new Image();
    image.src = src;
    await image.decode();
    return { width: image.naturalWidth, height: image.naturalHeight };
  }, `data:${type.split(';')[0]};base64,${body.toString('base64')}`);
  return { ...size, bytes: body.length };
}

test('a shared link previews with a title, description, image and canonical address', async ({ page, request }) => {
  await openSite(page);
  const title = await page.title();

  await expect(meta(page, 'name', 'description')).toHaveAttribute('content', /\S/);
  await expect(meta(page, 'property', 'og:type')).toHaveAttribute('content', 'website');
  await expect(meta(page, 'property', 'og:site_name')).toHaveAttribute('content', new RegExp(`^${escapeRegExp(BAND_NAME)}$`, 'i'));
  await expect(meta(page, 'property', 'og:locale')).toHaveAttribute('content', /^en_[A-Z]{2}$/);
  await expect(meta(page, 'property', 'og:title')).toHaveAttribute('content', title);
  await expect(meta(page, 'property', 'og:description')).toHaveAttribute('content', /\S/);

  const canonical = link(page, 'canonical');
  await expect(canonical).toHaveAttribute('href', /^https:\/\//);
  await expect(meta(page, 'property', 'og:url')).toHaveAttribute('content', (await canonical.getAttribute('href'))!);

  // X shows a large image, with its own alt text, and falls back to the og: title, description and image.
  await expect(meta(page, 'name', 'twitter:card')).toHaveAttribute('content', 'summary_large_image');
  await expect(meta(page, 'property', 'og:image:alt')).toHaveAttribute('content', /\S/);
  await expect(meta(page, 'name', 'twitter:image:alt')).toHaveAttribute('content', (await meta(page, 'property', 'og:image:alt').getAttribute('content'))!);

  // The preview image is an absolute URL on the site's own domain; the build serves that file, at the size the head
  // declares, large enough for a large card (1200×630) and well under the platforms' 5 MB limit.
  const image = meta(page, 'property', 'og:image');
  await expect(image).toHaveAttribute('content', new RegExp(`^${escapeRegExp(new URL((await canonical.getAttribute('href'))!).origin)}/\\S+\\.(jpe?g|png|webp)$`));
  const imagePath = new URL((await image.getAttribute('content'))!).pathname;
  const served = await servedImage(page, request, `.${imagePath}`);
  await expect(meta(page, 'property', 'og:image:width')).toHaveAttribute('content', String(served.width));
  await expect(meta(page, 'property', 'og:image:height')).toHaveAttribute('content', String(served.height));
  expect(served.width).toBeGreaterThanOrEqual(1200);
  expect(served.height).toBeGreaterThanOrEqual(630);
  expect(served.bytes).toBeLessThan(5 * 1024 * 1024);
});

test('the site has a favicon and a home-screen icon, served as images at their sizes', async ({ page, request }) => {
  await openSite(page);

  // Browsers ask for /favicon.ico whatever the head says, so it must be there.
  await servedImage(page, request, './favicon.ico');

  const icons = link(page, 'icon');
  await expect(icons.and(page.locator('[type="image/svg+xml"]'))).toHaveCount(1);
  for (const href of await icons.evaluateAll(links => links.map(l => l.getAttribute('href')!))) {
    await servedImage(page, request, onSite(page, href));
  }

  const appleTouchIcon = link(page, 'apple-touch-icon');
  await expect(appleTouchIcon).toHaveCount(1);
  const touch = await servedImage(page, request, onSite(page, (await appleTouchIcon.getAttribute('href'))!));
  expect(touch).toMatchObject({ width: 180, height: 180 });
});

test('the web app manifest names the band and its icons resolve at their sizes', async ({ page, request }) => {
  await openSite(page);

  const manifestLink = link(page, 'manifest');
  await expect(manifestLink).toHaveCount(1);
  const manifestUrl = onSite(page, (await manifestLink.getAttribute('href'))!);
  const served = await request.get(manifestUrl);
  expect(served.status()).toBe(200);
  const manifest = JSON.parse(await served.text());

  expect(manifest.name).toMatch(new RegExp(escapeRegExp(BAND_NAME), 'i'));
  expect(manifest.short_name).toMatch(new RegExp(escapeRegExp(BAND_NAME), 'i'));
  const themeColor = (await meta(page, 'name', 'theme-color').getAttribute('content'))!;
  expect(manifest.theme_color).toBe(themeColor);
  expect(manifest.background_color).toBe(themeColor);

  const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
  expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
  for (const icon of manifest.icons as { src: string; sizes: string }[]) {
    const { width, height } = await servedImage(page, request, new URL(icon.src, manifestUrl).href);
    expect(`${width}x${height}`, icon.src).toBe(icon.sizes);
  }
});

test('search engines read the band, its members and its profiles from the structured data', async ({ page }) => {
  await openSite(page);

  const scripts = page.locator('head script[type="application/ld+json"]');
  await expect(scripts).toHaveCount(1);
  const band = JSON.parse((await scripts.textContent())!);

  expect(band['@context']).toBe('https://schema.org');
  expect(band['@type']).toBe('MusicGroup');
  expect(band.name).toBe(await meta(page, 'property', 'og:site_name').getAttribute('content'));
  expect(band.url).toBe(await link(page, 'canonical').getAttribute('href'));
  expect(band.image).toBe(await meta(page, 'property', 'og:image').getAttribute('content'));
  expect(band.genre).toBe(GENRE);
  expect(band.location.address).toMatchObject({ addressRegion: HOME.region, addressCountry: HOME.country });
  expect(catalogue.pressKit.dateline.since).toContain(`Est. ${band.foundingDate}`);
  // Booking goes to the same address as the page's booking link.
  expect(band.contactPoint).toMatchObject({ contactType: 'booking', email: BOOKING_EMAIL });

  // Every member, by name, with what they play.
  expect(band.member.map((role: { member: { name: string }; roleName: string }) => [role.member.name, role.roleName])).toEqual(
    MEMBERS.map(member => [member.name, memberPart(member.id)]),
  );
  // The band has one identity on the page, and every record is credited to it.
  expect(band['@id']).toBe(new URL('#band', band.url).href);
  expect(band.album).toEqual(
    [FEATURED_RELEASE, ...EARLIER_RELEASES].map(release => expect.objectContaining({
      '@type': 'MusicAlbum',
      name: release.title,
      url: release.href,
      datePublished: release.year,
      byArtist: { '@id': band['@id'] },
    })),
  );
  // Every profile the page links to.
  expect([...band.sameAs].sort()).toEqual([...LISTEN_HREFS, ...SOCIAL_HREFS, BANDCAMP_HREF].map(l => l.href).sort());
});

test('robots.txt allows crawling and points at a sitemap of the home page only', async ({ page, request }) => {
  await openSite(page);
  const home = (await link(page, 'canonical').getAttribute('href'))!;

  const robots = await request.get('./robots.txt');
  expect(robots.status()).toBe(200);
  expect(robots.headers()['content-type']).toMatch(/^text\/plain/);
  const rules = await robots.text();
  expect(rules).toMatch(/^User-agent: \*$/m);
  expect(rules).not.toMatch(/^Disallow: \/\S*/m);
  const sitemapUrl = rules.match(/^Sitemap: (\S+)$/m)?.[1];
  expect(sitemapUrl).toBe(new URL('sitemap.xml', home).href);

  const sitemap = await request.get(`.${new URL(sitemapUrl!).pathname}`);
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()['content-type']).toMatch(/xml/);
  // The redirect stubs and the 404 page stay out of it.
  expect([...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])).toEqual([home]);
});

test('llms.txt introduces the band to language models, with booking and every profile', async ({ request }) => {
  const served = await request.get('./llms.txt');
  expect(served.status()).toBe(200);
  expect(served.headers()['content-type']).toMatch(/^text\/plain/);
  const text = await served.text();

  expect(text).toMatch(new RegExp(`^# ${escapeRegExp(BAND_NAME)}\\n`, 'i'));
  expect(text).toContain(`](${BOOKING_HREF})`);
  for (const { href } of [...SOCIAL_HREFS, ...LISTEN_HREFS, BANDCAMP_HREF]) expect(text).toContain(`](${href})`);
  for (const member of MEMBERS) expect(text).toContain(member.name);
});

// Broken links floating around (a mistyped page, an old path, a link to a section on a page that never existed)
// get GitHub Pages' 404.html, which sends the visitor on to the band. The hash comes along.
for (const [broken, hash] of [
  ['some/broken/path', ''],
  ['epk/', ''],
  ['old/press/kit.html', '#book'],
]) {
  test.describe(() => {
    test.use({ brokenLinks: [`/${broken}`] });

    test(`a visitor following a broken /${broken}${hash} link lands on the band's page`, async ({ page, baseURL }) => {
      await page.goto(`${broken}${hash}`);
      await expect(page).toHaveURL(`${baseURL}${hash}`);
      await expect(page.getByRole('heading', { level: 1, name: BAND_NAME })).toBeVisible();
    });
  });
}

for (const old of ['press-kit.html', 'classic.html']) {
  test(`a visitor following an old ${old} link lands on the press kit`, async ({ page, baseURL }) => {
    await page.goto(old);
    await expect(page).toHaveURL(baseURL!);
    await expect(page.getByRole('main')).toBeVisible();
  });

  test(`an old ${old} link to a section lands on that section`, async ({ page, baseURL }) => {
    await page.goto(`${old}#book`);
    await expect(page).toHaveURL(`${baseURL}#book`);
    await expect(page.getByRole('main')).toBeVisible();
  });
}
