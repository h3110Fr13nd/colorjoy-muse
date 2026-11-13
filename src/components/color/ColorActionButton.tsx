import React from 'react';
import { cn } from '@/lib/utils';
import type { ContrastClasses } from './contrast';

interface ColorActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  contrast: ContrastClasses;
}

/** Round icon button that adapts its colors to the swatch it sits on. */
const ColorActionButton = React.forwardRef<HTMLButtonElement, ColorActionButtonProps>(
  ({ contrast, className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'color-action-btn p-2 md:p-3 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current',
        '[&_svg]:h-[18px] [&_svg]:w-[18px] md:[&_svg]:h-5 md:[&_svg]:w-5',
        contrast.hover,
        contrast.text,
        className
      )}
      {...props}
    />
  )
);
ColorActionButton.displayName = 'ColorActionButton';

export default ColorActionButton;
