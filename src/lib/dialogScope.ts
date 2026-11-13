const OPEN_DIALOG_SELECTOR = '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]';

const topmostOpenDialog = (): Element | null => {
  const open = document.querySelectorAll(OPEN_DIALOG_SELECTOR);
  return open.length ? open[open.length - 1] : null;
};

/**
 * Whether a global shortcut/listener owned by `scope` should react right now.
 * - No scope (page-level): only when no dialog is open.
 * - Scope (a dialog element): only when that dialog is the topmost open one.
 */
export const isScopeActive = (scope?: Element | null): boolean => {
  const top = topmostOpenDialog();
  return scope === undefined ? top === null : top !== null && top === scope;
};
