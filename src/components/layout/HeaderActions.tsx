import React from 'react';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import WithTooltip from '@/components/common/WithTooltip';
import HeaderActionButton from './HeaderActionButton';
import type { HeaderAction } from './headerActions';

interface HeaderActionsProps {
  actions: HeaderAction[];
}

/**
 * Renders page actions so the header always fits on one row:
 * - `md` and up: every action inline (labels appear as space allows);
 * - below `md`: primary actions as icon buttons, secondary actions in a "More" menu.
 */
const HeaderActions: React.FC<HeaderActionsProps> = ({ actions }) => {
  const primary = actions.filter(a => a.priority !== 'secondary');
  const secondary = actions.filter(a => a.priority === 'secondary');
  // In the compact layout the emphasized call-to-action sits right-most, after the "More" menu.
  const primaryPlain = primary.filter(a => !a.emphasis);
  const primaryEmphasis = primary.filter(a => a.emphasis);

  return (
    <>
      {/* Full layout */}
      <div className="hidden items-center gap-1 md:flex lg:gap-2">
        {actions.map(action => (
          <HeaderActionButton key={action.id} action={action} />
        ))}
      </div>

      {/* Compact layout */}
      <div className="flex items-center gap-1 md:hidden">
        {primaryPlain.map(action => (
          <HeaderActionButton key={action.id} action={action} iconOnly />
        ))}

        {secondary.length > 0 && (
          <DropdownMenu>
            <WithTooltip label="More actions">
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="More actions">
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
            </WithTooltip>
            <DropdownMenuContent align="end" className="min-w-[11rem]">
              {secondary.map(action => (
                <DropdownMenuItem
                  key={action.id}
                  onClick={action.onClick}
                  className="gap-2 [&_svg]:h-4 [&_svg]:w-4"
                >
                  {action.icon}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {primaryEmphasis.map(action => (
          <HeaderActionButton key={action.id} action={action} iconOnly />
        ))}
      </div>
    </>
  );
};

export default HeaderActions;
