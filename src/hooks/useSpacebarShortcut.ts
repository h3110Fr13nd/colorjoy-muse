import { useEffect, useRef, type RefObject } from 'react';
import { isScopeActive } from '@/lib/dialogScope';

const isTextEntryTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
};

/**
 * Calls `callback` when the spacebar is pressed, unless the user is typing in a field
 * or interacting with an open menu.
 *
 * - Page-level shortcut (no `scopeRef`): ignored while any dialog is open.
 * - Dialog shortcut (`scopeRef` = dialog content): only fires while that dialog is the topmost one.
 */
export const useSpacebarShortcut = (
  callback: () => void,
  enabled = true,
  scopeRef?: RefObject<HTMLElement>
) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat || e.defaultPrevented) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTextEntryTarget(e.target)) return;
      if (e.target instanceof HTMLElement && e.target.closest('[role="menu"]')) return;

      if (!isScopeActive(scopeRef ? scopeRef.current : undefined)) return;

      e.preventDefault();
      callbackRef.current();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, scopeRef]);
};
