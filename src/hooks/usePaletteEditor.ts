import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createPaletteColor,
  randomStrategy,
  toCanonicalHex,
  toPaletteColors,
  type NewPaletteColor,
  type PaletteColor,
  type PaletteStrategy,
} from '@/lib/palette';
import type { ImagePoint } from '@/utils/imagePalette';

export type { PaletteColor, PaletteStrategy } from '@/lib/palette';
export { toPaletteColors } from '@/lib/palette';

export const GENERATE_ANIMATION_MS = 300;
export const DEFAULT_PALETTE_SIZE = 5;
/** Randomness used when regenerating (0 = deterministic best palette). */
export const GENERATE_JITTER = 0.6;

export const createRandomPalette = (size = DEFAULT_PALETTE_SIZE): PaletteColor[] =>
  randomStrategy.regenerate(toPaletteColors(Array(size).fill('#FFFFFF')), { jitter: GENERATE_JITTER });

export interface PaletteEditorState {
  colors: PaletteColor[];
  hexes: string[];
  isGenerating: boolean;
  /** Replaces every unlocked color using the current strategy. */
  generate: () => void;
  toggleLock: (id: string) => void;
  /** Manual edit (hex input, picker, shade). */
  updateColor: (id: string, hex: string) => void;
  /** Sets a color picked from a point of an image. */
  pickColor: (id: string, hex: string, source: ImagePoint) => void;
  /** Inserts a color from the strategy at `index` ("+" buttons). */
  addColor: (index: number) => void;
  /** Inserts a specific color at `index` (defaults to the end). */
  insertColor: (color: NewPaletteColor, index?: number) => PaletteColor;
  /** Returns false when the color can't be removed (a palette needs at least one color). */
  removeColor: (id: string) => boolean;
  /** Escape hatch for bulk changes (e.g. extracting a palette from a new image). */
  replaceColors: (updater: (prev: PaletteColor[]) => PaletteColor[]) => void;
}

/**
 * Single source of truth for an editable palette. Used by the generator, the image palette page
 * and the saved-palette editor so all surfaces behave identically. The `strategy` decides where
 * new colors come from.
 */
export const usePaletteEditor = (
  initial: PaletteColor[] | (() => PaletteColor[]),
  strategy: PaletteStrategy = randomStrategy
): PaletteEditorState => {
  const [colors, setColors] = useState<PaletteColor[]>(initial);
  const [isGenerating, setIsGenerating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  // Read through a ref so callbacks stay stable when the strategy changes (e.g. new image).
  const strategyRef = useRef(strategy);
  strategyRef.current = strategy;

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  // Stable callback: lock state is read from the latest state when the new colors are applied,
  // so toggling a lock never re-creates this function (or re-triggers anything depending on it).
  const generate = useCallback(() => {
    setIsGenerating(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setColors(prev => strategyRef.current.regenerate(prev, { jitter: GENERATE_JITTER }));
      setIsGenerating(false);
    }, GENERATE_ANIMATION_MS);
  }, []);

  const toggleLock = useCallback((id: string) => {
    setColors(prev => prev.map(c => (c.id === id ? { ...c, locked: !c.locked } : c)));
  }, []);

  const updateColor = useCallback((id: string, hex: string) => {
    const normalized = toCanonicalHex(hex);
    setColors(prev =>
      prev.map(c => (c.id === id && c.hex !== normalized ? { ...c, hex: normalized, adjusted: Boolean(c.source) } : c))
    );
  }, []);

  const pickColor = useCallback((id: string, hex: string, source: ImagePoint) => {
    setColors(prev =>
      prev.map(c => (c.id === id ? { ...c, hex: toCanonicalHex(hex), source, adjusted: false } : c))
    );
  }, []);

  const addColor = useCallback((index: number) => {
    setColors(prev => {
      const next = [...prev];
      next.splice(index, 0, createPaletteColor(strategyRef.current.createColor(prev)));
      return next;
    });
  }, []);

  const insertColor = useCallback((color: NewPaletteColor, index?: number) => {
    const created = createPaletteColor(color);
    setColors(prev => {
      const next = [...prev];
      next.splice(index ?? next.length, 0, created);
      return next;
    });
    return created;
  }, []);

  const removeColor = useCallback(
    (id: string) => {
      if (colors.length <= 1) return false;
      setColors(prev => (prev.length <= 1 ? prev : prev.filter(c => c.id !== id)));
      return true;
    },
    [colors.length]
  );

  const replaceColors = useCallback((updater: (prev: PaletteColor[]) => PaletteColor[]) => setColors(updater), []);

  const hexes = useMemo(() => colors.map(c => c.hex), [colors]);

  return {
    colors,
    hexes,
    isGenerating,
    generate,
    toggleLock,
    updateColor,
    pickColor,
    addColor,
    insertColor,
    removeColor,
    replaceColors,
  };
};
