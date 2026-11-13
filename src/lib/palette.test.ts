import { describe, expect, it } from 'vitest';
import { analyzeImageColors, type PixelSource } from '@/utils/imagePalette';
import { createImageStrategy, fromStoredColors, randomStrategy, toPaletteColors } from './palette';

describe('randomStrategy', () => {
  it('regenerates unlocked colors only and keeps ids', () => {
    const colors = toPaletteColors(['#111111', '#222222', '#333333'], [false, true, false]);
    const next = randomStrategy.regenerate(colors, { jitter: 0.5 });
    expect(next.map(c => c.id)).toEqual(colors.map(c => c.id));
    expect(next[1]).toEqual(colors[1]);
    next.forEach(c => expect(c.hex).toMatch(/^#[0-9A-F]{6}$/));
  });
});

describe('createImageStrategy', () => {
  const pixels: PixelSource = (() => {
    const w = 60, h = 20, data = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) data.set((i % w) < 30 ? [220, 40, 40, 255] : [40, 90, 220, 255], i * 4);
    return { width: w, height: h, data };
  })();
  const strategy = createImageStrategy(analyzeImageColors(pixels));

  it('picks colors from the image with their source points, keeping locked colors', () => {
    const colors = toPaletteColors(['#FFFFFF', '#00FF00'], [false, true]);
    const next = strategy.regenerate(colors, { jitter: 0 });
    expect(next[1]).toEqual(colors[1]);
    expect(['#DC2828', '#285ADC']).toContain(next[0].hex);
    expect(next[0].source).toBeDefined();
  });

  it('creates new colors from the image for the "+" buttons', () => {
    const created = strategy.createColor(toPaletteColors(['#DC2828']));
    expect(created.hex).toBe('#285ADC');
    expect(created.source).toBeDefined();
  });
});

it('restores stored colors with fresh ids', () => {
  const restored = fromStoredColors([
    { hex: '#AABBCC', locked: true },
    { hex: '#112233', locked: false, source: { x: 0.5, y: 0.5 }, adjusted: true },
  ]);
  expect(restored).toMatchObject([
    { hex: '#AABBCC', locked: true },
    { hex: '#112233', locked: false, source: { x: 0.5, y: 0.5 }, adjusted: true },
  ]);
  expect(new Set(restored.map(c => c.id)).size).toBe(2);
});
