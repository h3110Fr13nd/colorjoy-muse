import { expect, test, type Page } from '@playwright/test';
import { column, FIXTURE_IMAGE, paletteHexes } from './helpers';

const markers = (page: Page) => page.locator('[data-image-stage] button[aria-label^="Color "]');

/** Hex codes shown by the markers, in palette order. */
const markerHexes = async (page: Page) =>
  (await markers(page).evaluateAll(els => els.map(e => e.getAttribute('aria-label') ?? ''))).map(l => l.split(', ')[1]);

const stagePoint = async (page: Page, fx: number, fy: number) => {
  const box = (await page.locator('[data-image-stage]').boundingBox())!;
  return { x: box.x + box.width * fx, y: box.y + box.height * fy };
};

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/image');
  await page.locator('input[type=file]').setInputFiles(FIXTURE_IMAGE);
  await expect(markers(page)).toHaveCount(5);
});

test('extracts a palette with one marker per color, matching the columns', async ({ page }) => {
  const hexes = await paletteHexes(page);
  expect(new Set(hexes).size).toBe(5);
  expect(await markerHexes(page)).toEqual(hexes);
});

test('click adds a color, dragging re-picks it, right-click removes it', async ({ page }) => {
  // Click on the purple mountain.
  const mountain = await stagePoint(page, 0.2, 0.45);
  await page.mouse.click(mountain.x, mountain.y);
  await expect(markers(page)).toHaveCount(6);
  const added = (await paletteHexes(page))[5];

  // Drag the new marker onto the sun: the column updates.
  const marker = (await markers(page).nth(5).boundingBox())!;
  const sun = await stagePoint(page, 0.7, 0.39);
  await page.mouse.move(marker.x + marker.width / 2, marker.y + marker.height / 2);
  await page.mouse.down();
  await page.mouse.move(sun.x, sun.y, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => (await paletteHexes(page))[5]).not.toBe(added);
  expect((await markerHexes(page))[5]).toBe((await paletteHexes(page))[5]);

  // Right-click removes marker and column.
  await markers(page).nth(5).click({ button: 'right' });
  await expect(markers(page)).toHaveCount(5);
  await expect(page.locator('.color-column')).toHaveCount(5);
});

test('generate picks new colors from the image and keeps locked ones', async ({ page }) => {
  const before = await paletteHexes(page);
  await column(page, 0).getByRole('button', { name: 'Lock color' }).click();
  await page.keyboard.press('Space');
  await expect.poll(() => paletteHexes(page)).not.toEqual(before);

  const after = await paletteHexes(page);
  expect(after[0]).toBe(before[0]);
  expect(await markerHexes(page)).toEqual(after);
});

test('hovering a marker highlights its column', async ({ page }) => {
  await markers(page).nth(2).hover();
  await expect(column(page, 2)).toHaveAttribute('style', /box-shadow:[^;]*inset/);
  await expect(column(page, 1)).not.toHaveAttribute('style', /box-shadow:[^;]*inset/);
});

test('a single color can be picked from an image via the column picker', async ({ page }) => {
  await page.goto('/?palette=FFFFFF-000000');
  await column(page, 1).getByRole('button', { name: 'Color picker' }).click();
  await page.getByRole('button', { name: 'From an image…' }).click();

  const dialog = page.getByRole('dialog');
  await dialog.locator('input[type=file]').setInputFiles(FIXTURE_IMAGE);
  const stage = dialog.locator('[data-image-stage]');
  await expect(stage).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Use color' })).toBeDisabled();

  const box = (await stage.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.83, box.y + box.height * 0.81); // the red boat
  const picked = (await dialog.getByRole('button', { name: /^Picked color/ }).getAttribute('aria-label'))!.split(' ').pop();
  await dialog.getByRole('button', { name: 'Use color' }).click();

  await expect(dialog).toBeHidden();
  expect(await paletteHexes(page)).toEqual(['#FFFFFF', picked]);
});
