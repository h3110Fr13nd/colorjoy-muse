import { describe, expect, it } from 'vitest';
import { deltaE, hexToLab } from './colorSpace';
import { analyzeImageColors, pickImagePalette, sampleColorAt, type PixelSource } from './imagePalette';

const image = (w: number, h: number, fn: (x: number, y: number) => number[]): PixelSource => {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b, a = 255] = fn(x, y);
      data.set([r, g, b, a], (y * w + x) * 4);
    }
  }
  return { width: w, height: h, data };
};

const toHex = (c: number[]) => `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`;

// Five flat color blocks of different sizes, with a little noise.
const BLOCKS = [[200, 30, 40], [30, 120, 200], [240, 200, 60], [20, 20, 30], [90, 200, 120]];
const EDGES = [0, 0.35, 0.6, 0.8, 0.92, 1];
let seed = 1;
const noise = () => ((seed = (seed * 16807) % 2147483647) % 13) - 6;
const blocks = image(300, 120, x => {
  const k = EDGES.findIndex((e, i) => x / 300 >= e && x / 300 < EDGES[i + 1]);
  return BLOCKS[k].map(v => Math.max(0, Math.min(255, v + noise())));
});

describe('image palette extraction', () => {
  const palette = pickImagePalette(analyzeImageColors(blocks), { count: 5 });

  it('finds every distinct color, including small areas', () => {
    for (const block of BLOCKS) {
      const closest = Math.min(...palette.map(p => deltaE(hexToLab(p.hex), hexToLab(toHex(block)))));
      expect(closest).toBeLessThan(6);
    }
  });

  it('only returns colors present at their marker position', () => {
    for (const pick of palette) {
      expect(pick.hex).toBe(sampleColorAt(blocks, pick.source));
      expect(pick.source.x).toBeGreaterThanOrEqual(0);
      expect(pick.source.x).toBeLessThanOrEqual(1);
    }
  });

  it('is deterministic without jitter and varied with jitter', () => {
    const again = pickImagePalette(analyzeImageColors(blocks), { count: 5 });
    expect(again.map(p => p.hex)).toEqual(palette.map(p => p.hex));

    const gradient = image(200, 200, (x, y) => [Math.round((x / 199) * 255), Math.round((y / 199) * 255), 128]);
    const candidates = analyzeImageColors(gradient);
    const runs = new Set(Array.from({ length: 8 }, () => pickImagePalette(candidates, { count: 5, jitter: 0.6 }).map(p => p.hex).join()));
    expect(runs.size).toBeGreaterThan(3);
  });

  it('keeps picks distinct from colors to avoid (e.g. locked ones)', () => {
    const locked = palette[0].hex;
    const rest = pickImagePalette(analyzeImageColors(blocks), { count: 4, avoid: [locked], anchors: [locked] });
    expect(rest).toHaveLength(4);
    rest.forEach(p => expect(deltaE(hexToLab(p.hex), hexToLab(locked))).toBeGreaterThan(14));
  });

  it('never invents blended colors on hard edges', () => {
    const twoColors = image(100, 100, x => (x < 50 ? [255, 0, 0] : [0, 0, 255]));
    const picks = pickImagePalette(analyzeImageColors(twoColors), { count: 5 });
    expect(picks).toHaveLength(5);
    expect(new Set(picks.map(p => p.hex))).toEqual(new Set(['#FF0000', '#0000FF']));
  });

  it('handles fully transparent images', () => {
    const empty = image(20, 20, () => [0, 0, 0, 0]);
    expect(analyzeImageColors(empty)).toEqual([]);
    expect(pickImagePalette([], { count: 3 })).toEqual([]);
    expect(sampleColorAt(empty, { x: 0.5, y: 0.5 })).toBe('#FFFFFF');
  });
});
