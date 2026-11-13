import { expect, it } from 'vitest';
import { contrastRatio, DARK_TEXT, LIGHT_TEXT } from '@/utils/colorUtils';
import { getContrastClasses } from './contrast';

const mix = (fg: string, bg: string, a: number) =>
  '#' +
  [1, 3, 5]
    .map(i => Math.round(parseInt(fg.slice(i, i + 2), 16) * a + parseInt(bg.slice(i, i + 2), 16) * (1 - a)).toString(16).padStart(2, '0'))
    .join('');

it('keeps secondary (semi-transparent) text at AA contrast on every color', () => {
  for (let r = 0; r < 256; r += 17) for (let g = 0; g < 256; g += 17) for (let b = 0; b < 256; b += 17) {
    const bg = `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
    const { isLight, secondaryOpacity } = getContrastClasses(bg);
    const text = mix(isLight ? DARK_TEXT : LIGHT_TEXT, bg, secondaryOpacity);
    expect(contrastRatio(text, bg)).toBeGreaterThanOrEqual(4.5);
  }
});
