import React, { useRef, useState } from 'react';
import { ArrowRight, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { paletteImageStore, pickerImageStore } from '@/utils/imageSourceStore';
import type { ImagePoint } from '@/utils/imagePalette';
import { useImageSource } from '@/hooks/useImageSource';
import { useImageSampler } from '@/hooks/useImageSampler';
import { useImageUpload } from '@/hooks/useImageUpload';
import ImageColorCanvas from './ImageColorCanvas';
import ImageDropTarget from './ImageDropTarget';
import ImageDropzone from './ImageDropzone';

interface ImageColorPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentColor: string;
  onPick: (hex: string) => void;
}

/** Pick a single color from an image (last used image, or the one on the "From Image" page). */
const ImageColorPickerDialog: React.FC<ImageColorPickerDialogProps> = ({ open, onOpenChange, currentColor, onPick }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={contentRef}
        className="flex h-[85dvh] w-[calc(100vw-1rem)] max-w-4xl flex-col gap-0 overflow-hidden rounded-lg p-0 outline-none sm:w-[calc(100vw-4rem)]"
        onOpenAutoFocus={e => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).focus();
        }}
      >
        <PickerBody
          scopeRef={contentRef}
          currentColor={currentColor}
          onCancel={() => onOpenChange(false)}
          onConfirm={hex => {
            onPick(hex);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

interface PickerBodyProps {
  scopeRef: React.RefObject<HTMLDivElement>;
  currentColor: string;
  onCancel: () => void;
  onConfirm: (hex: string) => void;
}

const PickerBody: React.FC<PickerBodyProps> = ({ scopeRef, currentColor, onCancel, onConfirm }) => {
  const [pickerImage, setPickerImage] = useImageSource(pickerImageStore);
  const [paletteImage] = useImageSource(paletteImageStore);
  const image = pickerImage ?? paletteImage;
  const { sampler, error } = useImageSampler(image);
  const [picked, setPicked] = useState<{ point: ImagePoint; hex: string } | null>(null);

  const upload = useImageUpload(
    img => {
      setPickerImage(img);
      setPicked(null);
    },
    { pasteScopeRef: scopeRef }
  );

  return (
    <>
      <DialogHeader className="border-b p-4 pr-12 sm:px-6">
        <DialogTitle>Pick a color from an image</DialogTitle>
        <DialogDescription>
          {image
            ? 'Click anywhere on the image to pick a color, drag the marker to fine-tune. Double-click to pick and apply.'
            : 'Choose an image to pick a color from.'}
        </DialogDescription>
      </DialogHeader>

      <div className="relative min-h-0 flex-1 bg-gray-100">
        {image ? (
          <ImageDropTarget onFile={upload.loadFile} label="Drop to use this image" className="h-full">
            <ImageColorCanvas
              image={image}
              sampler={sampler}
              error={error}
              hoverHint="click to pick"
              markers={
                picked ? [{ id: 'pick', point: picked.point, color: picked.hex, label: `Picked color ${picked.hex}` }] : []
              }
              onPick={(point, hex) => setPicked({ point, hex })}
              onPickConfirm={(_, hex) => onConfirm(hex)}
              onMarkerMove={(_, point, hex) => setPicked({ point, hex })}
            />
          </ImageDropTarget>
        ) : (
          <ImageDropzone
            onBrowse={upload.openFilePicker}
            onFile={upload.loadFile}
            isLoading={upload.isLoading}
            description="Pick any color from a photo, screenshot or artwork."
          />
        )}
      </div>

      <DialogFooter className="flex-row flex-wrap items-center gap-2 border-t p-3 sm:justify-between sm:space-x-0 sm:px-6">
        <ColorComparison from={currentColor} to={picked?.hex} />
        <div className="ml-auto flex flex-wrap justify-end gap-2">
          {image && (
            <Button type="button" variant="ghost" onClick={upload.openFilePicker} disabled={upload.isLoading}>
              <ImagePlus /> <span className="hidden sm:inline">Change image</span>
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!picked}
            onClick={() => picked && onConfirm(picked.hex)}
          >
            Use color
          </Button>
        </div>
      </DialogFooter>
      {upload.fileInput}
    </>
  );
};

const Swatch: React.FC<{ color?: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <span
      className="h-8 w-8 shrink-0 rounded-md ring-1 ring-black/10"
      style={
        color
          ? { backgroundColor: color }
          : { background: 'repeating-linear-gradient(45deg,#f3f4f6 0 6px,#e5e7eb 6px 12px)' }
      }
    />
    <span className="hidden flex-col leading-tight sm:flex">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="font-mono text-xs font-semibold">{color?.toUpperCase() ?? '—'}</span>
    </span>
  </div>
);

const ColorComparison: React.FC<{ from: string; to?: string }> = ({ from, to }) => (
  <div className="flex items-center gap-2" aria-live="polite">
    <Swatch color={from} label="Current" />
    <ArrowRight className="h-4 w-4 text-muted-foreground" />
    <Swatch color={to} label="Picked" />
  </div>
);

export default ImageColorPickerDialog;
