import { expect, test } from '@playwright/test';
import { expectNoOverlaps, paletteHexes } from './helpers';

const PALETTE = ['#F8CF60', '#2C5C8D', '#E2A18A', '#18462C', '#E6463B'];
const url = `/?palette=${PALETTE.map(c => c.slice(1)).join('-')}`;

test('save (unnamed), rename, edit colors and delete a palette', async ({ page }) => {
  await page.goto(url);

  // Save without a name -> gets the suggested random name.
  await page.getByRole('button', { name: 'Save Palette' }).click();
  const suggested = await page.getByLabel('Name').getAttribute('placeholder');
  expect(suggested).toMatch(/\w+ \w+/);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('button', { name: 'View', exact: true }).click();

  await expect(page).toHaveURL(/\/saved$/);
  const card = page.locator('article').first();
  await expect(card).toContainText(suggested!);
  await expect(card.getByRole('button', { name: /^Copy #/ })).toHaveCount(5);

  // Rename inline.
  await card.getByRole('button', { name: /^Palette name/ }).click();
  await card.getByRole('textbox', { name: 'Palette name' }).fill('Sunset Brand');
  await page.keyboard.press('Enter');
  await expect(card).toContainText('Sunset Brand');

  // Edit a color in the editor dialog.
  await card.getByRole('button', { name: 'Edit colors' }).click();
  const dialog = page.getByRole('dialog');
  expect(await paletteHexes(dialog)).toEqual(PALETTE);
  await dialog.getByRole('button', { name: /^Hex code #F8CF60/ }).click();
  await dialog.getByRole('textbox', { name: 'Hex color code' }).fill('000000');
  await page.keyboard.press('Enter');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(dialog).toBeHidden();
  await expect(card.getByRole('button', { name: 'Copy #000000' })).toBeVisible();

  // Persisted in localStorage.
  await page.reload();
  await expect(page.locator('article').first()).toContainText('Sunset Brand');

  // Delete (with confirmation).
  await page.locator('article').first().getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('No saved palettes yet')).toBeVisible();
});

test('cancelling the editor discards changes', async ({ page }) => {
  await page.goto(url);
  await page.getByRole('button', { name: 'Save Palette' }).click();
  await page.getByLabel('Name').fill('Keep Me');
  await page.keyboard.press('Enter');
  await page.goto('/saved');
  await expect(page.locator('article')).toContainText('Keep Me');

  await page.getByRole('button', { name: 'Edit colors' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Remove color' }).first().click();
  await expect(dialog.locator('.color-column')).toHaveCount(4);
  await expectNoOverlaps(page); // nothing (e.g. a toast) covers the dialog's buttons
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.locator('article').first().getByRole('button', { name: /^Copy #/ })).toHaveCount(5);
});

test('a saved palette opens in the generator', async ({ page }) => {
  await page.goto(url);
  await page.getByRole('button', { name: 'Save Palette' }).click();
  await page.keyboard.press('Enter');
  await page.getByRole('link', { name: 'Saved Palettes' }).click();

  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('menuitem', { name: 'Open in generator' }).click();
  await expect(page).toHaveURL(/\?palette=/);
  expect(await paletteHexes(page)).toEqual(PALETTE);
});
