// Human-friendly color names: nearest match (in perceptual CIELAB space) from a curated list of
// paint/design/CSS names, plus a modifier ("Light", "Deep", "Muted", …) when the match is loose.

import { deltaE, hexToLab, labChroma, type Lab } from './colorSpace';

const NAMED_COLORS: Record<string, string> = {
  // Reds & pinks
  Red: '#FF0000', Crimson: '#DC143C', Scarlet: '#FF2400', Cherry: '#D2042D', Ruby: '#9B111E',
  Burgundy: '#800020', Maroon: '#800000', Wine: '#722F37', Oxblood: '#4A0404', 'Brick Red': '#CB4154',
  Vermilion: '#E34234', Tomato: '#FF6347', Coral: '#FF7F50', Salmon: '#FA8072', 'Light Salmon': '#FFA07A',
  Watermelon: '#FC6C85', Rose: '#FF007F', Raspberry: '#E30B5C', 'Hot Pink': '#FF69B4', Bubblegum: '#FFC1CC',
  Pink: '#FFC0CB', Blush: '#DE5D83', 'Dusty Rose': '#DCAE96', Rosewood: '#65000B', Flamingo: '#FC8EAC',
  'Cotton Candy': '#FFBCD9', Carnation: '#FFA6C9', 'Misty Rose': '#FFE4E1', Cardinal: '#C41E3A',
  'Rose Gold': '#B76E79', Cerise: '#DE3163', 'Candy Apple': '#FF0800', Garnet: '#733635',
  // Purples
  Magenta: '#FF00FF', Fuchsia: '#C154C1', Orchid: '#DA70D6', Mauve: '#E0B0FF', Puce: '#CC8899',
  Thistle: '#D8BFD8', Lilac: '#C8A2C8', Lavender: '#E6E6FA', Wisteria: '#C9A0DC', Heliotrope: '#DF73FF',
  Amethyst: '#9966CC', Violet: '#8F00FF', Purple: '#800080', Plum: '#8E4585', Grape: '#6F2DA8',
  Eggplant: '#614051', Indigo: '#4B0082', 'Royal Purple': '#7851A9', Byzantium: '#702963',
  Periwinkle: '#CCCCFF', Iris: '#5A4FCF', 'Dark Orchid': '#9932CC', Mulberry: '#C54B8C',
  Boysenberry: '#873260', 'Lavender Gray': '#C4C3D0', 'Old Lavender': '#796878', Amaranth: '#E52B50',
  // Blues
  Navy: '#000080', 'Midnight Blue': '#191970', 'Oxford Blue': '#002147', Sapphire: '#0F52BA',
  Cobalt: '#0047AB', 'Royal Blue': '#4169E1', Blue: '#0000FF', Ultramarine: '#120A8F', Denim: '#1560BD',
  Cornflower: '#6495ED', 'Steel Blue': '#4682B4', Cerulean: '#007BA7', Azure: '#007FFF',
  'Dodger Blue': '#1E90FF', 'Sky Blue': '#87CEEB', 'Baby Blue': '#89CFF0', 'Powder Blue': '#B0E0E6',
  'Alice Blue': '#F0F8FF', 'Slate Blue': '#6A5ACD', 'Air Force Blue': '#5D8AA8', 'Prussian Blue': '#003153',
  'Teal Blue': '#367588', Lapis: '#26619C', 'Yale Blue': '#0F4D92', 'Space Cadet': '#1D2951',
  'Electric Blue': '#7DF9FF', 'Carolina Blue': '#56A0D3', 'Glaucous': '#6082B6', 'Dusk Blue': '#4D6D9A',
  'Ice Blue': '#D6ECF3', Admiral: '#233A66',
  // Cyans & teals
  Cyan: '#00FFFF', Aquamarine: '#7FFFD4', Turquoise: '#40E0D0', Teal: '#008080', 'Deep Teal': '#014D4E',
  Seafoam: '#93E9BE', 'Tiffany Blue': '#0ABAB5', 'Robin Egg': '#00CCCC', 'Pacific Blue': '#1CA9C9',
  Celeste: '#B2FFFF', Lagoon: '#4E9FA6', Pine: '#01796F', Verdigris: '#43B3AE', Peacock: '#016A6F',
  // Greens
  Green: '#008000', Lime: '#BFFF00', 'Lime Green': '#32CD32', Chartreuse: '#7FFF00', 'Kelly Green': '#4CBB17',
  Emerald: '#50C878', Jade: '#00A86B', Shamrock: '#009E60', 'Forest Green': '#228B22',
  'Hunter Green': '#355E3B', 'Bottle Green': '#006A4E', 'Racing Green': '#004225', Olive: '#808000',
  'Olive Drab': '#6B8E23', Moss: '#8A9A5B', Sage: '#9CAF88', Pistachio: '#93C572', Fern: '#4F7942',
  Avocado: '#568203', Pear: '#D1E231', Celadon: '#ACE1AF', 'Tea Green': '#D0F0C0', Honeydew: '#F0FFF0',
  'Army Green': '#4B5320', 'Spring Green': '#00FF7F', Malachite: '#0BDA51', Mint: '#3EB489',
  'Mint Green': '#98FF98', Eucalyptus: '#44D7A8', Laurel: '#A9BA9D', Juniper: '#3A5F4E', Basil: '#579229',
  Matcha: '#B4C785', Seaweed: '#354A21', Spruce: '#0A5F38',
  // Yellows
  Yellow: '#FFFF00', Lemon: '#FFF44F', Canary: '#FFFF99', Cream: '#FFFDD0', Ivory: '#FFFFF0',
  Vanilla: '#F3E5AB', Champagne: '#F7E7CE', Gold: '#FFD700', Sunflower: '#FFDA03', Mustard: '#FFDB58',
  Goldenrod: '#DAA520', Saffron: '#F4C430', Amber: '#FFBF00', Maize: '#FBEC5D', Flax: '#EEDC82',
  Marigold: '#EAA221', Khaki: '#C3B091', Straw: '#E4D96F', 'Old Gold': '#CFB53B', Butter: '#FFF1A5',
  Honey: '#E6B325', Citrine: '#E4D00A', Brass: '#B5A642', 'Dark Khaki': '#BDB76B',
  // Oranges
  Orange: '#FFA500', Tangerine: '#F28500', Pumpkin: '#FF7518', Carrot: '#ED9121', Persimmon: '#EC5800',
  Apricot: '#FBCEB1', Peach: '#FFE5B4', Melon: '#FDBCB4', 'Burnt Orange': '#CC5500', Rust: '#B7410E',
  Terracotta: '#E2725B', Copper: '#B87333', Bronze: '#CD7F32', Ochre: '#CC7722', Sienna: '#A0522D',
  'Burnt Sienna': '#E97451', Cinnamon: '#D2691E', Papaya: '#FFA07A', Mango: '#FDBE02', Clay: '#B66A50',
  Cantaloupe: '#FFA62F', Marmalade: '#D36E28',
  // Browns & warm neutrals
  Brown: '#964B00', Chocolate: '#7B3F00', Coffee: '#6F4E37', Espresso: '#4B3621', Mocha: '#A47864',
  Walnut: '#773F1A', Mahogany: '#C04000', Chestnut: '#954535', Auburn: '#A52A2A', 'Brown Sugar': '#AF6E4D',
  Camel: '#C19A6B', Tan: '#D2B48C', Beige: '#F5F5DC', Sand: '#C2B280', Taupe: '#483C32', Fawn: '#E5AA70',
  Wheat: '#F5DEB3', Buff: '#F0DC82', Almond: '#EFDECD', Bisque: '#FFE4C4', Linen: '#FAF0E6',
  Bone: '#E3DAC9', Pearl: '#EAE0C8', Eggshell: '#F0EAD6', Umber: '#635147', Sepia: '#704214',
  'Dark Brown': '#5C4033', 'Café au Lait': '#A67B5B', 'Desert Sand': '#EDC9AF', 'Rosy Brown': '#BC8F8F',
  Cocoa: '#875F42', Hazelnut: '#A9845B', Toffee: '#9B6A43', Biscuit: '#E3C18F', Oatmeal: '#D8CBB3',
  Driftwood: '#AF8751', Bark: '#5A4632', Putty: '#BDB09A', Mushroom: '#A79987',
  // Grays & achromatics
  White: '#FFFFFF', Snow: '#FFFAFA', 'Ghost White': '#F8F8FF', Platinum: '#E5E4E2', Silver: '#C0C0C0',
  'Light Gray': '#D3D3D3', 'Ash Gray': '#B2BEB5', Gray: '#808080', 'Slate Gray': '#708090',
  'Battleship Gray': '#848482', 'Taupe Gray': '#8B8589', Gunmetal: '#2A3439', Charcoal: '#36454F',
  Onyx: '#353839', Jet: '#343434', Black: '#000000', Licorice: '#1A1110', 'Cool Gray': '#8C92AC',
  'Dim Gray': '#696969', Gainsboro: '#DCDCDC', 'Davy’s Gray': '#555555', Smoke: '#738276',
  Pewter: '#8E9294', Graphite: '#41424C', Stone: '#928E85', Fog: '#D7D0C8', Storm: '#4F666A',
  Steel: '#71797E', Ink: '#252837', Obsidian: '#0B1215',
};

