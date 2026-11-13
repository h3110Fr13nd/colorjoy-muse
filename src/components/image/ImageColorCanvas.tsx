import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImageSource } from '@/utils/imageFile';
import type { ImagePoint } from '@/utils/imagePalette';
import type { ImageSampler } from '@/utils/imageSampler';
import ImageStage from './ImageStage';
import ColorMarker from './ColorMarker';
import Loupe from './Loupe';

export interface CanvasMarker {
  id: string;
  point: ImagePoint;
  color: string;
  label: string;
  badge?: React.ReactNode;
  locked?: boolean;
  adjusted?: boolean;
}

interface ImageColorCanvasProps {
  image: ImageSource;
  /** Pixel access; while null the canvas shows a loading state and ignores clicks. */
  sampler: ImageSampler | null;
  markers: CanvasMarker[];
  /** Click on the image (not on a marker). */
  onPick: (point: ImagePoint, hex: string) => void;
  onPickConfirm?: (point: ImagePoint, hex: string) => void;
  onMarkerMove: (id: string, point: ImagePoint, hex: string) => void;
  onMarkerRemove?: (id: string) => void;
  /** Shown next to the color in the hover loupe, e.g. "click to add". */
  hoverHint?: string;
  highlightedId?: string | null;
  onHighlightChange?: (id: string | null) => void;
  error?: string | null;
  className?: string;
}

/**
 * Image with color markers: hover shows a magnified preview of the color under the cursor,
 * markers can be dragged (live re-pick), selected, and removed. Shared by the image palette
 * page and the single-color "pick from image" dialog.
 */
const ImageColorCanvas: React.FC<ImageColorCanvasProps> = ({
  image,
  sampler,
  markers,
  onPick,
  onPickConfirm,
  onMarkerMove,
  onMarkerRemove,
  hoverHint,
  highlightedId,
  onHighlightChange,
  error,
  className,
}) => {
  const [hoverPoint, setHoverPoint] = useState<ImagePoint | null>(null);
  const [isOverMarker, setIsOverMarker] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const dragging = markers.find(m => m.id === draggingId);
  const loupe = dragging
    ? { point: dragging.point, color: dragging.color, hint: undefined }
    : hoverPoint && sampler && !isOverMarker
      ? { point: hoverPoint, color: sampler.sampleAt(hoverPoint), hint: hoverHint }
      : null;

  const pickAt = (point: ImagePoint, handler?: (p: ImagePoint, hex: string) => void) => {
    if (!sampler || !handler) return;
    // Clicking away from a selected marker just deselects it (standard "click outside" behavior).
    if (selectedId) {
      setSelectedId(null);
      return;
    }
    handler(point, sampler.sampleAt(point));
  };

  return (
    <div
      className={cn('relative h-full w-full bg-gray-100', className)}
      onKeyDown={e => e.key === 'Escape' && selectedId && (e.stopPropagation(), setSelectedId(null))}
    >
      <ImageStage
        image={image}
        onStageClick={point => pickAt(point, onPick)}
        onStageDoubleClick={onPickConfirm && (point => pickAt(point, onPickConfirm))}
        onStageHover={setHoverPoint}
      >
        {markers.map(marker => (
          <ColorMarker
            key={marker.id}
            point={marker.point}
            color={marker.color}
            label={marker.label}
            badge={marker.badge}
            locked={marker.locked}
            adjusted={marker.adjusted}
            highlighted={highlightedId === marker.id || draggingId === marker.id}
            selected={selectedId === marker.id}
            // Selecting only matters for removal (shows the × button, enables Delete).
            onSelect={onMarkerRemove && (() => setSelectedId(prev => (prev === marker.id ? null : marker.id)))}
            onDrag={point => sampler && onMarkerMove(marker.id, point, sampler.sampleAt(point))}
            onDragStateChange={isDragging => {
              setDraggingId(isDragging ? marker.id : null);
              // The pointer ends the drag on top of the marker (pointerenter doesn't fire during capture).
              if (!isDragging) setIsOverMarker(true);
            }}
            onRemove={
              onMarkerRemove &&
              (() => {
                setSelectedId(null);
                setIsOverMarker(false);
                onHighlightChange?.(null);
                onMarkerRemove(marker.id);
              })
            }
            onHoverChange={hovering => {
              setIsOverMarker(hovering);
              onHighlightChange?.(hovering ? marker.id : null);
            }}
          />
        ))}
        {loupe && <Loupe point={loupe.point} color={loupe.color} hint={loupe.hint} />}
      </ImageStage>

      {!sampler && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-gray-700 shadow">
            {error ? (
              <span className="text-destructive">{error}</span>
            ) : (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing image…
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageColorCanvas;
