import { createId } from '@/lib/utils';
import { generateInfluencedPalette, generateRandomColor, normalizeHex } from '@/utils/colorUtils';
import { pickImagePalette, type ColorCandidate, type ImagePoint } from '@/utils/imagePalette';
import type { StoredPaletteColor } from '@/utils/paletteStorage';

export interface PaletteColor {
  /** Stable identity so React keeps per-column UI state (e.g. an open hex editor) across color changes. */
  id: string;
  hex: string;
  locked: boolean;
  /** Where the color was picked from, when it comes from an image. */
  source?: ImagePoint;
  /** True when an image-picked color was edited by hand afterwards. */
  adjusted?: boolean;
}

export type NewPaletteColor = Pick<PaletteColor, 'hex' | 'source'>;

/**
 * How a palette produces colors. The editor UI is the same everywhere; only the source of
 * new colors changes (random/harmonized generator vs. colors found in an image).
 */
export interface PaletteStrategy {
  /** Returns the palette with every unlocked color replaced. */
  regenerate: (colors: PaletteColor[], options: { jitter: number }) => PaletteColor[];
  /** A color for the "+" buttons. */
  createColor: (colors: PaletteColor[]) => NewPaletteColor;
}

/** Every color in an editor is stored as "#RRGGBB" so display, storage and share links agree. */
export const toCanonicalHex = (hex: string) => normalizeHex(hex) ?? '#FFFFFF';

export const createPaletteColor = ({ hex, source }: NewPaletteColor, locked = false): PaletteColor => ({
  id: createId(),
  hex: toCanonicalHex(hex),
  locked,
  ...(source ? { source } : {}),
});

export const toPaletteColors = (hexes: string[], locked: boolean[] = []): PaletteColor[] =>
  hexes.map((hex, i) => createPaletteColor({ hex }, Boolean(locked[i])));

/** Random colors, harmonized with locked ones (the classic generator). */
export const randomStrategy: PaletteStrategy = {
  regenerate: colors => {
    const next = generateInfluencedPalette(
      colors.map(c => c.hex),
      colors.map(c => c.locked)
    );
    return colors.map((c, i) => (c.locked ? c : { id: c.id, locked: false, hex: toCanonicalHex(next[i]) }));
  },
  createColor: () => ({ hex: generateRandomColor() }),
};

/** Colors picked from an image's candidate colors, distinct from and harmonized with locked colors. */
export const createImageStrategy = (candidates: ColorCandidate[]): PaletteStrategy => ({
  regenerate: (colors, { jitter }) => {
    const locked = colors.filter(c => c.locked).map(c => c.hex);
    const picks = pickImagePalette(candidates, {
      count: colors.length - locked.length,
      avoid: locked,
      anchors: locked,
      jitter,
    });
    let next = 0;
    return colors.map(c => {
      if (c.locked) return c;
      const pick = picks[next++];
      return pick ? { id: c.id, locked: false, hex: toCanonicalHex(pick.hex), source: pick.source } : c;
    });
  },
  createColor: colors => {
    const [pick] = pickImagePalette(candidates, {
      count: 1,
      avoid: colors.map(c => c.hex),
      anchors: colors.filter(c => c.locked).map(c => c.hex),
      jitter: 0.3,
    });
    return pick ?? randomStrategy.createColor(colors);
  },
});

/** Restores editor colors from session storage (fresh ids). */
export const fromStoredColors = (stored: StoredPaletteColor[]): PaletteColor[] =>
  stored.map(({ hex, locked, source, adjusted }) => ({
    ...createPaletteColor({ hex, source }, locked),
    ...(source ? { adjusted: Boolean(adjusted) } : {}),
  }));
