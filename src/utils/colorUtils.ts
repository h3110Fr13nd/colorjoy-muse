import { nameColor } from './colorNames';

// Function to generate a random hex color
export const generateRandomColor = (): string => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

// Normalize user input ("abc", "#abc", "#AaBbCc") to "#AABBCC".
// Returns null when the input is not a valid 3- or 6-digit hex color.
export const normalizeHex = (input: string): string | null => {
  const match = input.trim().match(HEX_PATTERN);
  if (!match) return null;
  let hex = match[1];
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  return `#${hex.toUpperCase()}`;
};

export const isValidHex = (input: string): boolean => normalizeHex(input) !== null;

// "#AABBCC" -> "rgb(170, 187, 204)"
export const hexToRgbString = (color: string): string => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
};

// WCAG relative luminance (0 = black, 1 = white)
export const relativeLuminance = (color: string): number => {
  const hex = color.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// WCAG contrast ratio between two colors (1..21)
export const contrastRatio = (a: string, b: string): number => {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

/** Text colors used on top of palette colors. Pure black keeps ≥ 4.5:1 (WCAG AA) on every color. */
export const DARK_TEXT = '#000000';
export const LIGHT_TEXT = '#FFFFFF';

// A color is "light" when dark text is more readable on it than white text (WCAG contrast).
export const isLightColor = (color: string): boolean =>
  contrastRatio(color, DARK_TEXT) >= contrastRatio(color, LIGHT_TEXT);

// Function to generate a complementary color
export const getComplementaryColor = (color: string): string => {
  // Remove the hash if it exists
  const hex = color.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Invert each component
  const rComplementary = 255 - r;
  const gComplementary = 255 - g;
  const bComplementary = 255 - b;
  
  // Convert back to hex
  return `#${rComplementary.toString(16).padStart(2, '0')}${gComplementary.toString(16).padStart(2, '0')}${bComplementary.toString(16).padStart(2, '0')}`;
};

// Function to generate a palette of 5 colors
export const generatePalette = (): string[] => {
  return Array(5).fill(0).map(() => generateRandomColor());
};

// Function to adjust the brightness of a color
export const adjustBrightness = (color: string, percent: number): string => {
  // Remove the hash if it exists
  const hex = color.replace('#', '');
  
  // Convert to RGB
  let r = parseInt(hex.substr(0, 2), 16);
  let g = parseInt(hex.substr(2, 2), 16);
  let b = parseInt(hex.substr(4, 2), 16);
  
  // Adjust brightness
  r = Math.min(255, Math.max(0, Math.round(r * (1 + percent / 100))));
  g = Math.min(255, Math.max(0, Math.round(g * (1 + percent / 100))));
  b = Math.min(255, Math.max(0, Math.round(b * (1 + percent / 100))));
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// Descriptive color name ("Sage", "Muted Teal", "Deep Coral", ...)
export const getColorName = (hex: string): string => nameColor(hex);

// Function to copy text to clipboard
export const copyToClipboard = (text: string): Promise<void> => {
  return navigator.clipboard.writeText(text);
};

// Function to generate a random shade of a color
export const generateShade = (baseColor: string): string => {
  const adjustment = Math.random() > 0.5 
    ? Math.random() * 30 
    : -Math.random() * 30;
  
  return adjustBrightness(baseColor, adjustment);
};

// Function to export palette as JSON
export const exportPaletteAsJSON = (palette: string[]): string => {
  return JSON.stringify(palette);
};

// Function to export palette as URL
export const exportPaletteAsURL = (palette: string[]): string => {
  const colors = palette.map(c => c.replace('#', '')).join('-');
  return `${window.location.origin}?palette=${colors}`;
};

// Function to parse palette from URL
export const parsePaletteFromURL = (search: string = window.location.search): string[] | null => {
  const urlParams = new URLSearchParams(search);
  const paletteParam = urlParams.get('palette');
  
  if (!paletteParam) return null;
  
  const colors = paletteParam
    .split('-')
    .map(normalizeHex)
    .filter((c): c is string => c !== null);

  return colors.length > 0 ? colors : null;
};

// Function to convert hex color to HSL
export const hexToHSL = (hex: string): { h: number; s: number; l: number } => {
  // Remove the hash if it exists
  const cleanHex = hex.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(cleanHex.substr(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substr(2, 2), 16) / 255;
  const b = parseInt(cleanHex.substr(4, 2), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    
    h /= 6;
  }
  
  return {
    h: h * 360,
    s: s * 100,
    l: l * 100
  };
};

// Function to convert HSL to hex
export const hslToHex = (h: number, s: number, l: number): string => {
  h /= 360;
  s /= 100;
  l /= 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Function to generate a color that harmonizes with locked colors
export const generateHarmonizedColor = (lockedColors: string[]): string => {
  // Choose a random locked color to base the harmony on
  const baseColor = lockedColors[Math.floor(Math.random() * lockedColors.length)];
  const baseHSL = hexToHSL(baseColor);
  
  // Generate a harmonized color using one of several methods:
  const harmonyType = Math.floor(Math.random() * 5);
  
  switch (harmonyType) {
    case 0: { // Analogous - similar hue
      const analogousH = (baseHSL.h + (Math.random() * 40 - 20) + 360) % 360; // +/- 20 degrees
      return hslToHex(analogousH, baseHSL.s, baseHSL.l);
    }
    
    case 1: { // Complementary - opposite hue
      const complementaryH = (baseHSL.h + 180) % 360;
      return hslToHex(complementaryH, baseHSL.s, baseHSL.l);
    }
    
    case 2: { // Triadic - 120 degrees apart
      const triadicH = (baseHSL.h + (Math.random() > 0.5 ? 120 : 240)) % 360;
      return hslToHex(triadicH, baseHSL.s, baseHSL.l);
    }
    
    case 3: { // Monochromatic - same hue, different saturation/lightness
      const newS = Math.min(100, Math.max(20, baseHSL.s + (Math.random() * 40 - 20)));
      const newL = Math.min(90, Math.max(20, baseHSL.l + (Math.random() * 40 - 20)));
      return hslToHex(baseHSL.h, newS, newL);
    }
    
    case 4: { // Split complementary
      const splitH = (baseHSL.h + 180 + (Math.random() > 0.5 ? 30 : -30)) % 360;
      return hslToHex(splitH, baseHSL.s, baseHSL.l);
    }
    
    default:
      return generateRandomColor();
  }
};

// Function to generate a palette influenced by locked colors
export const generateInfluencedPalette = (colors: string[], lockedPositions: boolean[]): string[] => {
  const lockedColors = colors.filter((_, i) => lockedPositions[i]);
  
  return colors.map((color, index) => {
    if (lockedPositions[index]) {
      return color; // Keep locked colors unchanged
    }
    
    if (lockedColors.length > 0) {
      return generateHarmonizedColor(lockedColors);
    }
    
    return generateRandomColor();
  });
};
// Palette as CSS custom properties
export const paletteToCSSVariables = (palette: string[]): string =>
  palette.map((color, index) => `--color-${index + 1}: ${color};`).join('\n');

// Trigger a download of the palette as a CSS file
export const downloadPaletteAsCSS = (palette: string[], filename = 'color-palette.css'): void => {
  const file = new Blob([paletteToCSSVariables(palette)], { type: 'text/plain' });
  const url = URL.createObjectURL(file);
  const element = document.createElement('a');
  element.href = url;
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(url);
};

/**
 * Tints & shades of a color (light → dark), same hue & saturation. The step closest to the
 * color's own lightness is the exact input color, so it always appears in the list.
 */
export const generateShades = (color: string, count = 11): string[] => {
  const base = normalizeHex(color) ?? '#FFFFFF';
  const { h, s, l } = hexToHSL(base);
  const steps = Array.from({ length: count }, (_, i) => 95 - (i * 85) / (count - 1));
  const own = steps.reduce((best, v, i) => (Math.abs(v - l) < Math.abs(steps[best] - l) ? i : best), 0);
  return steps.map((lightness, i) => (i === own ? base : hslToHex(h, s, lightness).toUpperCase()));
};
