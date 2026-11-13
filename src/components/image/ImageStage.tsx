import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { ImageSource } from '@/utils/imageFile';
import type { ImagePoint } from '@/utils/imagePalette';
import { ImageStageContext, STAGE_ATTR, pointFromClient } from './stage';

interface ImageStageProps {
  image: ImageSource;
  /** Click on the image itself (markers stop propagation). */
  onStageClick?: (point: ImagePoint) => void;
  onStageDoubleClick?: (point: ImagePoint) => void;
  /** Mouse hover position (null when leaving). Not called for touch. */
  onStageHover?: (point: ImagePoint | null) => void;
  /** Overlays (markers, loupe) positioned in % of the image. */
  children?: React.ReactNode;
  className?: string;
}

/** Room around the image so enlarged markers at its edges are never clipped. */
const PADDING = 24;

/** Shows an image fitted ("contain") to the available space, with an overlay layer for markers. */
const ImageStage: React.FC<ImageStageProps> = ({
  image,
  onStageClick,
  onStageDoubleClick,
  onStageHover,
  children,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageElement, setStageElement] = useState<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const box = useMemo(() => {
    const availW = Math.max(0, size.width - PADDING * 2);
    const availH = Math.max(0, size.height - PADDING * 2);
    const scale = Math.min(availW / image.width, availH / image.height);
    const width = Math.floor(image.width * scale);
    const height = Math.floor(image.height * scale);
    return { width, height, left: (size.width - width) / 2, top: (size.height - height) / 2 };
  }, [size, image.width, image.height]);

  const stageInfo = useMemo(
    () => ({ width: box.width, height: box.height, src: image.src, element: stageElement }),
    [box.width, box.height, image.src, stageElement]
  );

  const toPoint = (e: React.MouseEvent<HTMLDivElement>) => pointFromClient(e.clientX, e.clientY, e.currentTarget);

  return (
    <div ref={containerRef} className={cn('relative h-full w-full overflow-hidden', className)}>
      {box.width > 0 && box.height > 0 && (
        <div
          ref={setStageElement}
          {...{ [STAGE_ATTR]: '' }}
          className="absolute cursor-crosshair touch-manipulation select-none"
          style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
          onClick={onStageClick && (e => onStageClick(toPoint(e)))}
          onDoubleClick={onStageDoubleClick && (e => onStageDoubleClick(toPoint(e)))}
          onPointerMove={onStageHover && (e => e.pointerType === 'mouse' && onStageHover(toPoint(e)))}
          onPointerLeave={onStageHover && (() => onStageHover(null))}
        >
          <img
            src={image.src}
            alt={image.name}
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full rounded-sm shadow-lg ring-1 ring-black/5"
            // Checkerboard behind transparent areas.
            style={{ background: 'repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%) 0 0 / 16px 16px' }}
          />
          <ImageStageContext.Provider value={stageInfo}>{children}</ImageStageContext.Provider>
        </div>
      )}
    </div>
  );
};

export default ImageStage;
