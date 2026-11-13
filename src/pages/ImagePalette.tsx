import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ImageIcon, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import SplitHandle from '@/components/layout/SplitHandle';
import {
  createImageStrategy,
  fromStoredColors,
  randomStrategy,
  toPaletteColors,
  type PaletteColor,
} from '@/lib/palette';
import { paletteImageStore } from '@/utils/imageSourceStore';
import { imagePaletteStorage } from '@/utils/paletteStorage';
import { DEFAULT_PALETTE_SIZE, usePaletteEditor } from '@/hooks/usePaletteEditor';
import { usePaletteEditorFeedback } from '@/hooks/usePaletteEditorFeedback';
import { usePaletteHeaderActions } from '@/hooks/usePaletteHeaderActions';
import { useSpacebarShortcut } from '@/hooks/useSpacebarShortcut';
import { useImageSource } from '@/hooks/useImageSource';
import { useImageSampler } from '@/hooks/useImageSampler';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import AppHeader from '@/components/layout/AppHeader';
import TipsBar from '@/components/layout/TipsBar';
import type { HeaderAction } from '@/components/layout/headerActions';
import PaletteEditor from '@/components/palette/PaletteEditor';
import ImageColorCanvas, { type CanvasMarker } from '@/components/image/ImageColorCanvas';
import ImageDropTarget from '@/components/image/ImageDropTarget';
import ImageDropzone from '@/components/image/ImageDropzone';
import ImageInstructions from '@/components/image/ImageInstructions';

/** Restore this tab's palette only if it was picked from the image currently loaded. */
const loadInitialPalette = (): PaletteColor[] => {
  const stored = imagePaletteStorage.load();
  const image = paletteImageStore.getSnapshot();
  if (stored && image && stored.imageId === image.id) return fromStoredColors(stored.colors);
  return toPaletteColors(Array(DEFAULT_PALETTE_SIZE).fill('#FFFFFF'));
};

/** "From Image" page: extract a palette from an image, then refine it on the image or in the palette. */
const ImagePalette: React.FC = () => {
  const [image, setImage] = useImageSource(paletteImageStore);
  const { sampler, error } = useImageSampler(image);
  const candidates = useMemo(() => sampler?.getCandidates() ?? null, [sampler]);
  const strategy = useMemo(() => (candidates ? createImageStrategy(candidates) : randomStrategy), [candidates]);

  const editor = usePaletteEditor(loadInitialPalette, strategy);
  const { removeColor } = usePaletteEditorFeedback(editor);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const upload = useImageUpload(setImage);

  // Extract a fresh palette whenever a new image is ready (not when restoring this tab's session).
  const extractedForRef = useRef<string | null>(imagePaletteStorage.load()?.imageId ?? null);
  const colorsRef = useRef(editor.colors);
  colorsRef.current = editor.colors;
  const { replaceColors } = editor;
  useEffect(() => {
    if (!image || !candidates || extractedForRef.current === image.id) return;
    extractedForRef.current = image.id;

    // Locked colors survive a new image, but no longer point at a place in it.
    const base = colorsRef.current.map(c => (c.locked ? { id: c.id, hex: c.hex, locked: true } : c));
    const next = createImageStrategy(candidates).regenerate(base, { jitter: 0 });
    replaceColors(() => next);

    const picked = next.filter(c => !c.locked).map(c => c.hex);
    const distinct = new Set(picked).size;
    if (distinct < picked.length) {
      toast({
        title: `Only ${distinct} distinct ${distinct === 1 ? 'color' : 'colors'} found`,
        description: 'This image has few colors, so some repeat. Remove the extras or pick your own on the image.',
        duration: 5000,
      });
    }
  }, [image, candidates, replaceColors]);

  useEffect(() => {
    if (image) imagePaletteStorage.save(editor.colors, image.id);
  }, [editor.colors, image]);

  useSpacebarShortcut(editor.generate, Boolean(candidates));

  const replaceImageAction: HeaderAction = {
    id: 'replace-image',
    label: 'New Image',
    tooltip: 'Use a different image (or drop/paste one)',
    icon: <ImagePlus />,
    onClick: upload.openFilePicker,
    priority: 'secondary',
  };
  const { actions, saveDialog } = usePaletteHeaderActions(editor, {
    extraActions: [replaceImageAction],
    generateTooltip: 'New palette from this image (or press Spacebar)',
  });
  const headerActions: HeaderAction[] = image
    ? actions
    : [{ ...replaceImageAction, label: 'Upload Image', tooltip: 'Choose an image', priority: 'primary', emphasis: true }];

  const markers: CanvasMarker[] = editor.colors.flatMap((color, index) =>
    color.source
      ? [
          {
            id: color.id,
            point: color.source,
            color: color.hex,
            label: `Color ${index + 1}, ${color.hex}`,
            badge: index + 1,
            locked: color.locked,
            adjusted: color.adjusted,
          },
        ]
      : []
  );

  // Side by side on large screens, stacked (image on top) otherwise.
  const isWide = useMediaQuery('(min-width: 1024px)');
  const direction = isWide ? 'horizontal' : 'vertical';

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <AppHeader actions={headerActions} />

      {!image ? (
        <main className="min-h-0 flex-1 overflow-y-auto bg-gray-50">
          <ImageDropzone
            onBrowse={upload.openFilePicker}
            onFile={upload.loadFile}
            isLoading={upload.isLoading}
            title="Create a palette from an image"
            description="Drop a photo, screenshot or artwork here. We’ll pick a varied palette from its colors — then refine it right on the image."
          />
        </main>
      ) : (
        <>
          <TipsBar>
            <ImageInstructions />
          </TipsBar>

          <ResizablePanelGroup
            key={direction}
            direction={direction}
            autoSaveId={`colorjoy-image-split-${direction}`}
            className="min-h-0 flex-1"
          >
            <ResizablePanel defaultSize={isWide ? 50 : 45} minSize={20} className="min-h-0 min-w-0">
              <div className="flex h-full flex-col">
                {/* Pane toolbar: keeps controls off the image (nothing floats over markers). */}
                <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-white px-3">
                  <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground" title={image.name}>
                    <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{image.name}</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={upload.openFilePicker}
                    disabled={upload.isLoading}
                    className="h-8 shrink-0"
                  >
                    <ImagePlus /> New image
                  </Button>
                </div>
                <ImageDropTarget onFile={upload.loadFile} label="Drop to use this image" className="min-h-0 flex-1">
                  <ImageColorCanvas
                    image={image}
                    sampler={sampler}
                    error={error}
                    markers={markers}
                    hoverHint="click to add"
                    highlightedId={highlightedId}
                    onHighlightChange={setHighlightedId}
                    onPick={(point, hex) => editor.insertColor({ hex, source: point })}
                    onMarkerMove={(id, point, hex) => editor.pickColor(id, hex, point)}
                    onMarkerRemove={removeColor}
                  />
                </ImageDropTarget>
              </div>
            </ResizablePanel>

            <SplitHandle direction={direction} />

            <ResizablePanel defaultSize={isWide ? 50 : 55} minSize={isWide ? 25 : 35} className="min-h-0 min-w-0">
              <PaletteEditor
                editor={editor}
                highlightedId={highlightedId}
                onHighlightChange={setHighlightedId}
                className="h-full"
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </>
      )}

      {upload.fileInput}
      {saveDialog}
    </div>
  );
};

export default ImagePalette;
