import React from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInlineEdit } from '@/hooks/useInlineEdit';

interface EditableTextProps {
  value: string;
  /** Receives the trimmed value; empty input is ignored and the previous value is kept. */
  onCommit: (value: string) => void;
  label: string;
  maxLength?: number;
  className?: string;
  inputClassName?: string;
}

/** Click-to-rename text. Enter/blur saves, Escape cancels. */
const EditableText: React.FC<EditableTextProps> = ({
  value,
  onCommit,
  label,
  maxLength = 60,
  className,
  inputClassName,
}) => {
  const { isEditing, start, inputProps } = useInlineEdit({
    value,
    onCommit: draft => {
      const trimmed = draft.trim();
      if (trimmed && trimmed !== value) onCommit(trimmed);
    },
  });

  if (isEditing) {
    return (
      <input
        {...inputProps}
        aria-label={label}
        maxLength={maxLength}
        className={cn(
          'w-full min-w-0 rounded-md border border-input bg-background px-2 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
          className,
          inputClassName
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      title={`${label}: ${value}`}
      aria-label={`${label}: ${value}. Click to edit`}
      className={cn(
        'group/edit flex w-full min-w-0 items-center gap-1.5 rounded-md px-2 py-0.5 -mx-2 text-left hover:bg-gray-100',
        className
      )}
    >
      <span className="truncate">{value}</span>
      <Pencil className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover/edit:opacity-60 group-focus-visible/edit:opacity-60" />
    </button>
  );
};

export default EditableText;
