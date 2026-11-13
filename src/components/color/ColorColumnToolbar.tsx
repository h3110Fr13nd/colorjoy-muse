import React from 'react';
import { Contrast, Copy, Lock, MoreVertical, Unlock, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import WithTooltip from '@/components/common/WithTooltip';
import ColorActionButton from './ColorActionButton';
import type { ContrastClasses } from './contrast';

interface ColorColumnToolbarProps {
  locked: boolean;
  showShades: boolean;
  contrast: ContrastClasses;
  onLockToggle: () => void;
  onCopyHex: () => void;
  onCopyRgb: () => void;
  onRemove: () => void;
  onToggleShades: () => void;
}

const ColorColumnToolbar: React.FC<ColorColumnToolbarProps> = ({
  locked,
  showShades,
  contrast,
  onLockToggle,
  onCopyHex,
  onCopyRgb,
  onRemove,
  onToggleShades,
}) => (
  <div className="color-toolbar flex flex-row items-center gap-0.5 md:flex-col md:gap-2">
    <WithTooltip label={locked ? 'Unlock color' : 'Lock color'}>
      <ColorActionButton
        contrast={contrast}
        onClick={onLockToggle}
        aria-pressed={locked}
        aria-label={locked ? 'Unlock color' : 'Lock color'}
      >
        {locked ? <Lock /> : <Unlock />}
      </ColorActionButton>
    </WithTooltip>

    <WithTooltip label="Copy hex code">
      <ColorActionButton contrast={contrast} onClick={onCopyHex} aria-label="Copy hex code" className="copy-hex-btn">
        <Copy />
      </ColorActionButton>
    </WithTooltip>

    <WithTooltip label="Remove color">
      <ColorActionButton contrast={contrast} onClick={onRemove} aria-label="Remove color">
        <X />
      </ColorActionButton>
    </WithTooltip>

    <DropdownMenu>
      <WithTooltip label="More options">
        <DropdownMenuTrigger asChild>
          <ColorActionButton contrast={contrast} aria-label="More options">
            <MoreVertical />
          </ColorActionButton>
        </DropdownMenuTrigger>
      </WithTooltip>
      <DropdownMenuContent align="center">
        <DropdownMenuItem onClick={onToggleShades}>View shades</DropdownMenuItem>
        <DropdownMenuItem onClick={onCopyHex}>Copy HEX</DropdownMenuItem>
        <DropdownMenuItem onClick={onCopyRgb}>Copy RGB</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <WithTooltip label="View shades">
      <ColorActionButton
        contrast={contrast}
        onClick={onToggleShades}
        aria-expanded={showShades}
        aria-label="View shades"
      >
        <Contrast />
      </ColorActionButton>
    </WithTooltip>
  </div>
);

export default ColorColumnToolbar;
