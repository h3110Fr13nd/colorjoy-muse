import { describe, expect, it } from 'vitest';
import { nameColor } from './colorNames';

describe('nameColor', () => {
  it.each([
    ['#FF0000', 'Red'],
    ['#FFFFFF', 'White'],
    ['#000000', 'Black'],
    ['#808080', 'Gray'],
    ['#008080', 'Teal'],
    ['#9CAF88', 'Sage'],
  ])('names exact matches: %s -> %s', (hex, name) => {
    expect(nameColor(hex)).toBe(name);
  });

  it('does not call yellows "Orange"', () => {
    expect(nameColor('#F8CF60')).not.toMatch(/Orange/);
    expect(nameColor('#FACC15')).not.toMatch(/Orange/);
  });

  it('adds a modifier for loose matches and is case-insensitive', () => {
    expect(nameColor('#ABCDEF')).toMatch(/^(Light|Pale|Dark|Deep|Muted|Vivid) /);
    expect(nameColor('#abcdef')).toBe(nameColor('#ABCDEF'));
  });

  it('gives varied names across the color space', () => {
    const names = new Set<string>();
    for (let r = 0; r < 256; r += 51) for (let g = 0; g < 256; g += 51) for (let b = 0; b < 256; b += 51) {
      names.add(nameColor(`#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`));
    }
    expect(names.size).toBeGreaterThan(120); // out of 216 colors
  });
});
