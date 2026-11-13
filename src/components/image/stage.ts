import { createContext, useContext } from 'react';
import { clampPoint, type ImagePoint } from '@/utils/imagePalette';

export const STAGE_ATTR = 'data-image-stage';

export interface ImageStageInfo {
  /** Rendered image size in CSS pixels. */
  width: number;
  height: number;
  src: string;
  /** The stage element (for positioning floating UI like the loupe in viewport coordinates). */
  element: HTMLElement | null;
}

export const ImageStageContext = createContext<ImageStageInfo | null>(null);

export const useImageStage = (): ImageStageInfo => {
  const stage = useContext(ImageStageContext);
  if (!stage) throw new Error('useImageStage must be used inside <ImageStage>');
  return stage;
};

/** Converts a viewport position to a normalized point on the stage (clamped to the image). */
export const pointFromClient = (clientX: number, clientY: number, stage: Element): ImagePoint => {
  const rect = stage.getBoundingClientRect();
  return clampPoint({ x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height });
};

export const findStage = (el: Element): Element | null => el.closest(`[${STAGE_ATTR}]`);
