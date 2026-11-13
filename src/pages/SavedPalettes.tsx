import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, Plus } from 'lucide-react';
import { ROUTES } from '@/lib/routes';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useSavedPalettes } from '@/hooks/useSavedPalettes';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { downloadPaletteAsCSS, exportPaletteAsURL } from '@/utils/colorUtils';
import type { SavedPalette } from '@/utils/paletteStorage';
import AppHeader from '@/components/layout/AppHeader';
import ScrollToTopButton from '@/components/common/ScrollToTopButton';
import SavedPaletteCard from '@/components/palette/SavedPaletteCard';
import EditPaletteDialog from '@/components/palette/EditPaletteDialog';

const generatorLink = (colors: string[]) =>
  `${ROUTES.generator}?palette=${colors.map(c => c.replace('#', '')).join('-')}`;

const toFileName = (name: string) =>
  `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'color-palette'}.css`;

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white px-6 py-16 text-center animate-fade-in">
    <div className="mb-4 rounded-full bg-blue-50 p-4 text-blue-600">
      <Bookmark className="h-8 w-8" />
    </div>
    <h2 className="text-lg font-semibold text-gray-900">No saved palettes yet</h2>
    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
      Generate a palette you like and hit “Save Palette” — it will show up here.
    </p>
    <Button asChild className="mt-6 bg-blue-600 hover:bg-blue-700">
      <Link to={ROUTES.generator}>
        <Plus /> Create a palette
      </Link>
    </Button>
  </div>
);

const SavedPalettes: React.FC = () => {
  const { palettes, updatePalette, deletePalette } = useSavedPalettes();
  const copy = useCopyToClipboard();
  const navigate = useNavigate();

  // Kept after closing so the dialog can animate out with its content intact.
  const [editingPalette, setEditingPalette] = useState<SavedPalette | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const sortedPalettes = useMemo(() => [...palettes].sort((a, b) => b.createdAt - a.createdAt), [palettes]);

  const openEditor = (palette: SavedPalette) => {
    setEditingPalette(palette);
    setIsEditorOpen(true);
  };

  const handleEditorSave = (changes: { name: string; colors: string[] }) => {
    if (!editingPalette) return;
    if (updatePalette(editingPalette.id, changes)) {
      setIsEditorOpen(false);
      toast({ title: 'Palette updated', description: `“${changes.name}” has been saved.`, duration: 2500 });
    }
  };

  const handleDelete = (palette: SavedPalette) => {
    if (deletePalette(palette.id)) {
      toast({ title: 'Palette deleted', description: `“${palette.name}” was removed.`, duration: 2500 });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        className="sticky top-0"
        actions={[
          {
            id: 'new',
            label: 'New Palette',
            tooltip: 'Open the generator',
            icon: <Plus />,
            onClick: () => navigate(ROUTES.generator),
            emphasis: true,
          },
        ]}
      />

      {/* Extra bottom padding so the floating "scroll to top" button never covers the last cards. */}
      <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Saved Palettes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {palettes.length === 0
              ? 'Palettes you save are stored in this browser.'
              : `${palettes.length} ${palettes.length === 1 ? 'palette' : 'palettes'} saved in this browser. Click a name to rename it, or a swatch to copy its hex code.`}
          </p>
        </div>

        {sortedPalettes.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 2xl:grid-cols-4">
            {sortedPalettes.map(palette => (
              <SavedPaletteCard
                key={palette.id}
                palette={palette}
                onRename={name => updatePalette(palette.id, { name })}
                onEdit={() => openEditor(palette)}
                onOpenInGenerator={() => navigate(generatorLink(palette.colors))}
                onShare={() => copy(exportPaletteAsURL(palette.colors), 'Sharable link copied to clipboard.')}
                onExport={() => downloadPaletteAsCSS(palette.colors, toFileName(palette.name))}
                onDelete={() => handleDelete(palette)}
              />
            ))}
          </div>
        )}
      </main>

      <ScrollToTopButton />

      <EditPaletteDialog
        palette={editingPalette}
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        onSave={handleEditorSave}
      />
    </div>
  );
};

export default SavedPalettes;
