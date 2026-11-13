import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Eye, EyeOff, RefreshCw, Save, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { downloadPaletteAsCSS, exportPaletteAsURL } from '@/utils/colorUtils';
import { useSavedPalettes } from '@/hooks/useSavedPalettes';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useTipsVisibility } from '@/hooks/useTipsVisibility';
import type { PaletteEditorState } from '@/hooks/usePaletteEditor';
import type { HeaderAction } from '@/components/layout/headerActions';
import SavePaletteDialog from '@/components/palette/SavePaletteDialog';

interface Options {
  /** Extra actions inserted right after "Generate". */
  extraActions?: HeaderAction[];
  generateTooltip?: string;
}

/**
 * Header actions shared by every palette-editing page:
 * Generate · (extras) · Share · Export · Tips · Save Palette (+ its dialog).
 */
export const usePaletteHeaderActions = (editor: PaletteEditorState, options: Options = {}) => {
  const { extraActions = [], generateTooltip = 'Generate new palette (or press Spacebar)' } = options;
  const { savePalette, suggestName } = useSavedPalettes();
  const tips = useTipsVisibility();
  const copy = useCopyToClipboard();
  const navigate = useNavigate();
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  const handleSave = (name: string) => {
    const saved = savePalette(editor.hexes, name);
    if (!saved) return;

    setIsSaveDialogOpen(false);
    toast({
      title: 'Palette saved',
      description: `“${saved.name}” was added to your saved palettes.`,
      duration: 4000,
      action: (
        <ToastAction altText="View saved palettes" onClick={() => navigate(ROUTES.saved)}>
          View
        </ToastAction>
      ),
    });
  };

  const actions: HeaderAction[] = [
    {
      id: 'generate',
      label: 'Generate',
      tooltip: generateTooltip,
      icon: <RefreshCw className={cn(editor.isGenerating && 'animate-spin')} />,
      onClick: editor.generate,
    },
    ...extraActions,
    {
      id: 'share',
      label: 'Share',
      tooltip: 'Copy sharable link',
      icon: <Share2 />,
      onClick: () => copy(exportPaletteAsURL(editor.hexes), 'Sharable link copied to clipboard.'),
      priority: 'secondary',
    },
    {
      id: 'export',
      label: 'Export',
      tooltip: 'Export palette as CSS',
      icon: <Download />,
      onClick: () => {
        downloadPaletteAsCSS(editor.hexes);
        toast({
          title: 'Palette Exported',
          description: 'Your color palette has been downloaded as CSS variables.',
          duration: 3000,
        });
      },
      priority: 'secondary',
    },
    {
      id: 'tips',
      label: tips.visible ? 'Hide Tips' : 'Show Tips',
      tooltip: tips.visible ? 'Hide instructions' : 'Show instructions',
      icon: tips.visible ? <EyeOff /> : <Eye />,
      onClick: tips.toggle,
      priority: 'secondary',
    },
    {
      id: 'save',
      label: 'Save Palette',
      tooltip: 'Save this palette to your browser',
      icon: <Save />,
      onClick: () => setIsSaveDialogOpen(true),
      emphasis: true,
    },
  ];

  const saveDialog = (
    <SavePaletteDialog
      open={isSaveDialogOpen}
      onOpenChange={setIsSaveDialogOpen}
      colors={editor.hexes}
      suggestName={suggestName}
      onSave={handleSave}
    />
  );

  return { actions, saveDialog };
};
