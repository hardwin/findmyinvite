// details-rajakumari — design "Rajakumari" (the castle 1st-birthday video invite, pink princess theme; owner 2026-11-04: ₹799 + GST,
// English only, the child's photo optional): its fields module is details-castle.js's makeCastle("princess"). Same contract
// as every design's module: pure and deterministic.
import { makeCastle } from "./details-castle.js";
export { DELIVERY_PROMISE, weekdayIndex, fmtTime, fmtTimeRange, fmtDateLong, fmtDateDots, dateLines, castleTime, possessive, ordSuffix } from "./details-castle.js";
const M = makeCastle("princess");
export const {
  DESIGN_ID, DESIGN, BASKET_LABELS, RECEPTION_OPTIONAL, PHOTO_KEYS, PHOTO, parsePhotoBox, photoBoxOf,
  FIELD_KEYS, WORDING_KEYS, CLOSE_UP_KEYS, MULTILINE_KEYS, WORDING_SLIDES, DEFAULT_WORDING, defaultWording, FIXED,
  BASE_FONTS, FONT_SETS, SIZE_KEYS, SIZE_STEPS, STYLE_KEYS, DEFAULT_STYLE, MUSIC, LIMITS, SAMPLE_FIELDS,
  FILM_SECONDS, durationOf, chaptersFor, CHAPTERS, FIELD_CHAPTER, FIELD_CHAPTER_FALLBACK, OPTIONAL_KEYS, requiredKeys, keyShown,
  emptyFields, normalizeFields, isComplete, wordingShown, buildDetails, validateFields,
} = M;
