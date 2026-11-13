import { useCallback, useRef, useState } from 'react';
import type React from 'react';

/** Marker attribute for inline-edit inputs (lets dialogs ignore Escape while one is active). */
export const INLINE_EDIT_ATTR = 'data-inline-edit';

export const isInlineEditTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && target.hasAttribute(INLINE_EDIT_ATTR);

interface UseInlineEditOptions {
  value: string;
  /** Called with the draft on Enter / blur. */
  onCommit?: (draft: string) => void;
  /** Called on Escape. */
  onCancel?: () => void;
  /** Called on every keystroke (used for live previews). */
  onDraftChange?: (draft: string) => void;
}

/**
 * Shared click-to-edit behavior: Enter/blur commits, Escape cancels.
 * Used by the hex code editor and by editable palette names.
 */
export const useInlineEdit = ({ value, onCommit, onCancel, onDraftChange }: UseInlineEditOptions) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  // Guards against double-commit (e.g. Enter followed by the blur caused by unmounting the input).
  const editingRef = useRef(false);

  const start = useCallback(() => {
    editingRef.current = true;
    setDraft(value);
    setIsEditing(true);
  }, [value]);

  const finish = useCallback(() => {
    editingRef.current = false;
    setIsEditing(false);
  }, []);

  const commit = useCallback(() => {
    if (!editingRef.current) return;
    finish();
    onCommit?.(draft);
  }, [draft, finish, onCommit]);

  const cancel = useCallback(() => {
    if (!editingRef.current) return;
    finish();
    onCancel?.();
  }, [finish, onCancel]);

  const inputProps = {
    [INLINE_EDIT_ATTR]: '',
    value: draft,
    autoFocus: true,
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select(),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setDraft(e.target.value);
      onDraftChange?.(e.target.value);
    },
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        cancel();
      }
    },
  };

  return { isEditing, draft, start, commit, cancel, inputProps };
};
