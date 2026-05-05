import { LONG_SENTENCE_CHARS, LONG_SENTENCE_WORDS } from "../domain/thresholds.js";
import {
  hasEmojiRun,
  hasHashtag,
  hasNumberLike,
  hasQuestionMarkOutsideHttpUrls,
  hasUrl,
  startsWithWeakOpener,
} from "../utils/regex.js";
import { countCommas, countWords } from "../utils/text-metrics.js";

/**
 * @param {string} text — Segmenttext (wie in `Segment.text`)
 * @returns {import('../domain/types.js').SurfaceFeatures}
 */
export function extractSurfaceFeatures(text) {
  const t = text ?? "";
  const len = t.length;
  const wc = countWords(t);
  const letters = t.replace(/[^\p{L}]/gu, "");
  const isAllCaps =
    letters.length >= 3 &&
    letters === letters.toUpperCase() &&
    /[\p{L}]/u.test(letters);

  return {
    length: len,
    wordCount: wc,
    commaCount: countCommas(t),
    hasQuestion: hasQuestionMarkOutsideHttpUrls(t),
    hasNumber: hasNumberLike(t),
    hasUrl: hasUrl(t),
    hasHashtag: hasHashtag(t),
    hasEmojiRun: hasEmojiRun(t),
    startsWeak: startsWithWeakOpener(t),
    isAllCaps,
  };
}

/**
 * AP2-Aufgabe „lange Sätze“: über Schwellen aus `thresholds.js` (kein extra Feld in §5.5).
 * @param {import('../domain/types.js').SurfaceFeatures} surface
 */
export function isLongSegmentSurface(surface) {
  return (
    surface.wordCount >= LONG_SENTENCE_WORDS ||
    surface.length >= LONG_SENTENCE_CHARS
  );
}
