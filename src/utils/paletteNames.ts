const ADJECTIVES = [
  'Misty', 'Golden', 'Velvet', 'Electric', 'Dusty', 'Silent', 'Bright', 'Frosted',
  'Sunny', 'Wild', 'Cosmic', 'Gentle', 'Vivid', 'Faded', 'Bold', 'Urban',
  'Tropical', 'Autumn', 'Midnight', 'Coastal', 'Rustic', 'Neon', 'Pastel', 'Smoky',
];

const NOUNS = [
  'Harbor', 'Meadow', 'Sunset', 'Canyon', 'Lagoon', 'Orchard', 'Horizon', 'Ember',
  'Glacier', 'Dune', 'Forest', 'Bloom', 'Tide', 'Aurora', 'Prism', 'Reef',
  'Garden', 'Skyline', 'Breeze', 'Lantern', 'Mirage', 'Grove', 'Cascade', 'Nebula',
];

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

/**
 * Generates a friendly random name ("Misty Harbor") for unnamed palettes,
 * avoiding names that are already taken when possible.
 */
export const generatePaletteName = (takenNames: Iterable<string> = []): string => {
  const taken = new Set(Array.from(takenNames, n => n.toLowerCase()));

  for (let attempt = 0; attempt < 20; attempt++) {
    const name = `${pick(ADJECTIVES)} ${pick(NOUNS)}`;
    if (!taken.has(name.toLowerCase())) return name;
  }

  const base = `${pick(ADJECTIVES)} ${pick(NOUNS)}`;
  let suffix = 2;
  while (taken.has(`${base} ${suffix}`.toLowerCase())) suffix++;
  return `${base} ${suffix}`;
};
