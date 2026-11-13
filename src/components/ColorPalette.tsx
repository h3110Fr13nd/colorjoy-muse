import React, { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { fromStoredColors, toPaletteColors, type PaletteColor } from '@/lib/palette';
import { parsePaletteFromURL } from '@/utils/colorUtils';
import { workingPaletteStorage } from '@/utils/paletteStorage';
import { createRandomPalette, usePaletteEditor } from '@/hooks/usePaletteEditor';
import { useSpacebarShortcut } from '@/hooks/useSpacebarShortcut';
import { usePaletteHeaderActions } from '@/hooks/usePaletteHeaderActions';
import AppHeader from '@/components/layout/AppHeader';
import TipsBar from '@/components/layout/TipsBar';
import PaletteEditor from '@/components/palette/PaletteEditor';

/** Shared link (?palette=...) > palette from this tab's session > fresh random palette. */
const loadInitialPalette = (): PaletteColor[] => {
  const fromUrl = parsePaletteFromURL();
  if (fromUrl) return toPaletteColors(fromUrl);

  const fromSession = workingPaletteStorage.load();
  if (fromSession) return fromStoredColors(fromSession.colors);

  return createRandomPalette();
};

/** The random palette generator page. */
const ColorPalette: React.FC = () => {
  const editor = usePaletteEditor(loadInitialPalette);
  const { actions, saveDialog } = usePaletteHeaderActions(editor);

  useSpacebarShortcut(editor.generate);

  useEffect(() => {
    workingPaletteStorage.save(editor.colors);
  }, [editor.colors]);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <AppHeader actions={actions} />

      <TipsBar>
        <p className="spacebar-hint md:hidden">
          Tap <RefreshCw className="inline h-3.5 w-3.5 align-[-2px]" aria-label="Generate" /> for new colors · tap a
          hex code to edit it
        </p>
        <p className="spacebar-hint hidden md:block">
          Press the <kbd className="mx-1 rounded bg-white px-2 py-1 shadow-sm">spacebar</kbd> to generate new color
          palettes! Click a hex code to edit it.
        </p>
      </TipsBar>

      <PaletteEditor editor={editor} className="min-h-0 flex-1" />

      {saveDialog}
    </div>
  );
};

export default ColorPalette;
