import React from 'react';
import { useTipsVisibility } from '@/hooks/useTipsVisibility';

/** Dismissible hint strip under the header; visibility is the shared "Show/Hide Tips" preference. */
const TipsBar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { visible } = useTipsVisibility();
  if (!visible) return null;

  return (
    <div className="flex shrink-0 justify-center border-b border-gray-100 bg-gray-50 px-3 py-2 text-center text-xs text-gray-500 animate-slide-down md:p-3 md:text-sm">
      {children}
    </div>
  );
};

export default TipsBar;
