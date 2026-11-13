import React, { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { getColorName, hexToRgbString } from '@/utils/colorUtils';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { getContrastClasses } from './contrast';
import ColorColumnToolbar from './ColorColumnToolbar';
import ShadePicker from './ShadePicker';
import HexCodeEditor from './HexCodeEditor';

export interface ColorColumnProps {
  color: string;
  locked: boolean;
  onLockToggle: () => void;
  onColorChange: (newColor: string) => void;
  onRemove: () => void;
  /** Emphasize the column (e.g. while its image marker is hovered). */
  highlighted?: boolean;
  className?: string;
}

/**
 * One swatch of an editable palette. Rows on small screens, full-height columns from `md` up.
 */
const ColorColumn: React.FC<ColorColumnProps> = ({
  color,
  locked,
  onLockToggle,
  onColorChange,
  onRemove,
  highlighted = false,
  className,
}) => {
  const [showShades, setShowShades] = useState(false);
  const closeShades = useCallback(() => setShowShades(false), []);
  const copy = useCopyToClipboard();
  const contrast = getContrastClasses(color);
  const hex = color.toUpperCase();

  return (
    <div
      className={cn('color-column relative h-full w-full', className)}
      data-shades={showShades || undefined}
      style={{
        backgroundColor: color,
        boxShadow: highlighted
          ? `inset 0 0 0 4px ${contrast.isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.75)'}`
          : undefined,
      }}
    >
      {/*
        Layout body (the outer element is the size container for the responsive rules in index.css).
        Desktop: toolbar in the top half, color info in the bottom half; the band in the middle stays
        free for the "+" buttons between columns, so they never cover a control.
        Inert while the shade picker covers it (no tabbing into hidden controls).
      */}
      <div
        className="color-column-body flex h-full w-full flex-row items-center justify-between gap-3 px-4 py-3 md:flex-col md:gap-0 md:px-2 md:py-10"
        {...(showShades ? { inert: '', 'aria-hidden': true } : {})}
      >
      {/* Actions: right side on mobile, top area on desktop */}
      <div className="color-actions-area order-2 flex shrink-0 flex-col items-end justify-center md:order-1 md:w-full md:flex-1 md:basis-0 md:items-center md:pb-7">
        <div className="color-actions">
          <ColorColumnToolbar
            locked={locked}
            showShades={showShades}
            contrast={contrast}
            onLockToggle={onLockToggle}
            onCopyHex={() => copy(hex)}
            onCopyRgb={() => copy(hexToRgbString(color))}
            onRemove={onRemove}
            onToggleShades={() => setShowShades(prev => !prev)}
          />
        </div>
      </div>

      {/* Color info: left side on mobile, bottom on desktop */}
      <div className="color-info order-1 flex min-w-0 max-w-full flex-col items-start md:order-2 md:w-full md:flex-1 md:basis-0 md:items-center md:justify-end md:pt-7">
        <HexCodeEditor color={color} contrast={contrast} onChange={onColorChange} className="mb-1 md:mb-2" />
        <p
          className={cn('color-name max-w-full truncate px-1 text-sm', contrast.text)}
          style={{ opacity: contrast.secondaryOpacity }}
          title={getColorName(color)}
        >
          {getColorName(color)}
        </p>
      </div>
      </div>

      {showShades && <ShadePicker color={color} onSelect={onColorChange} onClose={closeShades} />}
    </div>
  );
};

export default ColorColumn;
