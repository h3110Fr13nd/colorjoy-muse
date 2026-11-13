import { useEffect, useState } from 'react';
import { getImageSampler, type ImageSampler } from '@/utils/imageSampler';
import type { ImageSource } from '@/utils/imageFile';

interface State {
  imageId: string | null;
  sampler: ImageSampler | null;
  error: string | null;
}

/** Loads (and caches) the pixel sampler of an image. Never returns a sampler of a previous image. */
export const useImageSampler = (image: ImageSource | null) => {
  const [state, setState] = useState<State>({ imageId: null, sampler: null, error: null });

  useEffect(() => {
    if (!image) return;
    let cancelled = false;
    getImageSampler(image).then(
      sampler => !cancelled && setState({ imageId: image.id, sampler, error: null }),
      (err: Error) => !cancelled && setState({ imageId: image.id, sampler: null, error: err.message })
    );
    return () => {
      cancelled = true;
    };
  }, [image]);

  const current = image !== null && state.imageId === image.id;
  return {
    sampler: current ? state.sampler : null,
    error: current ? state.error : null,
    isLoading: image !== null && !current,
  };
};
