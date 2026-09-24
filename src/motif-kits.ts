/** Per-template motif kits — shapes map to SVG files in /assets/motifs/. */

export type MotifShape =
  | 'petal'
  | 'jasmine'
  | 'vine-leaf'
  | 'foil'
  | 'lucide-flower'
  | 'lucide-leaf'
  | 'lucide-sparkles';

export type MotifKit = {
  shapes: MotifShape[];
  colors: string[];
  density: number;
  drift: number;
};

/** File basename under /assets/motifs/ (no .svg). */
export const MOTIF_SVG: Record<MotifShape, string> = {
  petal: 'petal',
  jasmine: 'jasmine',
  'vine-leaf': 'vine-leaf',
  foil: 'foil',
  'lucide-flower': 'lucide-flower',
  'lucide-leaf': 'lucide-leaf',
  'lucide-sparkles': 'lucide-sparkles',
};

const GOLD = ['#c9a24a', '#a67c2e', '#e0b85c', '#8a6420'];
const ROSE = ['#c45a7a', '#a83d5c', '#d4789a', '#8b2f4a'];
const SAGE = ['#c5d5c0', '#8fad8a', '#5c7a58', '#e8f0e4'];
const WINE = ['#c9a0a8', '#8b3a4a', '#6e1a28', '#f0d8dc'];
const CREAM = ['#f7f0e4', '#e8dcc8', '#d4c4a8', '#fffaf0'];
const SKY = ['#a8c4e8', '#d4e4f7', '#f5e0a8', '#ffe8ef'];

const FLORAL: MotifShape[] = ['petal', 'jasmine', 'lucide-flower', 'foil'];
const BOTANICAL: MotifShape[] = ['vine-leaf', 'lucide-leaf', 'petal', 'foil'];
const SPARKLY: MotifShape[] = ['foil', 'lucide-sparkles', 'petal', 'lucide-flower'];

export const MOTIF_KIT_BY_TEMPLATE: Record<string, MotifKit> = {
  'rose-gold-blush-royal': {shapes: FLORAL, colors: ROSE, density: 18, drift: 0.85},
  'royal-heritage-5': {shapes: SPARKLY, colors: SKY, density: 17, drift: 0.85},
  'royal-heritage-6': {shapes: BOTANICAL, colors: ROSE, density: 17, drift: 0.81},
  'royal-heritage-7': {shapes: FLORAL, colors: [...ROSE, ...GOLD.slice(0, 2)], density: 18, drift: 0.85},
  'royal-heritage-8': {shapes: FLORAL, colors: WINE, density: 19, drift: 0.85},
  'royal-heritage-9': {shapes: FLORAL, colors: ROSE, density: 20, drift: 0.89},
  'royal-heritage-12': {shapes: BOTANICAL, colors: ROSE, density: 18, drift: 0.85},
  'royal-heritage-13': {shapes: BOTANICAL, colors: [...SAGE, ...GOLD.slice(0, 2)], density: 17, drift: 0.81},
  'royal-heritage-14': {shapes: SPARKLY, colors: [...GOLD, '#ffd9a0'], density: 21, drift: 0.94},
  'royal-prestige-1': {shapes: SPARKLY, colors: [...GOLD, ...CREAM], density: 18, drift: 0.85},
  'royal-prestige-2': {shapes: FLORAL, colors: ROSE, density: 19, drift: 0.89},
  'royal-prestige-3': {shapes: SPARKLY, colors: GOLD, density: 17, drift: 0.85},
  'royal-prestige-4': {shapes: SPARKLY, colors: GOLD, density: 20, drift: 0.94},
  'royal-prestige-5': {shapes: BOTANICAL, colors: [...GOLD, ...SAGE.slice(0, 2)], density: 18, drift: 0.85},
  'royal-prestige-6': {shapes: FLORAL, colors: [...GOLD, '#f0d48a'], density: 19, drift: 0.89},
};

export function motifKitFor(templateId: string, accent = '#c9a24a'): MotifKit {
  const mapped = MOTIF_KIT_BY_TEMPLATE[templateId];
  if (mapped) return mapped;
  let hash = 0;
  for (let i = 0; i < templateId.length; i++) hash = (hash + templateId.charCodeAt(i) * (i + 1)) % 997;
  const palettes = [GOLD, ROSE, SAGE, WINE, CREAM];
  const shapeSets = [FLORAL, BOTANICAL, SPARKLY];
  return {
    shapes: shapeSets[hash % shapeSets.length],
    colors: [accent, ...palettes[hash % palettes.length]].slice(0, 5),
    density: 15 + (hash % 10),
    drift: 0.77 + (hash % 5) * .05,
  };
}
