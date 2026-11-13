// Palette extraction from image pixels. Pure functions (no DOM) so they are easy to test.
//
// 1. Analysis (once per image): k-means clustering in CIELAB groups the image's pixels into
//    perceptual color families. Every candidate keeps a few *real* pixels close to its cluster
//    center, so each palette color exists in the image (within a small tolerance) and has a
//    location that can be shown on the image.
// 2. Selection (every "generate"): like the random generator, but choosing among the image's
//    colors. Candidates are scored for distinctness, prominence, vividness and, when colors are
//    locked, harmony with them; `jitter` adds randomness so regenerating gives varied palettes.

import { deltaE, hexToLab, hueDistance, labChroma, labHue, rgbToHex, rgbToLab, type Lab } from './colorSpace';

/** Position in the image, normalized to 0..1 on both axes. */
export interface ImagePoint {
  x: number;
  y: number;
}

/** RGBA pixels (ImageData satisfies this). */
export interface PixelSource {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface PickedColor {
  hex: string;
  source: ImagePoint;
}

interface CandidatePick extends PickedColor {
  lab: Lab;
}

export interface ColorCandidate {
  /** Cluster center. */
  lab: Lab;
  chroma: number;
  hue: number;
  /** Share of the image's pixels in this cluster (0..1). */
  population: number;
  /** Real pixels closest to the cluster center, best first. */
  picks: CandidatePick[];
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const clampPoint = (p: ImagePoint): ImagePoint => ({ x: clamp01(p.x), y: clamp01(p.y) });

/**
 * Color at a point, averaged over a (2r+1)² neighborhood to smooth out noise/JPEG artifacts.
 * Transparent pixels are composited over white.
 */
export const sampleColorAt = (pixels: PixelSource, point: ImagePoint, radius = 1): string => {
  const { width, height, data } = pixels;
  const cx = Math.round(clamp01(point.x) * (width - 1));
  const cy = Math.round(clamp01(point.y) * (height - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;

  for (let y = Math.max(0, cy - radius); y <= Math.min(height - 1, cy + radius); y++) {
    for (let x = Math.max(0, cx - radius); x <= Math.min(width - 1, cx + radius); x++) {
      const i = (y * width + x) * 4;
      const a = data[i + 3] / 255;
      r += data[i] * a + 255 * (1 - a);
      g += data[i + 1] * a + 255 * (1 - a);
      b += data[i + 2] * a + 255 * (1 - a);
      n++;
    }
  }
  return rgbToHex(r / n, g / n, b / n);
};

// Small seeded PRNG so the analysis of an image is deterministic.
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Max ΔE between a pixel and its smoothed neighborhood for it to count as a clean pick. */
const UNIFORMITY_TOLERANCE = 6;
const MAX_PICK_ATTEMPTS = 200;
/** Keep picks this far (fraction of the image) from the borders when possible. */
const BORDER_MARGIN = 0.04;

export interface AnalyzeOptions {
  clusters?: number;
  maxSamples?: number;
  iterations?: number;
  picksPerCandidate?: number;
}

/** Groups the image's colors into candidate palette colors (most prominent first). */
export const analyzeImageColors = (pixels: PixelSource, options: AnalyzeOptions = {}): ColorCandidate[] => {
  const { clusters = 18, maxSamples = 12000, iterations = 10, picksPerCandidate = 12 } = options;
  const { width, height, data } = pixels;

  // 1. Sample pixels on a grid (skip mostly transparent ones).
  const step = Math.max(1, Math.floor(Math.sqrt((width * height) / maxSamples)));
  const labs: number[] = [];
  const points: number[] = [];
  for (let y = Math.floor(step / 2); y < height; y += step) {
    for (let x = Math.floor(step / 2); x < width; x += step) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 128) continue;
      labs.push(...rgbToLab(data[i], data[i + 1], data[i + 2]));
      points.push((x + 0.5) / width, (y + 0.5) / height);
    }
  }
  const n = labs.length / 3;
  if (n === 0) return [];

  const dist2 = (i: number, c: number[], j: number) => {
    const dl = labs[i * 3] - c[j * 3];
    const da = labs[i * 3 + 1] - c[j * 3 + 1];
    const db = labs[i * 3 + 2] - c[j * 3 + 2];
    return dl * dl + da * da + db * db;
  };

  // 2. k-means++ initialization.
  const random = mulberry32(n * 31 + width * 7 + height);
  const k = Math.min(clusters, n);
  const centers: number[] = [];
  const first = Math.floor(random() * n);
  centers.push(labs[first * 3], labs[first * 3 + 1], labs[first * 3 + 2]);
  const nearest = new Float64Array(n).fill(Infinity);

  for (let c = 1; c < k; c++) {
    let total = 0;
    for (let i = 0; i < n; i++) {
      nearest[i] = Math.min(nearest[i], dist2(i, centers, c - 1));
      total += nearest[i];
    }
    if (total === 0) break; // fewer distinct colors than clusters
    let target = random() * total;
    let chosen = n - 1;
    for (let i = 0; i < n; i++) {
      target -= nearest[i];
      if (target <= 0) {
        chosen = i;
        break;
      }
    }
    centers.push(labs[chosen * 3], labs[chosen * 3 + 1], labs[chosen * 3 + 2]);
  }
  const kk = centers.length / 3;

  // 3. Lloyd iterations.
  const assignment = new Int32Array(n);
  for (let iter = 0; iter < iterations; iter++) {
    const sums = new Float64Array(kk * 3);
    const counts = new Int32Array(kk);
    let changed = false;

    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let j = 0; j < kk; j++) {
        const d = dist2(i, centers, j);
        if (d < bestD) {
          bestD = d;
          best = j;
        }
      }
      if (assignment[i] !== best) changed = true;
      assignment[i] = best;
      counts[best]++;
      sums[best * 3] += labs[i * 3];
      sums[best * 3 + 1] += labs[i * 3 + 1];
      sums[best * 3 + 2] += labs[i * 3 + 2];
    }

