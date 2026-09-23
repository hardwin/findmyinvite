/** Runtime opening→hero video transitions (CSS). Launch 2.0 #1. */

/** Only the three Ashok-approved looks (2026-09-24). */
export const VIDEO_TRANSITION_PRESETS = ['iris', 'zoom-cross', 'slide-up'] as const;

export type VideoTransitionPreset = (typeof VIDEO_TRANSITION_PRESETS)[number];

/** Stable per-template pick among the three (feels random across the gallery). */
export function videoTransitionFor(templateId: string, hasHeroLoop: boolean): VideoTransitionPreset {
  if (!hasHeroLoop) return 'iris';
  let hash = 0;
  for (let i = 0; i < templateId.length; i++) hash = (hash + templateId.charCodeAt(i) * (i + 1)) % 997;
  return VIDEO_TRANSITION_PRESETS[hash % VIDEO_TRANSITION_PRESETS.length];
}

/**
 * Opening masters hold ~2s at the end. Start handoff at -2s and run the
 * transition for those 2s so the pause is covered, then reveal couple copy.
 */
export const HANDOFF_LEAD_S = 2;
export const VIDEO_TRANSITION_MS = 2000;

/** Prime hero under the opening before handoff begins. */
export const HERO_PRIME_S = 3.5;
