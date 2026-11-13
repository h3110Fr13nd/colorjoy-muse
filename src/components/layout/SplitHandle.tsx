import React from 'react';
import { GripHorizontal, GripVertical } from 'lucide-react';
import { PanelResizeHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils';

/**
 * Resize bar for split views. Unlike a hairline with a floating grip, it takes its own space,
 * so it never sits on top of panel content (e.g. the first "+" button of a palette).
 */
const SplitHandle: React.FC<{ direction: 'horizontal' | 'vertical'; className?: string }> = ({
  direction,
  className,
}) => (
  <PanelResizeHandle
    className={cn(
      'group flex shrink-0 items-center justify-center bg-gray-100 text-gray-400 transition-colors',
      'hover:bg-blue-50 hover:text-blue-600 focus-visible:bg-blue-50 focus-visible:text-blue-600 focus-visible:outline-none',
      'data-[resize-handle-state=drag]:bg-blue-100 data-[resize-handle-state=drag]:text-blue-600',
      direction === 'horizontal' ? 'w-3 cursor-col-resize border-x border-gray-200' : 'h-3 cursor-row-resize border-y border-gray-200',
      className
    )}
  >
    {direction === 'horizontal' ? <GripVertical className="h-4 w-4" /> : <GripHorizontal className="h-4 w-4" />}
  </PanelResizeHandle>
);

export default SplitHandle;
