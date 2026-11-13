import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface WithTooltipProps {
  label: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Must be a single element that can hold a ref (button, trigger with asChild, ...). */
  children: React.ReactElement;
}

/** Wraps any focusable element with a tooltip. Relies on the app-level TooltipProvider. */
const WithTooltip: React.FC<WithTooltipProps> = ({ label, side, children }) => (
  <Tooltip>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent side={side}>
      <p>{label}</p>
    </TooltipContent>
  </Tooltip>
);

export default WithTooltip;
