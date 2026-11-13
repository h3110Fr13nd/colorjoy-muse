import React, { useRef } from 'react';
import { Lock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImagePoint } from '@/utils/imagePalette';
import { getContrastClasses } from '@/components/color/contrast';
import { findStage, pointFromClient, useImageStage } from './stage';

interface ColorMarkerProps {
  point: ImagePoint;
  color: string;
  /** Accessible name, e.g. "Color 2, #AABBCC". */
  label: string;
  /** Number shown inside the marker (matches the palette column). */
  badge?: React.ReactNode;
  locked?: boolean;
  /** Color was edited by hand after being picked. */
  adjusted?: boolean;
  highlighted?: boolean;
  selected?: boolean;
  onDrag?: (point: ImagePoint) => void;
  onDragStateChange?: (dragging: boolean) => void;
  onSelect?: () => void;
  onRemove?: () => void;
  onHoverChange?: (hovering: boolean) => void;
}

const DRAG_THRESHOLD_PX = 3;
const NUDGE = 0.005;
const REMOVE_BUTTON_ROOM = 44;
const COMPACT_STAGE_WIDTH = 420;
const NUDGE_LARGE = 0.05;

/**
 * Circle marking where a color was picked. Drag (mouse/touch/pen) to re-pick, click to select,
 * right-click or Delete to remove, arrow keys to nudge.
 */
const ColorMarker: React.FC<ColorMarkerProps> = ({
  point,
  color,
  label,
  badge,
  locked,
  adjusted,
  highlighted,
  selected,
  onDrag,
  onDragStateChange,
  onSelect,
  onRemove,
  onHoverChange,
}) => {
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const contrast = getContrastClasses(color);
  const stage = useImageStage();
  // Put the remove button where there is room: above-right by default, flipped near the top/right edge.
  const removeBelow = point.y * stage.height < REMOVE_BUTTON_ROOM;
  const removeLeft = (1 - point.x) * stage.width < REMOVE_BUTTON_ROOM;
  // Smaller markers on small images, so neighbouring picks collide less.
  const compact = stage.width < COMPACT_STAGE_WIDTH;

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus({ preventScroll: true });
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const state = drag.current;
    if (!state || !onDrag) return;
    if (!state.moved) {
      if (Math.hypot(e.clientX - state.x, e.clientY - state.y) < DRAG_THRESHOLD_PX) return;
      state.moved = true;
      onDragStateChange?.(true);
    }
    const stage = findStage(e.currentTarget);
    if (stage) onDrag(pointFromClient(e.clientX, e.clientY, stage));
  };

  const endDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    const state = drag.current;
    drag.current = null;
    if (!state) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (state.moved) onDragStateChange?.(false);
    else if (e.type === 'pointerup') onSelect?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && onRemove) {
      e.preventDefault();
      onRemove();
      return;
    }
    const step = e.shiftKey ? NUDGE_LARGE : NUDGE;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (delta[e.key] && onDrag) {
      e.preventDefault();
      const [dx, dy] = delta[e.key];
      onDrag({ x: Math.min(1, Math.max(0, point.x + dx)), y: Math.min(1, Math.max(0, point.y + dy)) });
    }
  };

  return (
    <div
      className={cn('absolute', (highlighted || selected) && 'z-10')}
      style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
    >
      <button
        type="button"
        aria-label={label}
        title={`${label}${adjusted ? ' (edited)' : ''}`}
        aria-pressed={selected}
        className={cn(
          'absolute -translate-x-1/2 -translate-y-1/2 touch-none rounded-full border-white',
          compact ? 'h-6 w-6 border-2 text-[10px]' : 'h-8 w-8 border-[3px] text-xs',
          'flex cursor-grab items-center justify-center font-bold active:cursor-grabbing',
          'shadow-[0_0_0_1px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.35)] transition-transform duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          adjusted && 'border-dashed',
          (highlighted || selected) && 'scale-125',
          selected && 'ring-2 ring-blue-500 ring-offset-2',
          contrast.text
        )}
        style={{ backgroundColor: color }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        // Single clicks must not reach the image (they would add a color); double-clicks may,
        // so "double-click to pick & apply" still works when the marker sits under the cursor.
        onClick={e => e.stopPropagation()}
        onContextMenu={e => {
          e.preventDefault();
          e.stopPropagation();
          onRemove?.();
        }}
        onKeyDown={handleKeyDown}
        onPointerEnter={() => onHoverChange?.(true)}
        onPointerLeave={() => onHoverChange?.(false)}
      >
        {badge}
      </button>

      {locked && (
        <span className="pointer-events-none absolute left-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-white shadow">
          <Lock className="h-2.5 w-2.5" />
        </span>
      )}

      {selected && onRemove && (
        <button
          type="button"
          aria-label={`Remove ${label}`}
          title="Remove color"
          className={cn(
            'absolute flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-800 shadow-md ring-1 ring-black/10 hover:bg-red-50 hover:text-red-600',
            removeBelow ? 'top-3' : '-top-9',
            removeLeft ? '-left-8' : 'left-2'
          )}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export default ColorMarker;
