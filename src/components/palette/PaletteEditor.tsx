import React from 'react';
import { cn } from '@/lib/utils';
import type { PaletteEditorState } from '@/hooks/usePaletteEditor';
import { usePaletteEditorFeedback } from '@/hooks/usePaletteEditorFeedback';
import ColorColumn from '@/components/color/ColorColumn';
import AddColorButton from './AddColorButton';

interface PaletteEditorProps {
  editor: PaletteEditorState;
  /** Color to emphasize (e.g. its marker is hovered on an image). */
  highlightedId?: string | null;
  /** Reports which color the pointer is over, for linking with other views. */
  onHighlightChange?: (id: string | null) => void;
  className?: string;
}

/**
 * The interactive palette surface (columns + add buttons). Shared by the generator, the image
 * palette page and the saved-palette editor so editing behaves the same everywhere.
 */
const PaletteEditor: React.FC<PaletteEditorProps> = ({ editor, highlightedId, onHighlightChange, className }) => {
  const { colors, isGenerating, toggleLock, updateColor, addColor: handleAdd } = editor;
  const { removeColor: handleRemove } = usePaletteEditorFeedback(editor);

  return (
    <div
      className={cn(
        // Columns never get narrower than 48px; with very many colors the editor scrolls sideways.
        'group/editor relative flex w-full flex-col overflow-y-auto overscroll-contain md:flex-row md:overflow-x-auto md:overflow-y-hidden',
        className
      )}
    >
      {colors.map((color, index) => (
        <div
          key={color.id}
          className="palette-slot relative min-h-[120px] min-w-0 flex-1 md:min-h-0 md:min-w-[48px]"
          onPointerEnter={onHighlightChange && (() => onHighlightChange(color.id))}
          onPointerLeave={onHighlightChange && (() => onHighlightChange(null))}
        >
          {index === 0 && <AddColorButton placement="start" onClick={() => handleAdd(0)} />}

          <ColorColumn
            color={color.hex}
            locked={color.locked}
            onLockToggle={() => toggleLock(color.id)}
            onColorChange={hex => updateColor(color.id, hex)}
            onRemove={() => handleRemove(color.id)}
            highlighted={highlightedId === color.id}
            className={isGenerating && !color.locked ? 'animate-color-change' : ''}
          />

          <AddColorButton
            placement={index === colors.length - 1 ? 'end' : 'between'}
            onClick={() => handleAdd(index + 1)}
          />
        </div>
      ))}
    </div>
  );
};

export default PaletteEditor;