    for (let j = 0; j < kk; j++) {
      if (counts[j] === 0) continue;
      centers[j * 3] = sums[j * 3] / counts[j];
      centers[j * 3 + 1] = sums[j * 3 + 1] / counts[j];
      centers[j * 3 + 2] = sums[j * 3 + 2] / counts[j];
    }
    if (!changed && iter > 0) break;
  }

  // 4. Build candidates with the real pixels nearest to each center.
  const members: Array<Array<[number, number]>> = Array.from({ length: kk }, () => []);
  for (let i = 0; i < n; i++) {
    members[assignment[i]].push([dist2(i, centers, assignment[i]), i]);
  }

  const candidates: ColorCandidate[] = [];
  for (let j = 0; j < kk; j++) {
    if (members[j].length === 0) continue;
    // Shuffle first so ties (e.g. flat color areas) aren't resolved in scan order, which would
    // cluster every candidate pick in the top rows of the image.
    const list = members[j];
    for (let i = list.length - 1; i > 0; i--) {
      const r = Math.floor(random() * (i + 1));
      [list[i], list[r]] = [list[r], list[i]];
    }
    list.sort((a, b) => a[0] - b[0]);

    // Prefer pixels in locally uniform areas (their smoothed color matches the pixel itself, so the
    // pick truly exists in the image and isn't a blend across an edge) and away from the image border
    // (where markers would be cramped).
    const picks: CandidatePick[] = [];
    const nearBorder: CandidatePick[] = [];
    const blended: CandidatePick[] = [];
    for (const [, i] of members[j].slice(0, MAX_PICK_ATTEMPTS)) {
      const source = { x: points[i * 2], y: points[i * 2 + 1] };
      const hex = sampleColorAt(pixels, source);
      const lab = hexToLab(hex);
      const pixelLab: Lab = [labs[i * 3], labs[i * 3 + 1], labs[i * 3 + 2]];
      const isUniform = deltaE(lab, pixelLab) <= UNIFORMITY_TOLERANCE;
      const isInside = [source.x, source.y].every(v => v >= BORDER_MARGIN && v <= 1 - BORDER_MARGIN);
      (isUniform ? (isInside ? picks : nearBorder) : blended).push({ source, hex, lab });
      if (picks.length >= picksPerCandidate) break;
    }
    // Fallbacks, best first: clean pixels near the border, then anything.
    picks.push(...[...nearBorder, ...blended].slice(0, Math.max(0, picksPerCandidate - picks.length)));

    const lab: Lab = [centers[j * 3], centers[j * 3 + 1], centers[j * 3 + 2]];
    candidates.push({
      lab,
      chroma: labChroma(lab),
      hue: labHue(lab),
      population: members[j].length / n,
      picks,
    });
  }

