import React, { useRef } from 'react';
import { cn } from '@/lib/utils';
import { normalizeHex } from '@/utils/colorUtils';
import { useInlineEdit } from '@/hooks/useInlineEdit';
import WithTooltip from '@/components/common/WithTooltip';
import ColorPickerPopover from './ColorPickerPopover';
import type { ContrastClasses } from './contrast';

interface HexCodeEditorProps {
  color: string;
  contrast: ContrastClasses;
  onChange: (hex: string) => void;
  className?: string;
}

const hexTextClasses = 'hex-display tabular-nums text-lg md:text-xl lg:text-2xl font-bold uppercase';

/**
 * Click the hex code to edit it. Every valid value typed (#RGB or #RRGGBB, "#" optional)
 * is applied immediately; Escape restores the original color, invalid input is discarded.
 */
const HexCodeEditor: React.FC<HexCodeEditorProps> = ({ color, contrast, onChange, className }) => {
  const originalRef = useRef(color);

  const { isEditing, draft, start, inputProps } = useInlineEdit({
    value: color.toUpperCase(),
    onDraftChange: draft => {
      const normalized = normalizeHex(draft);
      if (normalized) onChange(normalized);
    },
    onCancel: () => onChange(originalRef.current),
  });

  const handleStart = () => {
    originalRef.current = color;
    start();
  };

  const isInvalid = isEditing && normalizeHex(draft) === null;

  return (
    <div className={cn('hex-row flex max-w-full items-center gap-1', className)}>
      {isEditing ? (
        <input
          {...inputProps}
          aria-label="Hex color code"
          aria-invalid={isInvalid}
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          className={cn(
            hexTextClasses,
            contrast.text,
            'w-[6.5em] min-w-0 max-w-full rounded-md bg-white/15 px-1 text-center outline-none ring-2 transition-shadow',
            isInvalid ? 'ring-red-500' : contrast.isLight ? 'ring-black/30' : 'ring-white/60'
          )}
        />
      ) : (
        <WithTooltip label="Click to edit hex code">
          <button
            type="button"
            onClick={handleStart}
            aria-label={`Hex code ${color.toUpperCase()}. Click to edit`}
            className={cn(hexTextClasses, contrast.text, contrast.hover, 'rounded-md px-1 text-center')}
          >
            {color.toUpperCase()}
          </button>
        </WithTooltip>
      )}
      <ColorPickerPopover color={color} contrast={contrast} onChange={onChange} />
    </div>
  );
};

export default HexCodeEditor;
