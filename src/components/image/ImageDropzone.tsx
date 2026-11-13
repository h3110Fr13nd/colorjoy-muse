import React from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ImageDropTarget from './ImageDropTarget';

interface ImageDropzoneProps {
  onBrowse: () => void;
  onFile: (file: File) => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
  className?: string;
}

/** Empty state for choosing an image: click to browse, drag & drop, or paste. */
const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  onBrowse,
  onFile,
  isLoading,
  title = 'Drop an image here',
  description = 'We’ll pick a varied palette from its colors.',
  className,
}) => (
  <ImageDropTarget onFile={onFile} className={cn('flex h-full w-full items-center justify-center p-4 sm:p-8', className)}>
    <button
      type="button"
      onClick={onBrowse}
      disabled={isLoading}
      className="group flex w-full max-w-xl flex-col items-center rounded-2xl border-2 border-dashed border-gray-300 bg-white px-6 py-12 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:py-16"
    >
      <span className="mb-4 rounded-full bg-blue-50 p-4 text-blue-600 transition-transform group-hover:scale-105">
        {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : <ImagePlus className="h-8 w-8" />}
      </span>
      <span className="text-lg font-semibold text-gray-900">{isLoading ? 'Opening image…' : title}</span>
      <span className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</span>
      <Button asChild className="pointer-events-none mt-6 bg-blue-600 group-hover:bg-blue-700">
        <span>Choose image</span>
      </Button>
      <span className="mt-3 text-xs text-muted-foreground">
        or paste one with <kbd className="rounded bg-gray-100 px-1.5 py-0.5">Ctrl</kbd>+
        <kbd className="rounded bg-gray-100 px-1.5 py-0.5">V</kbd>
      </span>
    </button>
  </ImageDropTarget>
);

export default ImageDropzone;
