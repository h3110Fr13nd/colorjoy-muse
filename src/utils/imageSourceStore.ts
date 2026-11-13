import type { ImageSource } from './imageFile';

export interface ImageSourceStore {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => ImageSource | null;
  set: (image: ImageSource | null) => void;
}

const isImageSource = (value: unknown): value is ImageSource => {
  const v = value as Partial<ImageSource> | null;
  return Boolean(
    v && typeof v.id === 'string' && typeof v.src === 'string' && typeof v.width === 'number' && typeof v.height === 'number'
  );
};

/**
 * In-memory image slot, mirrored to sessionStorage (best effort: large images may not fit,
 * in which case they simply don't survive a reload).
 */
const createImageSourceStore = (storageKey: string): ImageSourceStore => {
  const listeners = new Set<() => void>();
  let current: ImageSource | null | undefined;

  const load = (): ImageSource | null => {
    try {
      const parsed: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null');
      return isImageSource(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot() {
      if (current === undefined) current = load();
      return current;
    },
    set(image) {
      current = image;
      try {
        if (image) sessionStorage.setItem(storageKey, JSON.stringify(image));
        else sessionStorage.removeItem(storageKey);
      } catch {
        sessionStorage.removeItem(storageKey);
      }
      listeners.forEach(l => l());
    },
  };
};

/** Image shown on the "From Image" page. */
export const paletteImageStore = createImageSourceStore('colorjoy:palette-image');

/** Last image used to pick a single color from a color column. */
export const pickerImageStore = createImageSourceStore('colorjoy:picker-image');
