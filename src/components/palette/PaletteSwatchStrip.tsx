import React from 'react';
import { cn } from '@/lib/utils';
import { getContrastClasses } from '@/components/color/contrast';

interface PaletteSwatchStripProps {
  colors: string[];
  /** When provided, swatches become buttons (e.g. click to copy) that expand on hover. */
  onSwatchClick?: (hex: string) => void;
  swatchLabel?: (hex: string) => string;
  className?: string;
}

/** Compact horizontal preview of a palette. */
const PaletteSwatchStrip: React.FC<PaletteSwatchStripProps> = ({
  colors,
  onSwatchClick,
  swatchLabel = hex => `Copy ${hex}`,
  className,
}) => (
  <div className={cn('flex h-24 w-full overflow-hidden', className)}>
    {colors.map((color, index) => {
      const hex = color.toUpperCase();
      const contrast = getContrastClasses(color);

      if (!onSwatchClick) {
        return <div key={`${index}-${color}`} className="flex-1" style={{ backgroundColor: color }} />;
      }

      return (
        <button
          key={`${index}-${color}`}
          type="button"
          onClick={() => onSwatchClick(hex)}
          aria-label={swatchLabel(hex)}
          title={swatchLabel(hex)}
          className={cn(
            'group/swatch relative flex min-w-0 flex-1 items-end justify-center overflow-hidden pb-2',
            'transition-[flex-grow,min-width] duration-300 ease-out focus-visible:outline-none',
            // The active swatch grows and never gets narrower than its hex label,
            // no matter how many colors share the strip.
            'hover:flex-[2] hover:min-w-[4.75rem] focus-visible:flex-[2] focus-visible:min-w-[4.75rem]'
          )}
          style={{ backgroundColor: color }}
        >
          <span
            className={cn(
              'whitespace-nowrap px-1 font-mono text-[11px] font-semibold tracking-wide opacity-0 transition-opacity group-hover/swatch:opacity-100 group-focus-visible/swatch:opacity-100',
              contrast.text
            )}
          >
            {hex}
          </span>
        </button>
      );
    })}
  </div>
);

export default PaletteSwatchStrip;
