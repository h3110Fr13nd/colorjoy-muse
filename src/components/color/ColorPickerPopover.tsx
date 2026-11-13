import React, { useState } from 'react';
import { ImageIcon, Pipette, SwatchBook } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import WithTooltip from '@/components/common/WithTooltip';
import ImageColorPickerDialog from '@/components/image/ImageColorPickerDialog';
import type { ContrastClasses } from './contrast';

interface ColorPickerPopoverProps {
  color: string;
  contrast: ContrastClasses;
  onChange: (hex: string) => void;
}

// Native screen eyedropper (Chromium). Not in TypeScript's DOM lib yet.
interface EyeDropperApi {
  open: () => Promise<{ sRGBHex: string }>;
}
const EyeDropperCtor = (window as unknown as { EyeDropper?: new () => EyeDropperApi }).EyeDropper;

const optionClasses =
  'relative flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-2 py-2 text-left text-sm outline-none transition-colors hover:bg-accent focus-visible:bg-accent [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-muted-foreground';

/**
 * Color picker menu for a color column: native color picker, pick from an image,
 * or (where supported) pick from anywhere on screen.
 */
const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({ color, contrast, onChange }) => {
  const [open, setOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const pickFromScreen = async () => {
    if (!EyeDropperCtor) return;
    setOpen(false);
    try {
      const { sRGBHex } = await new EyeDropperCtor().open();
      onChange(sRGBHex);
    } catch {
      // User cancelled (Escape).
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <WithTooltip label="Color picker">
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Color picker"
              className={cn(
                'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current',
                contrast.hover,
                contrast.text
              )}
            >
              <Pipette className="h-4 w-4" aria-hidden />
            </button>
          </PopoverTrigger>
        </WithTooltip>

        <PopoverContent align="center" className="w-60 p-1.5">
          <p className="px-2 pb-1 pt-1.5 text-xs font-medium text-muted-foreground">Pick a color</p>

          {/* Transparent native input on top of the row: clicking anywhere on it opens the OS picker. */}
          <div className={optionClasses}>
            <span className="h-4 w-4 rounded-full ring-1 ring-black/15" style={{ backgroundColor: color }} />
            Custom color…
            <SwatchBook className="ml-auto" />
            <input
              type="color"
              aria-label="Custom color"
              value={color.toLowerCase()}
              onChange={e => onChange(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>

          <button
            type="button"
            className={optionClasses}
            onClick={() => {
              setOpen(false);
              setImageDialogOpen(true);
            }}
          >
            <ImageIcon /> From an image…
          </button>

          {EyeDropperCtor && (
            <button type="button" className={optionClasses} onClick={pickFromScreen}>
              <Pipette /> From the screen
            </button>
          )}
        </PopoverContent>
      </Popover>

      <ImageColorPickerDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        currentColor={color}
        onPick={onChange}
      />
    </>
  );
};

export default ColorPickerPopover;
