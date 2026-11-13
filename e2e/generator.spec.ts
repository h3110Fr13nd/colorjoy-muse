import { expect, test } from '@playwright/test';
import { column, paletteHexes } from './helpers';

const PALETTE = ['#F8CF60', '#2C5C8D', '#E2A18A', '#18462C', '#E6463B'];

test.beforeEach(async ({ page }) => {
  await page.goto(`/?palette=${PALETTE.map(c => c.slice(1)).join('-')}`);
  await expect(page.locator('.color-column')).toHaveCount(5);
});

test('loads a shared palette from the URL', async ({ page }) => {
  expect(await paletteHexes(page)).toEqual(PALETTE);
});

test('locking a color does not regenerate the palette', async ({ page }) => {
  await column(page, 1).getByRole('button', { name: 'Lock color' }).click();
  await page.waitForTimeout(600); // longer than the generate animation
  expect(await paletteHexes(page)).toEqual(PALETTE);
  await expect(column(page, 1).getByRole('button', { name: 'Unlock color' })).toBeVisible();
});

test('spacebar and the Generate button keep locked colors', async ({ page }) => {
  await column(page, 0).getByRole('button', { name: 'Lock color' }).click();

  await page.keyboard.press('Space');
  await expect.poll(() => paletteHexes(page)).not.toEqual(PALETTE);
  expect((await paletteHexes(page))[0]).toBe(PALETTE[0]);

  const afterSpace = await paletteHexes(page);
  await page.getByRole('button', { name: 'Generate' }).click();
  await expect.poll(() => paletteHexes(page)).not.toEqual(afterSpace);
  expect((await paletteHexes(page))[0]).toBe(PALETTE[0]);
});

test('hex codes are editable live, and Escape restores the color', async ({ page }) => {
  const col = column(page, 2);
  await col.getByRole('button', { name: /^Hex code/ }).click();
  const input = page.getByRole('textbox', { name: 'Hex color code' });

  await input.fill('#123456');
  await expect(col).toHaveCSS('background-color', 'rgb(18, 52, 86)');

  await input.fill('zz');
  await expect(input).toHaveAttribute('aria-invalid', 'true');

  await input.press('Escape');
  await expect(col).toHaveCSS('background-color', 'rgb(226, 161, 138)');
  expect((await paletteHexes(page))[2]).toBe(PALETTE[2]);
});

test('shades: pick a darker shade from the column', async ({ page }) => {
  const col = column(page, 1);
  await col.getByRole('button', { name: 'View shades' }).click();
  const shades = col.getByRole('group', { name: 'Shades' });
  await expect(shades.locator('[data-shade]')).toHaveCount(11);
  await expect(shades.locator('[aria-current]')).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await expect(shades).toHaveCount(0);
  const hex = (await paletteHexes(page))[1];
  expect(hex).not.toBe(PALETTE[1]);
});

test('adds and removes colors', async ({ page }) => {
  await page.getByRole('button', { name: 'Add color at end' }).click();
  await expect(page.locator('.color-column')).toHaveCount(6);
  await column(page, 5).getByRole('button', { name: 'Remove color' }).click();
  await expect(page.locator('.color-column')).toHaveCount(5);
  expect(await paletteHexes(page)).toEqual(PALETTE);
});

test('the tips preference survives a reload', async ({ page }) => {
  await expect(page.getByText('to generate new color palettes')).toBeVisible();
  await page.getByRole('button', { name: 'Hide Tips' }).click();
  await expect(page.getByText('to generate new color palettes')).toBeHidden();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Show Tips' })).toBeVisible();
  await expect(page.getByText('to generate new color palettes')).toBeHidden();
});
