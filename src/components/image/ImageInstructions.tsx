import React from 'react';
import { Hand, MousePointerClick, Move, Pointer, RefreshCw, Trash2 } from 'lucide-react';

const Tip: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:shrink-0 [&_svg]:text-blue-600">
    {icon}
    {children}
  </span>
);

const kbd = 'rounded bg-white px-1.5 py-0.5 text-[11px] shadow-sm';

/** How to use the image canvas, adapted to mouse vs. touch devices. */
const ImageInstructions: React.FC = () => (
  <>
    {/* Mouse / trackpad */}
    <div className="hidden flex-wrap items-center justify-center gap-x-5 gap-y-1 [@media(pointer:fine)]:flex">
      <Tip icon={<MousePointerClick />}>Click the image to add a color</Tip>
      <Tip icon={<Move />}>Drag a marker to re-pick</Tip>
      <Tip icon={<Trash2 />}>
        Right-click a marker (or select it + <kbd className={kbd}>Del</kbd>) to remove
      </Tip>
      <span className="hidden md:inline-flex">
        <Tip icon={<RefreshCw />}>
          <kbd className={kbd}>Space</kbd> for a new palette from the image
        </Tip>
      </span>
    </div>
    {/* Touch */}
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 [@media(pointer:fine)]:hidden">
      <Tip icon={<Pointer />}>Tap to add</Tip>
      <Tip icon={<Hand />}>Drag a marker to re-pick</Tip>
      <Tip icon={<Trash2 />}>Tap a marker, then × to remove</Tip>
    </div>
  </>
);

export default ImageInstructions;
