import { createId } from '@/lib/utils';

export interface ImageSource {
  id: string;
  /** Data URL (downscaled) so it can be persisted and sampled without CORS issues. */
  src: string;
  name: string;
  width: number;
  height: number;
}

/** Longest side of stored images: plenty for picking colors, small enough for sessionStorage. */
const MAX_IMAGE_SIDE = 1400;
const FALLBACK_SIZE = 1024; // e.g. SVGs without intrinsic size

export const loadImageElement = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('The image could not be loaded.'));
    img.src = src;
  });

export const isImageFile = (file: File | null | undefined): file is File =>
  Boolean(file && file.type.startsWith('image/'));

/** Reads an image file into a downscaled data URL. Keeps transparency for formats that support it. */
export const readImageFile = async (file: File): Promise<ImageSource> => {
  if (!isImageFile(file)) throw new Error('That file is not an image.');

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(objectUrl);
    const naturalW = img.naturalWidth || FALLBACK_SIZE;
    const naturalH = img.naturalHeight || FALLBACK_SIZE;
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(naturalW, naturalH));
    const width = Math.max(1, Math.round(naturalW * scale));
    const height = Math.max(1, Math.round(naturalH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Your browser could not process the image.');
    ctx.drawImage(img, 0, 0, width, height);

    const mayHaveAlpha = /png|gif|webp|svg|avif/.test(file.type);
    const src = canvas.toDataURL(mayHaveAlpha ? 'image/png' : 'image/jpeg', 0.9);

    return { id: createId(), src, name: file.name || 'Pasted image', width, height };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};
