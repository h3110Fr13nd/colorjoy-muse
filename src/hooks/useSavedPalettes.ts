import { useCallback, useSyncExternalStore } from 'react';
import { useToast } from '@/hooks/use-toast';
import { paletteStore, type SavedPalette } from '@/utils/paletteStorage';
import { generatePaletteName } from '@/utils/paletteNames';

/**
 * Reactive access to palettes saved in localStorage. Every component using this hook
 * (header badge, saved page, dialogs) sees the same data and updates together.
 */
export const useSavedPalettes = () => {
  const palettes = useSyncExternalStore(paletteStore.subscribe, paletteStore.getSnapshot);
  const { toast } = useToast();

  const reportError = useCallback(
    (err: unknown) => {
      console.error('Saved palettes storage error:', err);
      toast({
        title: 'Could not update saved palettes',
        description: 'Your browser storage may be full or disabled.',
        variant: 'destructive',
      });
    },
    [toast]
  );

  const suggestName = useCallback(
    () => generatePaletteName(paletteStore.getSnapshot().map(p => p.name)),
    []
  );

  /** Saves a palette; blank names get a random one. Returns the saved palette, or null on failure. */
  const savePalette = useCallback(
    (colors: string[], name?: string): SavedPalette | null => {
      try {
        return paletteStore.add(name?.trim() || suggestName(), colors);
      } catch (err) {
        reportError(err);
        return null;
      }
    },
    [reportError, suggestName]
  );

  const updatePalette = useCallback(
    (id: string, changes: Partial<Pick<SavedPalette, 'name' | 'colors'>>): boolean => {
      try {
        paletteStore.update(id, changes);
        return true;
      } catch (err) {
        reportError(err);
        return false;
      }
    },
    [reportError]
  );

  const deletePalette = useCallback(
    (id: string): boolean => {
      try {
        paletteStore.remove(id);
        return true;
      } catch (err) {
        reportError(err);
        return false;
      }
    },
    [reportError]
  );

  return { palettes, savePalette, updatePalette, deletePalette, suggestName };
};
