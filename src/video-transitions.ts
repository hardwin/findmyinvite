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
 * Opening masters hold a long static tail. Start handoff at -4s and run a
 * 2s CSS transition over that hold, then reveal couple copy on the hero.
 */
export const HANDOFF_LEAD_S = 4;
export const VIDEO_TRANSITION_MS = 2000;

/** Prime hero under the opening before handoff begins. */
export const HERO_PRIME_S = 5.5;
