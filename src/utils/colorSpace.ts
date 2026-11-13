// Perceptual color math used by the image palette extractor.
// CIELAB distances match how different two colors *look* far better than RGB distances.

export type RGB = [number, number, number];
export type Lab = [number, number, number];

export const hexToRgb = (hex: string): RGB => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

const toHexPart = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');

export const rgbToHex = (r: number, g: number, b: number): string =>
  `#${toHexPart(r)}${toHexPart(g)}${toHexPart(b)}`.toUpperCase();

// sRGB channel (0-255) -> linear light, precomputed for speed (called per pixel during analysis).
const SRGB_TO_LINEAR = Array.from({ length: 256 }, (_, i) => {
  const c = i / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
});

const labF = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);

/** sRGB (0-255 ints) -> CIELAB (D65). */
export const rgbToLab = (r: number, g: number, b: number): Lab => {
  const lr = SRGB_TO_LINEAR[r];
  const lg = SRGB_TO_LINEAR[g];
  const lb = SRGB_TO_LINEAR[b];

  const x = (lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375) / 0.95047;
  const y = lr * 0.2126729 + lg * 0.7151522 + lb * 0.072175;
  const z = (lr * 0.0193339 + lg * 0.119192 + lb * 0.9503041) / 1.08883;

  const fx = labF(x);
  const fy = labF(y);
  const fz = labF(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
};

export const hexToLab = (hex: string): Lab => rgbToLab(...hexToRgb(hex));

/** CIE76 color difference: ~2.3 is a just-noticeable difference, >40 is very different. */
export const deltaE = (a: Lab, b: Lab): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export const labChroma = (lab: Lab): number => Math.hypot(lab[1], lab[2]);

/** Hue angle in degrees (0-360) in LCh space. */
export const labHue = (lab: Lab): number => ((Math.atan2(lab[2], lab[1]) * 180) / Math.PI + 360) % 360;

/** Smallest angle between two hues (0-180). */
export const hueDistance = (a: number, b: number): number => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};