const ENTRIES: Array<{ name: string; lab: Lab; chroma: number }> = Object.entries(NAMED_COLORS).map(
  ([name, hex]) => {
    const lab = hexToLab(hex);
    return { name, lab, chroma: labChroma(lab) };
  }
);

/** Matches closer than this (ΔE) get the plain name; looser ones get a modifier. */
const EXACT_ENOUGH = 10;
const SKIP_MODIFIER = /^(Light|Dark|Deep|Pale|Muted|Vivid)\b/;

const modifierFor = (color: Lab, match: Lab): string | null => {
  const dL = color[0] - match[0];
  const dC = labChroma(color) - labChroma(match);

  if (Math.abs(dL) >= Math.abs(dC) * 0.8) {
    if (dL > 0) return color[0] > 85 ? 'Pale' : 'Light';
    return labChroma(color) > 40 ? 'Deep' : 'Dark';
  }
  return dC < 0 ? 'Muted' : 'Vivid';
};

const cache = new Map<string, string>();

/** A descriptive name for a hex color, e.g. "Sage", "Muted Teal", "Deep Coral". */
export const nameColor = (hex: string): string => {
  const key = hex.toUpperCase();
  const cached = cache.get(key);
  if (cached) return cached;

  const lab = hexToLab(key);
  let best = ENTRIES[0];
  let bestDistance = Infinity;
  for (const entry of ENTRIES) {
    const d = deltaE(lab, entry.lab);
    if (d < bestDistance) {
      bestDistance = d;
      best = entry;
    }
  }

  let name = best.name;
  if (bestDistance > EXACT_ENOUGH && !SKIP_MODIFIER.test(name)) {
    const modifier = modifierFor(lab, best.lab);
    if (modifier) name = `${modifier} ${name}`;
  }

  if (cache.size > 2000) cache.clear();
  cache.set(key, name);
  return name;
};
