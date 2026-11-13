import React, { useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toPaletteColors, usePaletteEditor } from '@/hooks/usePaletteEditor';
import { useSpacebarShortcut } from '@/hooks/useSpacebarShortcut';
import { isInlineEditTarget } from '@/hooks/useInlineEdit';
import type { SavedPalette } from '@/utils/paletteStorage';
import PaletteEditor from './PaletteEditor';
import PaletteNameField from './PaletteNameField';

interface EditPaletteDialogProps {
  palette: SavedPalette | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (changes: { name: string; colors: string[] }) => void;
}

/** Full palette editor in a dialog; edits are a draft until "Save changes". */
const EditPaletteDialog: React.FC<EditPaletteDialogProps> = ({ palette, open, onOpenChange, onSave }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      ref={contentRef}
      className="flex h-[90dvh] w-[calc(100vw-1rem)] outline-none max-w-6xl flex-col gap-0 overflow-hidden rounded-lg p-0 sm:w-[calc(100vw-4rem)]"
      // Focus the dialog itself rather than the name input: avoids popping the mobile keyboard
      // and keeps the spacebar shortcut working right away.
      onOpenAutoFocus={e => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).focus();
      }}
      // Escape inside the hex / name inline editors should only cancel that edit.
      onEscapeKeyDown={e => {
        if (isInlineEditTarget(e.target)) e.preventDefault();
      }}
    >
      {/* DialogContent unmounts when closed, so the form re-initializes from the palette on every open. */}
      {palette && (
        <EditPaletteForm
          palette={palette}
          scopeRef={contentRef}
          onCancel={() => onOpenChange(false)}
          onSave={onSave}
        />
      )}
    </DialogContent>
  </Dialog>
  );
};

interface EditPaletteFormProps {
  palette: SavedPalette;
  /** The dialog element: the spacebar shortcut only works while this dialog is on top. */
  scopeRef: React.RefObject<HTMLDivElement>;
  onCancel: () => void;
  onSave: EditPaletteDialogProps['onSave'];
}

const EditPaletteForm: React.FC<EditPaletteFormProps> = ({ palette, scopeRef, onCancel, onSave }) => {
  const [name, setName] = useState(palette.name);
  const editor = usePaletteEditor(() => toPaletteColors(palette.colors));

  useSpacebarShortcut(editor.generate, true, scopeRef);

  return (
    <>
      <DialogHeader className="border-b p-4 pr-12 sm:p-6 sm:pr-12">
        <DialogTitle>Edit palette</DialogTitle>
        <DialogDescription className="hidden sm:block">
          Click a hex code to type a color, use the picker, lock colors and press{' '}
          <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">space</kbd> to regenerate the rest.
        </DialogDescription>
        <div className="pt-2 sm:max-w-sm">
          <PaletteNameField id="edit-palette-name" value={name} onChange={setName} fallbackName={palette.name} />
        </div>
      </DialogHeader>

      <PaletteEditor editor={editor} className="min-h-0 flex-1" />

      <DialogFooter className="flex-row flex-wrap items-center gap-2 border-t p-4 sm:justify-between sm:space-x-0">
        <Button type="button" variant="ghost" onClick={editor.generate}>
          <RefreshCw className={cn('mr-1', editor.isGenerating && 'animate-spin')} />
          Generate
        </Button>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => onSave({ name: name.trim() || palette.name, colors: editor.hexes })}
          >
            Save changes
          </Button>
        </div>
      </DialogFooter>
    </>
  );
};

export default EditPaletteDialog;
