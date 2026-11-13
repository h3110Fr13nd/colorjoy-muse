import React, { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { toast } from '@/hooks/use-toast';
import { isScopeActive } from '@/lib/dialogScope';
import { isImageFile, readImageFile, type ImageSource } from '@/utils/imageFile';

/**
 * Everything needed to get an image from the user: file picker, drag & drop (via `loadFile`)
 * and clipboard paste. Render `fileInput` once somewhere in the component.
 */
export const useImageUpload = (
  onImage: (image: ImageSource) => void,
  { pasteScopeRef, pasteEnabled = true }: { pasteScopeRef?: RefObject<HTMLElement>; pasteEnabled?: boolean } = {}
) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const onImageRef = useRef(onImage);
  onImageRef.current = onImage;
  const [isLoading, setIsLoading] = useState(false);

  const loadFile = useCallback(async (file: File | null | undefined) => {
    if (!file) return;
    if (!isImageFile(file)) {
      toast({
        title: 'Unsupported file',
        description: 'Please choose an image (PNG, JPG, WebP, GIF, …).',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      onImageRef.current(await readImageFile(file));
    } catch (err) {
      toast({
        title: 'Could not open image',
        description: err instanceof Error ? err.message : 'Please try another file.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openFilePicker = useCallback(() => inputRef.current?.click(), []);

  // Paste an image from the clipboard (Ctrl/Cmd+V).
  useEffect(() => {
    if (!pasteEnabled) return;
    const onPaste = (e: ClipboardEvent) => {
      if (!isScopeActive(pasteScopeRef ? pasteScopeRef.current : undefined)) return;
      const file = Array.from(e.clipboardData?.files ?? []).find(isImageFile);
      if (!file) return;
      e.preventDefault();
      loadFile(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [loadFile, pasteEnabled, pasteScopeRef]);

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      className="hidden"
      tabIndex={-1}
      aria-hidden
      onChange={e => {
        loadFile(e.target.files?.[0]);
        e.target.value = '';
      }}
    />
  );

  return { fileInput, openFilePicker, loadFile, isLoading };
};
