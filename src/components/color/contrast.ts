import { contrastRatio, DARK_TEXT, isLightColor, LIGHT_TEXT } from '@/utils/colorUtils';

export interface ContrastClasses {
  /** Text color class that is readable on the background. */
  text: string;
  hover: string;
  isLight: boolean;
  /** Most subtle opacity (0.8–1) that still keeps secondary text at WCAG AA (4.5:1). */
  secondaryOpacity: number;
}

const AA = 4.5;
const SECONDARY_OPACITIES = [0.8, 0.9, 1];

const mix = (fg: string, bg: string, alpha: number) =>
  '#' +
  [1, 3, 5]
    .map(i =>
      Math.round(parseInt(fg.slice(i, i + 2), 16) * alpha + parseInt(bg.slice(i, i + 2), 16) * (1 - alpha))
        .toString(16)
        .padStart(2, '0')
    )
    .join('');

/** Foreground classes that stay readable on top of the given background color. */
export const getContrastClasses = (background: string): ContrastClasses => {
  const isLight = isLightColor(background);
  const fg = isLight ? DARK_TEXT : LIGHT_TEXT;
  const secondaryOpacity =
    SECONDARY_OPACITIES.find(alpha => contrastRatio(mix(fg, background, alpha), background) >= AA) ?? 1;

  return {
    isLight,
    text: isLight ? 'text-black' : 'text-white',
    hover: isLight ? 'hover:bg-black/5' : 'hover:bg-white/10',
    secondaryOpacity,
  };
};
