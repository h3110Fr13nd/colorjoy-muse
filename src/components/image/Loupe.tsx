import React from 'react';
import { createPortal } from 'react-dom';
import type { ImagePoint } from '@/utils/imagePalette';
import { useImageStage } from './stage';

interface LoupeProps {
  point: ImagePoint;
  color: string;
  hint?: string;
}

const SIZE = 104;
const ZOOM = 5;
const OFFSET = 28; // distance from the point (keeps it clear of a finger / the cursor)
const CHIP_HEIGHT = 22;
const GAP = 6;
const HALF_WIDTH = 90; // half of the widest part (hex chip with hint)
const MARGIN = 8;

/**
 * Magnifier with the color under the point. Rendered in a portal with fixed positioning so no
 * panel, dialog or scroll container can clip or cover it; placed above the point when there is
 * room in the viewport (so a finger doesn't hide it), otherwise below, and kept on screen.
 */
const Loupe: React.FC<LoupeProps> = ({ point, color, hint }) => {
  const { width, height, src, element } = useImageStage();
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  const x = rect.left + point.x * rect.width;
  const y = rect.top + point.y * rect.height;
  const total = SIZE + GAP + CHIP_HEIGHT;
  const fitsAbove = y - OFFSET - total >= MARGIN;
  const fitsBelow = y + OFFSET + total <= window.innerHeight - MARGIN;
  const below = !fitsAbove && fitsBelow;
  const left = Math.min(Math.max(x, HALF_WIDTH + MARGIN), window.innerWidth - HALF_WIDTH - MARGIN);
  const top = below ? y + OFFSET : fitsAbove ? y - OFFSET - total : MARGIN;

  const px = point.x * width;
  const py = point.y * height;

  return createPortal(
    <div
      data-loupe=""
      aria-hidden
      className="pointer-events-none fixed z-[60] flex -translate-x-1/2 flex-col items-center gap-1.5"
      style={{ left, top }}
    >
      {below && <HexChip color={color} hint={hint} />}
      <div
        className="relative overflow-hidden rounded-full border-4 border-white shadow-xl ring-1 ring-black/20"
        style={{
          width: SIZE,
          height: SIZE,
          backgroundColor: color,
          backgroundImage: `url(${src})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${width * ZOOM}px ${height * ZOOM}px`,
          backgroundPosition: `${SIZE / 2 - px * ZOOM}px ${SIZE / 2 - py * ZOOM}px`,
          imageRendering: 'pixelated',
        }}
      >
        <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]" />
      </div>
      {!below && <HexChip color={color} hint={hint} />}
    </div>,
    document.body
  );
};

const HexChip: React.FC<{ color: string; hint?: string }> = ({ color, hint }) => (
  <div
    className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gray-900/90 px-2 py-0.5 text-[11px] font-medium text-white shadow"
    style={{ height: CHIP_HEIGHT }}
  >
    <span className="h-3 w-3 rounded-full ring-1 ring-white/60" style={{ backgroundColor: color }} />
    <span className="font-mono">{color.toUpperCase()}</span>
    {hint && <span className="text-white/70">· {hint}</span>}
  </div>
);

export default Loupe;
