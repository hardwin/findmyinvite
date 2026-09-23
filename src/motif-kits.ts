/** Per-template floating motif kits for Launch 2.0 #2. */

export type MotifShape = 'petal' | 'jasmine' | 'spark' | 'leaf' | 'lantern' | 'dot';

export type MotifKit = {
  shapes: MotifShape[];
  colors: string[];
  density: number;
  drift: number;
};

const GOLD = ['#f5e0a8', '#e8c56a', '#c9a24a', '#fff6d8'];
const ROSE = ['#f2c4d0', '#e8a0b4', '#c45a8a', '#ffe8ef'];
const SAGE = ['#c5d5c0', '#8fad8a', '#5c7a58', '#e8f0e4'];
const WINE = ['#c9a0a8', '#8b3a4a', '#6e1a28', '#f0d8dc'];
const CREAM = ['#f7f0e4', '#e8dcc8', '#d4c4a8', '#fffaf0'];
const SKY = ['#a8c4e8', '#d4e4f7', '#f5e0a8', '#ffe8ef'];

const DEFAULT: MotifKit = {
  shapes: ['petal', 'spark', 'dot'],
  colors: GOLD,
  density: 28,
  drift: 1,
};

/** Explicit kits for cinematic templates (ids match `src/data.ts`). */
export const MOTIF_KIT_BY_TEMPLATE: Record<string, MotifKit> = {
  'rose-gold-blush-royal': {shapes: ['petal', 'spark', 'dot'], colors: ROSE, density: 30, drift: 1},
  'royal-heritage-5': {shapes: ['petal', 'spark', 'lantern'], colors: SKY, density: 28, drift: 1},
  'royal-heritage-6': {shapes: ['petal', 'leaf', 'dot'], colors: ROSE, density: 28, drift: .95},
  'royal-heritage-7': {shapes: ['jasmine', 'petal', 'spark'], colors: [...ROSE, ...GOLD.slice(0, 2)], density: 30, drift: 1},
  'royal-heritage-8': {shapes: ['jasmine', 'petal', 'spark', 'leaf'], colors: WINE, density: 32, drift: 1},
  'royal-heritage-9': {shapes: ['petal', 'jasmine', 'spark'], colors: ROSE, density: 34, drift: 1.1},
  'royal-heritage-12': {shapes: ['petal', 'leaf', 'spark'], colors: ROSE, density: 30, drift: 1},
  'royal-heritage-13': {shapes: ['leaf', 'petal', 'dot'], colors: [...SAGE, ...GOLD.slice(0, 2)], density: 28, drift: .95},
  'royal-heritage-14': {shapes: ['spark', 'dot', 'petal'], colors: [...GOLD, '#ffd9a0'], density: 36, drift: 1.15},
  'royal-prestige-1': {shapes: ['petal', 'spark', 'lantern'], colors: [...GOLD, ...CREAM], density: 30, drift: 1},
  'royal-prestige-2': {shapes: ['petal', 'jasmine', 'spark'], colors: ROSE, density: 32, drift: 1.05},
  'royal-prestige-3': {shapes: ['spark', 'dot', 'petal'], colors: GOLD, density: 28, drift: 1},
  'royal-prestige-4': {shapes: ['spark', 'lantern', 'petal'], colors: GOLD, density: 34, drift: 1.1},
  'royal-prestige-5': {shapes: ['petal', 'leaf', 'jasmine'], colors: [...GOLD, ...SAGE.slice(0, 2)], density: 30, drift: 1},
  'royal-prestige-6': {shapes: ['petal', 'jasmine', 'spark'], colors: [...GOLD, '#f0d48a'], density: 32, drift: 1.05},
};

export function motifKitFor(templateId: string, accent = '#c9a24a'): MotifKit {
  const mapped = MOTIF_KIT_BY_TEMPLATE[templateId];
  if (mapped) return mapped;
  let hash = 0;
  for (let i = 0; i < templateId.length; i++) hash = (hash + templateId.charCodeAt(i) * (i + 1)) % 997;
  const palettes = [GOLD, ROSE, SAGE, WINE, CREAM];
  const shapeSets: MotifShape[][] = [
    ['petal', 'spark', 'dot'],
    ['jasmine', 'petal', 'leaf'],
    ['spark', 'lantern', 'dot'],
    ['leaf', 'petal', 'spark'],
  ];
  return {
    shapes: shapeSets[hash % shapeSets.length],
    colors: [accent, ...palettes[hash % palettes.length]].slice(0, 5),
    density: 24 + (hash % 12),
    drift: .9 + (hash % 5) * .05,
  };
}

export {DEFAULT as DEFAULT_MOTIF_KIT};
