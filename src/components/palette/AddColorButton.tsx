import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import WithTooltip from '@/components/common/WithTooltip';

type Placement = 'start' | 'between' | 'end';

// Rows on mobile (buttons on horizontal edges), columns from md up (buttons on vertical edges).
const placementClasses: Record<Placement, string> = {
  start: 'top-1 left-1/2 -translate-x-1/2 md:top-1/2 md:left-1 md:translate-x-0 md:-translate-y-1/2',
  between:
    'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 md:bottom-auto md:left-auto md:top-1/2 md:right-0 md:translate-x-1/2 md:-translate-y-1/2',
  end: 'bottom-1 left-1/2 -translate-x-1/2 md:bottom-auto md:left-auto md:top-1/2 md:right-1 md:translate-x-0 md:-translate-y-1/2',
};

const labels: Record<Placement, string> = {
  start: 'Add color at beginning',
  between: 'Add color',
  end: 'Add color at end',
};

interface AddColorButtonProps {
  placement: Placement;
  onClick: () => void;
}

const AddColorButton: React.FC<AddColorButtonProps> = ({ placement, onClick }) => (
  // Hidden while any column shows its shades, so nothing sits on top of the shade swatches.
  <div
    className={cn(
      'absolute z-10 group-has-[[data-shades]]/editor:hidden',
      placement !== 'between' && 'add-color-edge',
      placementClasses[placement]
    )}
  >
    <WithTooltip label={labels[placement]}>
      <Button
        variant="secondary"
        size="icon"
        aria-label={labels[placement]}
        className="h-8 w-8 rounded-full bg-white shadow-md border border-gray-200 hover:bg-gray-50"
        onClick={onClick}
      >
        <Plus size={16} />
      </Button>
    </WithTooltip>
  </div>
);

export default AddColorButton;
