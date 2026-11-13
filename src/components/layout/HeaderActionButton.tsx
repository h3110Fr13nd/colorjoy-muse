import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import WithTooltip from '@/components/common/WithTooltip';
import type { HeaderAction } from './headerActions';

interface HeaderActionButtonProps {
  action: HeaderAction;
  /** Force icon-only rendering (compact mobile header). */
  iconOnly?: boolean;
}

const emphasisClasses = 'bg-blue-600 text-white hover:bg-blue-700';

/**
 * Header button with tooltip. Labels: emphasized actions from `md`, others from `xl`;
 * always icon-only when `iconOnly` is set.
 */
const HeaderActionButton: React.FC<HeaderActionButtonProps> = ({ action, iconOnly = false }) => {
  const { label, tooltip = label, icon, onClick, emphasis } = action;

  return (
    <WithTooltip label={tooltip}>
      <Button
        variant={emphasis ? 'default' : 'ghost'}
        size={iconOnly ? 'icon' : 'sm'}
        aria-label={label}
        onClick={onClick}
        className={cn(iconOnly && 'h-9 w-9', emphasis && emphasisClasses)}
      >
        {icon}
        {!iconOnly && <span className={emphasis ? 'inline' : 'hidden xl:inline'}>{label}</span>}
      </Button>
    </WithTooltip>
  );
};

export default HeaderActionButton;
