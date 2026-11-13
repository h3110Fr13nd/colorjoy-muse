import { expect, it } from 'vitest';
import { generatePaletteName } from './paletteNames';

it('generates two-word names and avoids names that are taken', () => {
  const taken = new Set<string>();
  for (let i = 0; i < 50; i++) {
    const name = generatePaletteName(taken);
    expect(name).toMatch(/^\w+ \w+( \d+)?$/);
    expect(taken.has(name)).toBe(false);
    taken.add(name);
  }
});
