
// Function to generate a random hex color
export const generateRandomColor = (): string => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};

// Function to determine if a color is light or dark
export const isLightColor = (color: string): boolean => {
  // Remove the hash if it exists
  const hex = color.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate brightness (HSP)
  const brightness = Math.sqrt(
    0.299 * (r * r) + 
    0.587 * (g * g) + 
    0.114 * (b * b)
  );
  
  // Return true if the color is light
  return brightness > 130;
};

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

// Function to get the name of a color based on its hex value
// This is a simplified version - in a real app, you might use a more sophisticated algorithm or library
export const getColorName = (hex: string): string => {
  // Basic predefined color list - in a real app this would be more comprehensive
  const colorNames: Record<string, string> = {
    '#FF0000': 'Red',
    '#00FF00': 'Green',
    '#0000FF': 'Blue',
    '#FFFF00': 'Yellow',
    '#FF00FF': 'Magenta',
    '#00FFFF': 'Cyan',
    '#000000': 'Black',
    '#FFFFFF': 'White',
    '#808080': 'Gray',
    '#FFA500': 'Orange',
    '#800080': 'Purple',
    '#A52A2A': 'Brown',
    '#FFC0CB': 'Pink',
    '#FFD700': 'Gold',
    '#C0C0C0': 'Silver',
  };
  
  hex = hex.toUpperCase();
  
  // Check if the exact color exists in our list
  if (colorNames[hex]) {
    return colorNames[hex];
  }
  
  // For colors not in our list, return a general name based on RGB composition
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  if (r === g && g === b) {
    if (r < 64) return 'Charcoal';
    if (r < 128) return 'Gray';
    if (r < 224) return 'Silver';
    return 'White';
  }
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  if (max === r) {
    if (g > 160 && b > 160) return 'Coral';
    if (g > 128) return 'Orange';
    return 'Red';
  }
  
  if (max === g) {
    if (r > 160 && b > 160) return 'Mint';
    if (r > 128) return 'Lime';
    return 'Green';
  }
  
  if (max === b) {
    if (r > 160 && g > 160) return 'Sky';
    if (r > 128) return 'Azure';
    return 'Blue';
  }
  
  return 'Custom';
};

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
export const parsePaletteFromURL = (): string[] | null => {
  const urlParams = new URLSearchParams(window.location.search);
  const paletteParam = urlParams.get('palette');
  
  if (!paletteParam) return null;
  
  try {
    return paletteParam.split('-').map(c => `#${c}`);
  } catch (e) {
    console.error('Failed to parse palette from URL:', e);
    return null;
  }
};
