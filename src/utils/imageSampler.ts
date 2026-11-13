import { loadImageElement, type ImageSource } from './imageFile';
import {
  analyzeImageColors,
  sampleColorAt,
  type ColorCandidate,
  type ImagePoint,
  type PixelSource,
} from './imagePalette';

/** Resolution used for sampling & analysis. Markers, hover previews and extraction all read the same pixels. */
const SAMPLER_MAX_SIDE = 640;
const CACHE_LIMIT = 4;

export class ImageSampler {
  private candidates: ColorCandidate[] | null = null;

  constructor(private readonly pixels: PixelSource) {}

  sampleAt(point: ImagePoint, radius = 1): string {
    return sampleColorAt(this.pixels, point, radius);
  }

  /** Candidate colors of the image, computed once and cached. */
  getCandidates(): ColorCandidate[] {
    if (!this.candidates) this.candidates = analyzeImageColors(this.pixels);
    return this.candidates;
  }
}

const createSampler = async (src: string): Promise<ImageSampler> => {
  const img = await loadImageElement(src);
  const scale = Math.min(1, SAMPLER_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Your browser could not process the image.');
  ctx.drawImage(img, 0, 0, width, height);

  return new ImageSampler(ctx.getImageData(0, 0, width, height));
};

const cache = new Map<string, Promise<ImageSampler>>();

/** Shared, cached sampler per image (the palette page and color pickers reuse the same analysis). */
export const getImageSampler = (image: ImageSource): Promise<ImageSampler> => {
  let sampler = cache.get(image.id);
  if (!sampler) {
    sampler = createSampler(image.src);
    sampler.catch(() => cache.delete(image.id));
    cache.set(image.id, sampler);
    if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
  }
  return sampler;
};
