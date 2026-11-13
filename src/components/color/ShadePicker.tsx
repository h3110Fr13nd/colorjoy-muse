import React, { useEffect, useMemo, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateShades } from '@/utils/colorUtils';
import { getContrastClasses } from './contrast';

interface ShadePickerProps {
  color: string;
  onSelect: (hex: string) => void;
  onClose: () => void;
}

/**
 * Tints & shades of the column color, shown *inside* the column (so it can never spill into
 * neighbors): vertical in desktop columns, horizontal in mobile rows. Each swatch uses its own
 * readable text color. Close with the header ×, Escape, or by clicking outside.
 */
const ShadePicker: React.FC<ShadePickerProps> = ({ color, onSelect, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);
  // Frozen while open so the list doesn't shift under the pointer.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shades = useMemo(() => generateShades(color), []);
  const current = shades.indexOf(color.toUpperCase());
  const header = getContrastClasses(color);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [onClose]);

  const focusSwatch = (index: number) => {
    const buttons = ref.current?.querySelectorAll<HTMLButtonElement>('[data-shade]');
    buttons?.[Math.max(0, Math.min(shades.length - 1, index))]?.focus();
  };

  return (
    <div
      ref={ref}
      role="group"
      aria-label="Shades"
      className="absolute inset-0 z-20 flex flex-row overflow-hidden animate-fade-in md:flex-col"
      style={{ backgroundColor: color }}
      onKeyDown={e => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
          return;
        }
        const index = Number((e.target as HTMLElement).dataset.shade);
        if (Number.isNaN(index)) return;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') focusSwatch(index + 1);
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') focusSwatch(index - 1);
        else return;
        e.preventDefault();
      }}
    >
      {/* Header bar (its own space: nothing overlays a swatch). */}
      <div
        className={cn(
          'shades-header order-last flex shrink-0 flex-col items-center justify-center gap-1 px-1 md:order-first md:flex-row md:justify-between md:px-3 md:py-1.5',
          header.text
        )}
      >
        <span className="shades-label hidden text-xs font-semibold uppercase tracking-wide md:inline">Shades</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close shades"
          className={cn('flex h-7 w-7 items-center justify-center rounded-full', header.hover)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {shades.map((shade, i) => {
        const contrast = getContrastClasses(shade);
        const isCurrent = i === current;
        return (
          <button
            key={`${i}-${shade}`}
            type="button"
            data-shade={i}
            autoFocus={isCurrent}
            aria-label={`Use ${shade}${isCurrent ? ' (current)' : ''}`}
            aria-current={isCurrent || undefined}
            title={shade}
            onClick={() => {
              onSelect(shade);
              onClose();
            }}
            className={cn(
              'group relative flex min-h-0 min-w-0 flex-1 items-center justify-center outline-none',
              'transition-[flex-grow] duration-200 hover:flex-[1.8] focus-visible:flex-[1.8]',
              contrast.text
            )}
            style={{ backgroundColor: shade }}
          >
            <span
              className={cn(
                'flex items-center gap-1 whitespace-nowrap font-mono text-[11px] font-semibold',
                isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
                'max-md:hidden'
              )}
            >
              {isCurrent && <Check className="h-3 w-3" />}
              {shade}
            </span>
            {isCurrent && <Check className="h-4 w-4 md:hidden" />}
          </button>
        );
      })}
    </div>
  );
};

export default ShadePicker;