  return candidates.sort((a, b) => b.population - a.population);
};

// Hue relationships used by the harmony bonus: analogous, split-complementary, triadic, complementary.
const HARMONY_ANGLES = [0, 30, 120, 150, 180];
const NEUTRAL_CHROMA = 12;

/** 0.7 (clashes) .. 1.3 (harmonizes) relative to the anchor colors. Neutrals go with anything. */
const harmonyFactor = (candidate: Pick<ColorCandidate, 'chroma' | 'hue'>, anchors: Lab[]): number => {
  const chromatic = anchors.filter(a => labChroma(a) >= NEUTRAL_CHROMA);
  if (chromatic.length === 0) return 1;
  if (candidate.chroma < NEUTRAL_CHROMA) return 1;

  const fit =
    chromatic.reduce((sum, anchor) => {
      const d = hueDistance(candidate.hue, labHue(anchor));
      return sum + Math.max(...HARMONY_ANGLES.map(angle => Math.exp(-((d - angle) ** 2) / (2 * 20 ** 2))));
    }, 0) / chromatic.length;

  return 0.7 + 0.6 * fit;
};

export interface PickOptions {
  /** How many colors to pick. */
  count: number;
  /** Colors the picks must be distinguishable from (e.g. the rest of the palette). */
  avoid?: string[];
  /** Colors the picks should harmonize with (e.g. locked colors). */
  anchors?: string[];
  /** 0 = always the best palette; higher = more variety between calls. */
  jitter?: number;
  random?: () => number;
}

/** Minimum ΔE between picks; relaxed step by step for images with few distinct colors. */
const DISTINCTNESS_TOLERANCES = [14, 7, 0];

/** Chooses varied, representative colors from the image's candidates. */
export const pickImagePalette = (candidates: ColorCandidate[], options: PickOptions): PickedColor[] => {
  const { count, avoid = [], anchors = [], jitter = 0, random = Math.random } = options;
  if (candidates.length === 0 || count <= 0) return [];

  const chosen: Lab[] = avoid.map(hexToLab);
  const anchorLabs = anchors.map(hexToLab);
  const maxProminence = Math.max(...candidates.map(c => Math.sqrt(c.population)));
  const uses = new Map<ColorCandidate, number>();
  const result: PickedColor[] = [];

  for (let slot = 0; slot < count; slot++) {
    let best: ColorCandidate | null = null;

    for (const tolerance of DISTINCTNESS_TOLERANCES) {
      let bestScore = -Infinity;
      for (const candidate of candidates) {
        const used = uses.get(candidate) ?? 0;
        if (used >= candidate.picks.length) continue;

        const distance = chosen.length ? Math.min(...chosen.map(c => deltaE(candidate.lab, c))) : 100;
        if (tolerance > 0 && distance < tolerance) continue;

        const distinctness = 0.15 + Math.min(distance, 50) / 50;
        const prominence = 0.3 + (0.7 * Math.sqrt(candidate.population)) / maxProminence;
        const vividness = 0.65 + 0.35 * Math.min(candidate.chroma / 50, 1);
        const harmony = harmonyFactor(candidate, anchorLabs);
        const noise = 1 + jitter * (random() * 2 - 1);

        const score = (distinctness * prominence * vividness * harmony * noise) / (1 + used);
        if (score > bestScore) {
          bestScore = score;
          best = candidate;
        }
      }
      if (best) break;
    }

    if (!best) break;

    const used = uses.get(best) ?? 0;
    uses.set(best, used + 1);
    // With jitter, vary which real pixel (and so which marker position) represents the color.
    const spread = Math.max(1, Math.min(4, best.picks.length - used));
    const pick = best.picks[jitter > 0 ? used + Math.floor(random() * spread) : used];

    chosen.push(pick.lab);
    result.push({ hex: pick.hex, source: pick.source });
  }

  return result;
};
