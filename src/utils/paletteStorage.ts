import { createId } from '@/lib/utils';
import { normalizeHex } from '@/utils/colorUtils';
import type { ImagePoint } from '@/utils/imagePalette';

export interface SavedPalette {
  id: string;
  name: string;
  colors: string[];
  createdAt: number;
  updatedAt: number;
}

export const SAVED_PALETTES_STORAGE_KEY = 'colorjoy:saved-palettes';

type Listener = () => void;

const listeners = new Set<Listener>();
let cache: SavedPalette[] | null = null;

const isSavedPalette = (value: unknown): value is SavedPalette => {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    Array.isArray(p.colors) &&
    p.colors.every(c => typeof c === 'string' && normalizeHex(c) !== null)
  );
};

const readFromStorage = (): SavedPalette[] => {
  try {
    const raw = localStorage.getItem(SAVED_PALETTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedPalette).map(p => ({
      ...p,
      colors: p.colors.map(c => normalizeHex(c) as string),
      createdAt: Number(p.createdAt) || Date.now(),
      updatedAt: Number(p.updatedAt) || Number(p.createdAt) || Date.now(),
    }));
  } catch (err) {
    console.error('Failed to read saved palettes:', err);
    return [];
  }
};

const emit = () => listeners.forEach(listener => listener());

/** Persists first, then updates the in-memory snapshot. Throws if storage fails (e.g. quota exceeded). */
const commit = (next: SavedPalette[]) => {
  localStorage.setItem(SAVED_PALETTES_STORAGE_KEY, JSON.stringify(next));
  cache = next;
  emit();
};

// Keep multiple open tabs in sync.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key === SAVED_PALETTES_STORAGE_KEY || event.key === null) {
      cache = readFromStorage();
      emit();
    }
  });
}

export const paletteStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /** Stable snapshot (same reference until something changes) for useSyncExternalStore. */
  getSnapshot(): SavedPalette[] {
    if (cache === null) cache = readFromStorage();
    return cache;
  },

  add(name: string, colors: string[]): SavedPalette {
    const now = Date.now();
    const palette: SavedPalette = { id: createId(), name, colors: [...colors], createdAt: now, updatedAt: now };
    commit([palette, ...paletteStore.getSnapshot()]);
    return palette;
  },

  update(id: string, changes: Partial<Pick<SavedPalette, 'name' | 'colors'>>): void {
    commit(
      paletteStore.getSnapshot().map(p =>
        p.id === id ? { ...p, ...changes, updatedAt: Date.now() } : p
      )
    );
  },

  remove(id: string): void {
    commit(paletteStore.getSnapshot().filter(p => p.id !== id));
  },
};

// ---------------------------------------------------------------------------
// Working palettes (per browser tab) of the generator and image pages, so switching pages
// and coming back doesn't throw away the palette being edited.
// ---------------------------------------------------------------------------

export interface StoredPaletteColor {
  hex: string;
  locked: boolean;
  source?: ImagePoint;
  adjusted?: boolean;
}

export interface WorkingPaletteSnapshot {
  colors: StoredPaletteColor[];
  /** Image the colors were picked from (image page). */
  imageId?: string;
}

const isPoint = (v: unknown): v is ImagePoint =>
  Boolean(v) && typeof (v as ImagePoint).x === 'number' && typeof (v as ImagePoint).y === 'number';

const parseStoredColor = (item: unknown): StoredPaletteColor | null => {
  const raw = item as Partial<StoredPaletteColor> | null;
  const hex = normalizeHex(String(raw?.hex ?? ''));
  if (!hex) return null;
  return {
    hex,
    locked: Boolean(raw?.locked),
    ...(isPoint(raw?.source) ? { source: raw.source, adjusted: Boolean(raw.adjusted) } : {}),
  };
};

export const createWorkingPaletteStorage = (storageKey: string) => ({
  load(): WorkingPaletteSnapshot | null {
    try {
      const parsed: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null');
      // Older versions stored a bare array of colors.
      const snapshot = (Array.isArray(parsed) ? { colors: parsed } : parsed) as Partial<WorkingPaletteSnapshot> | null;
      if (!snapshot || !Array.isArray(snapshot.colors)) return null;
      const colors = snapshot.colors.map(parseStoredColor).filter((c): c is StoredPaletteColor => c !== null);
      if (colors.length === 0) return null;
      return { colors, imageId: typeof snapshot.imageId === 'string' ? snapshot.imageId : undefined };
    } catch {
      return null;
    }
  },

  save(colors: StoredPaletteColor[], imageId?: string): void {
    try {
      const snapshot: WorkingPaletteSnapshot = {
        colors: colors.map(({ hex, locked, source, adjusted }) => ({ hex, locked, source, adjusted })),
        imageId,
      };
      sessionStorage.setItem(storageKey, JSON.stringify(snapshot));
    } catch {
      // Non-critical: the palette just won't survive navigation.
    }
  },
});

export const workingPaletteStorage = createWorkingPaletteStorage('colorjoy:working-palette');
export const imagePaletteStorage = createWorkingPaletteStorage('colorjoy:image-palette');
