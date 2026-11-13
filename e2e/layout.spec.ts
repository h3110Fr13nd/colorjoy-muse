import { expect, test, type Locator, type Page } from '@playwright/test';
import { column, expectNoOverlaps, FIXTURE_IMAGE, parkPointer } from './helpers';

const PALETTE = 'F8CF60-2C5C8D-E2A18A-18462C-E6463B-777777-AABBCC-112233-FFEE00-00AA88-C04585-91B0E0';
const palette = (n: number) => `/?palette=${PALETTE.split('-').slice(0, n).join('-')}`;

const center = (b: { x: number; y: number; width: number; height: number }) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });

/** Hovers a trigger and checks its tooltip opens right next to it. */
const expectTooltipNextTo = async (page: Page, trigger: Locator, text: string) => {
  await trigger.hover();
  const tooltip = page.locator('[data-radix-popper-content-wrapper]').filter({ hasText: text });
  await expect(tooltip).toBeVisible();
  const t = center((await trigger.boundingBox())!);
  const c = center((await tooltip.boundingBox())!);
  expect(Math.hypot(t.x - c.x, t.y - c.y)).toBeLessThan(60);
  await parkPointer(page);
  await expect(tooltip).toBeHidden();
};

test('tooltips open next to their icon in every column', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(palette(5));
  for (const index of [0, 3]) {
    await expectTooltipNextTo(page, column(page, index).getByRole('button', { name: 'Color picker' }), 'Color picker');
    await expectTooltipNextTo(page, column(page, index).getByRole('button', { name: 'Lock color' }), 'Lock color');
  }
});

for (const width of [320, 768, 1280]) {
  test(`header stays on one row at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ['/', '/image', '/saved']) {
      await page.goto(path);
      const header = page.locator('header');
      expect((await header.boundingBox())!.height).toBeLessThanOrEqual(64);
      await expectNoOverlaps(page);
    }
  });
}

test.describe('no overlapping controls', () => {
  for (const { name, width, height, colors } of [
    { name: 'desktop', width: 1440, height: 900, colors: 5 },
    { name: 'many narrow, short columns', width: 1024, height: 600, colors: 12 },
    { name: 'small phone', width: 320, height: 568, colors: 3 },
  ]) {
    test(`generator: ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto(palette(colors));
      await parkPointer(page);
      await expectNoOverlaps(page);

      // Shades open in the first and last column.
      for (const index of [0, colors - 1]) {
        await column(page, index).scrollIntoViewIfNeeded();
        await column(page, index).getByRole('button', { name: 'View shades' }).click();
        await parkPointer(page);
        await expectNoOverlaps(page);
        await page.keyboard.press('Escape');
      }
    });
  }

  test('image page on a phone, loupe while dragging to the image corner', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/image');
    await page.locator('input[type=file]').setInputFiles(FIXTURE_IMAGE);
    const marker = page.locator('[data-image-stage] button[aria-label^="Color 2"]');
    await expect(marker).toBeVisible();
    await expectNoOverlaps(page);

    const stage = (await page.locator('[data-image-stage]').boundingBox())!;
    const m = center((await marker.boundingBox())!);
    await page.mouse.move(m.x, m.y);
    await page.mouse.down();
    await page.mouse.move(stage.x + stage.width * 0.98, stage.y + stage.height * 0.98, { steps: 6 });
    await expect(page.locator('[data-loupe]')).toBeVisible();
    await expectNoOverlaps(page);

    // The marker stays centred on the pointer while dragging.
    const dragged = center((await marker.boundingBox())!);
    expect(Math.abs(dragged.x - (stage.x + stage.width * 0.98))).toBeLessThan(3);
    await page.mouse.up();
  });
});
