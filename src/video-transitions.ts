/** Runtime opening→hero video transitions (CSS / WAAPI). Launch 2.0 #1. */

export const VIDEO_TRANSITION_PRESETS = [
  'crossfade',
  'fade-black',
  'fade-paper',
  'wipe-left',
  'wipe-right',
  'wipe-up',
  'iris',
  'zoom-cross',
  'curtain',
  'blur-dissolve',
  'slide-left',
  'slide-up',
] as const;

export type VideoTransitionPreset = (typeof VIDEO_TRANSITION_PRESETS)[number];

/** Per-template overrides. Unlisted dual-video templates cycle the preset list. */
export const VIDEO_TRANSITION_BY_TEMPLATE: Record<string, VideoTransitionPreset> = {
  'rose-gold-blush-royal': 'crossfade',
  'royal-prestige-1': 'wipe-left',
  'royal-prestige-2': 'iris',
  'royal-prestige-3': 'fade-black',
  'royal-prestige-4': 'zoom-cross',
  'royal-prestige-5': 'curtain',
  'royal-prestige-6': 'blur-dissolve',
  'royal-heritage-5': 'wipe-right',
  'royal-heritage-6': 'slide-up',
  'royal-heritage-7': 'fade-paper',
  'royal-heritage-8': 'iris',
  'royal-heritage-9': 'wipe-up',
  'royal-heritage-12': 'zoom-cross',
  'royal-heritage-13': 'curtain',
  'royal-heritage-14': 'slide-left',
  'royal-majesty': 'fade-black',
  'modern-minimal-royal': 'crossfade',
  'royal-prestige': 'wipe-left',
  'royal-heritage': 'fade-paper',
  'royal-heritage-1': 'wipe-right',
  'royal-heritage-2': 'blur-dissolve',
  'royal-heritage-3': 'slide-left',
  'royal-heritage-4': 'zoom-cross',
  'royal-grace': 'fade-paper',
  'royal-crest': 'curtain',
  'royal-legacy': 'fade-black',
};

/** Single-video royals (no hero loop): opening fades out when invite opens. */
export const OPENING_ONLY_FADE: VideoTransitionPreset = 'fade-black';

export function videoTransitionFor(templateId: string, hasHeroLoop: boolean): VideoTransitionPreset {
  if (!hasHeroLoop) return OPENING_ONLY_FADE;
  const mapped = VIDEO_TRANSITION_BY_TEMPLATE[templateId];
  if (mapped) return mapped;
  let hash = 0;
  for (let i = 0; i < templateId.length; i++) hash = (hash + templateId.charCodeAt(i) * (i + 1)) % 997;
  return VIDEO_TRANSITION_PRESETS[hash % VIDEO_TRANSITION_PRESETS.length];
}

export const VIDEO_TRANSITION_MS = 750;
