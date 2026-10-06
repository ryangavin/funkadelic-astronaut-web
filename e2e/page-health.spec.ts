import { BAND_NAME } from './support/content';
import { expect, openSite, test } from './support/fixtures';

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

/** The `content` of a `<meta>` or the `href` of a `<link>` in the head; head tags have no role, so they are found by name. */
const meta = (page: import('@playwright/test').Page, attribute: 'name' | 'property', value: string) =>
  page.locator(`head meta[${attribute}="${value}"]`);

test('a shared link previews with a title, description, image and canonical address', async ({ page, request }) => {
  await openSite(page);
  const title = await page.title();

  await expect(meta(page, 'name', 'description')).toHaveAttribute('content', /\S/);
  await expect(meta(page, 'property', 'og:title')).toHaveAttribute('content', title);
  await expect(meta(page, 'property', 'og:description')).toHaveAttribute('content', /\S/);

  const canonical = page.locator('head link[rel="canonical"]');
  await expect(canonical).toHaveAttribute('href', /^https:\/\//);
  await expect(meta(page, 'property', 'og:url')).toHaveAttribute('content', (await canonical.getAttribute('href'))!);

  // The preview image is an absolute URL on the site's own domain; the build must serve that file.
  const image = meta(page, 'property', 'og:image');
  await expect(image).toHaveAttribute('content', /^https:\/\/\S+\.(jpe?g|png|webp)$/);
  const imagePath = new URL((await image.getAttribute('content'))!).pathname;
  const served = await request.get(`.${imagePath}`);
  expect(served.status(), `${imagePath} is in the build`).toBe(200);
  expect(served.headers()['content-type']).toMatch(/^image\//);
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
