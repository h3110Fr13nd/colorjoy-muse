import { expect, type Locator, type Page } from '@playwright/test';

export const FIXTURE_IMAGE = 'e2e/fixtures/landscape.jpg';

/** Hex codes currently shown in the palette columns (optionally within a container, e.g. a dialog). */
export const paletteHexes = (scope: Page | Locator) =>
  scope.locator('button[aria-label^="Hex code"]').allInnerTexts();

export const column = (scope: Page | Locator, index: number) => scope.locator('.color-column').nth(index);

/** Moves the pointer out of the way (closes tooltips/hover states). */
export const parkPointer = async (page: Page) => {
  const size = page.viewportSize();
  // In steps: Radix keeps hover UI open while the pointer travels toward it and only re-checks on
  // the next pointer move.
  await page.mouse.move(1, (size?.height ?? 600) - 1, { steps: 4 });
};

/**
 * Finds visible controls that are covered by other elements, clipped by an `overflow: hidden`
 * ancestor, or intersecting another button. Returns human-readable issues (empty = OK).
 */
export const findOverlaps = (page: Page) =>
  page.evaluate(() => {
    const describe = (el: Element) => `${el.tagName.toLowerCase()}[${el.getAttribute('aria-label') ?? (el.textContent ?? '').trim().slice(0, 20)}]`;
    const dialogs = document.querySelectorAll('[role="dialog"][data-state="open"]');
    const topDialog = dialogs[dialogs.length - 1];
    const scrollParent = (el: Element) => {
      for (let p = el.parentElement; p; p = p.parentElement) {
        const cs = getComputedStyle(p);
        if (/(auto|scroll)/.test(cs.overflowX + cs.overflowY) && (p.scrollHeight > p.clientHeight + 1 || p.scrollWidth > p.clientWidth + 1)) return p;
      }
      return null;
    };
    const fullyVisible = (el: Element, r: DOMRect) => {
      if (r.top < 0 || r.bottom > innerHeight || r.left < 0 || r.right > innerWidth) return false;
      const sp = scrollParent(el);
      if (!sp) return true;
      const s = sp.getBoundingClientRect();
      return r.top >= s.top - 1 && r.bottom <= s.bottom + 1 && r.left >= s.left - 1 && r.right <= s.right + 1;
    };

    const controls = [...document.querySelectorAll('button, a[href], [role=separator]')]
      .filter(el => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 1 && r.height > 1 && cs.visibility !== 'hidden' && cs.pointerEvents !== 'none';
      })
      .filter(el => !el.closest('[inert]') && !el.closest('[role=tooltip]') && !el.closest('ol[tabindex]'))
      .filter(el => !topDialog || topDialog.contains(el))
      .map(el => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ el, r }) => fullyVisible(el, r));

    const issues: string[] = [];
    for (const { el, r } of controls) {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const cs = getComputedStyle(p);
        if (!/(hidden|clip)/.test(cs.overflowX + cs.overflowY)) continue;
        const q = p.getBoundingClientRect();
        if (Math.max(q.left - r.left, r.right - q.right, q.top - r.top, r.bottom - q.bottom) > 1.5) {
          issues.push(`${describe(el)} is clipped`);
          break;
        }
      }
      for (const [fx, fy] of [[0.5, 0.5], [0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8]]) {
        const hit = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy);
        if (!hit || el === hit || el.contains(hit) || hit.closest('[role=tooltip]')) continue;
        if (el.closest('[data-image-stage]') && hit.closest('[data-image-stage] button')) continue; // markers may stack
        issues.push(`${describe(el)} is covered by ${describe(hit)}`);
        break;
      }
    }
    const buttons = controls.filter(({ el }) => el.tagName === 'BUTTON' && !el.closest('[data-image-stage]'));
    buttons.forEach((a, i) =>
      buttons.slice(i + 1).forEach(b => {
        if (a.el.contains(b.el) || b.el.contains(a.el)) return;
        const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
        const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
        if (w > 1 && h > 1) issues.push(`${describe(a.el)} intersects ${describe(b.el)}`);
      })
    );
    for (const loupe of document.querySelectorAll('[data-loupe]')) {
      const r = loupe.getBoundingClientRect();
      if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) issues.push('loupe is off screen');
    }
    return [...new Set(issues)];
  });

export const expectNoOverlaps = async (page: Page) => {
  expect(await findOverlaps(page)).toEqual([]);
};
