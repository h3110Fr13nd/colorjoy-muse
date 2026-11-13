import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  DARK_TEXT,
  exportPaletteAsURL,
  generateInfluencedPalette,
  generateShades,
  hexToHSL,
  hexToRgbString,
  isLightColor,
  LIGHT_TEXT,
  normalizeHex,
  parsePaletteFromURL,
} from './colorUtils';

describe('normalizeHex', () => {
  it.each([
    ['#abcdef', '#ABCDEF'],
    ['abcdef', '#ABCDEF'],
    ['#abc', '#AABBCC'],
    ['  0f0 ', '#00FF00'],
  ])('normalizes %s -> %s', (input, expected) => {
    expect(normalizeHex(input)).toBe(expected);
  });

  it.each(['', '#12', '#1234', 'xyzxyz', '#abcdefa', 'rgb(0,0,0)'])('rejects %s', input => {
    expect(normalizeHex(input)).toBeNull();
  });
});

describe('palette URLs', () => {
  it('round-trips a palette through a share link', () => {
    const url = exportPaletteAsURL(['#FF0000', '#00FF00']);
    expect(parsePaletteFromURL(new URL(url).search)).toEqual(['#FF0000', '#00FF00']);
  });

  it('drops invalid colors and returns null when nothing is valid', () => {
    expect(parsePaletteFromURL('?palette=ff0000-zzzzzz-0f0')).toEqual(['#FF0000', '#00FF00']);
    expect(parsePaletteFromURL('?palette=nope')).toBeNull();
    expect(parsePaletteFromURL('')).toBeNull();
  });
});

it('formats rgb strings', () => {
  expect(hexToRgbString('#AABBCC')).toBe('rgb(170, 187, 204)');
});

describe('readable text color (WCAG)', () => {
  it('computes the standard contrast ratio extremes', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });

  it('always picks a text color with at least AA contrast (4.5:1)', () => {
    for (let r = 0; r < 256; r += 15) {
      for (let g = 0; g < 256; g += 15) {
        for (let b = 0; b < 256; b += 15) {
          const bg = `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
          const text = isLightColor(bg) ? DARK_TEXT : LIGHT_TEXT;
          expect(contrastRatio(text, bg)).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });
});

describe('generateShades', () => {
  it('returns light-to-dark shades that include the exact input color', () => {
    const shades = generateShades('#2c5c8d');
    expect(shades).toHaveLength(11);
    expect(shades).toContain('#2C5C8D');
    const lightness = shades.map(s => hexToHSL(s).l);
    for (let i = 1; i < lightness.length; i++) expect(lightness[i]).toBeLessThan(lightness[i - 1]);
  });
});

describe('generateInfluencedPalette', () => {
  it('keeps locked colors and replaces the others', () => {
    const colors = ['#111111', '#222222', '#333333'];
    const next = generateInfluencedPalette(colors, [false, true, false]);
    expect(next).toHaveLength(3);
    expect(next[1]).toBe('#222222');
    next.forEach(c => expect(normalizeHex(c)).not.toBeNull());
  });
});
