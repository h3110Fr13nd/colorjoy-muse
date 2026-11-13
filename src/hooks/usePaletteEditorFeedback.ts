import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import type { PaletteEditorState } from '@/hooks/usePaletteEditor';

/**
 * Add/remove with the same behavior everywhere (palette columns, image markers, ...).
 * Successful adds/removes are visible immediately, so only the blocked case shows a message
 * (success toasts used to cover dialog buttons).
 */
export const usePaletteEditorFeedback = ({ removeColor }: PaletteEditorState) => {
  const remove = useCallback(
    (id: string) => {
      const removed = removeColor(id);
      if (!removed) {
        toast({
          title: 'Cannot Remove',
          description: 'Your palette must have at least one color.',
          variant: 'destructive',
          duration: 2000,
        });
      }
      return removed;
    },
    [removeColor]
  );

  return { removeColor: remove };
};
