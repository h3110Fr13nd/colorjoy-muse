import type React from 'react';

export interface HeaderAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  /** Tooltip text; defaults to the label. */
  tooltip?: string;
  /**
   * `primary` actions stay visible as icon buttons on small screens;
   * `secondary` ones collapse into the "More" menu.
   */
  priority?: 'primary' | 'secondary';
  /** Filled call-to-action style (e.g. "Save Palette"); its label is shown from `md` up. */
  emphasis?: boolean;
}
