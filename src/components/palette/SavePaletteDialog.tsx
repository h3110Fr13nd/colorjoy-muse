import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import PaletteSwatchStrip from './PaletteSwatchStrip';
import PaletteNameField from './PaletteNameField';

interface SavePaletteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colors: string[];
  /** Returns a fresh random name suggestion. */
  suggestName: () => string;
  /** Receives the final (never empty) name. */
  onSave: (name: string) => void;
}

const SavePaletteDialog: React.FC<SavePaletteDialogProps> = ({ open, onOpenChange, ...formProps }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-lg">
      {/* Mounted only while open, so every opening starts with an empty name and a new suggestion. */}
      <SavePaletteForm {...formProps} onCancel={() => onOpenChange(false)} />
    </DialogContent>
  </Dialog>
);

interface SavePaletteFormProps extends Omit<SavePaletteDialogProps, 'open' | 'onOpenChange'> {
  onCancel: () => void;
}

const SavePaletteForm: React.FC<SavePaletteFormProps> = ({ colors, suggestName, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [suggestedName] = useState(suggestName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(name.trim() || suggestedName);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Save palette</DialogTitle>
        <DialogDescription>Saved palettes are stored in this browser.</DialogDescription>
      </DialogHeader>

      <PaletteSwatchStrip colors={colors} className="h-16 rounded-md" />

      <PaletteNameField id="save-palette-name" value={name} onChange={setName} fallbackName={suggestedName} autoFocus />

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Save
        </Button>
      </DialogFooter>
    </form>
  );
};

export default SavePaletteDialog;
