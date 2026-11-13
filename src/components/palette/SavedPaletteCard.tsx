import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Download, ExternalLink, MoreHorizontal, Palette, Share2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import WithTooltip from '@/components/common/WithTooltip';
import EditableText from '@/components/common/EditableText';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import type { SavedPalette } from '@/utils/paletteStorage';
import PaletteSwatchStrip from './PaletteSwatchStrip';
import { PALETTE_NAME_MAX_LENGTH } from './PaletteNameField';

interface SavedPaletteCardProps {
  palette: SavedPalette;
  onRename: (name: string) => void;
  onEdit: () => void;
  onOpenInGenerator: () => void;
  onShare: () => void;
  onExport: () => void;
  onDelete: () => void;
}

const SavedPaletteCard: React.FC<SavedPaletteCardProps> = ({
  palette,
  onRename,
  onEdit,
  onOpenInGenerator,
  onShare,
  onExport,
  onDelete,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const copy = useCopyToClipboard();

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md animate-fade-in">
      <PaletteSwatchStrip colors={palette.colors} onSwatchClick={hex => copy(hex)} className="h-28 sm:h-32" />

      <div className="flex items-start gap-2 p-4">
        <div className="min-w-0 flex-1">
          <EditableText
            value={palette.name}
            onCommit={onRename}
            label="Palette name"
            maxLength={PALETTE_NAME_MAX_LENGTH}
            className="font-semibold text-gray-900"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {palette.colors.length} {palette.colors.length === 1 ? 'color' : 'colors'} · updated{' '}
            {formatDistanceToNow(palette.updatedAt, { addSuffix: true })}
          </p>
        </div>

        <div className="flex shrink-0 items-center">
          <WithTooltip label="Edit colors">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit} aria-label="Edit colors">
              <Palette />
            </Button>
          </WithTooltip>

          <DropdownMenu>
            <WithTooltip label="More actions">
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="More actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
            </WithTooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Palette className="mr-2 h-4 w-4" /> Edit colors
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenInGenerator}>
                <ExternalLink className="mr-2 h-4 w-4" /> Open in generator
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShare}>
                <Share2 className="mr-2 h-4 w-4" /> Copy share link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExport}>
                <Download className="mr-2 h-4 w-4" /> Export as CSS
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setConfirmDelete(true)}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{palette.name}”?</AlertDialogTitle>
            <AlertDialogDescription>This palette will be removed from this browser. This can’t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <PaletteSwatchStrip colors={palette.colors} className="h-12 rounded-md" />
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
};

export default SavedPaletteCard;
