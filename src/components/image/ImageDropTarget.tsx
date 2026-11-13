import React, { useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageDropTargetProps {
  onFile: (file: File) => void;
  /** Text shown while dragging a file over the area. */
  label?: string;
  className?: string;
  children: React.ReactNode;
}

const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes('Files');

/** Accepts an image dropped anywhere on its area and shows a clear drop overlay meanwhile. */
const ImageDropTarget: React.FC<ImageDropTargetProps> = ({ onFile, label = 'Drop image here', className, children }) => {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      className={cn('relative', className)}
      onDragOver={e => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setIsOver(true);
      }}
      onDragLeave={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsOver(false);
      }}
      onDrop={e => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        setIsOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
    >
      {children}
      {isOver && (
        <div className="pointer-events-none absolute inset-2 z-30 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-500 bg-blue-50/90 text-blue-700 animate-fade-in">
          <ImagePlus className="h-8 w-8" />
          <p className="font-medium">{label}</p>
        </div>
      )}
    </div>
  );
};

export default ImageDropTarget;
