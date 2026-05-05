/**
 * Kanonische Textmetriken (AP1/AP2). Konsistent mit `buildNormalizedDocument`-Metriken.
 */

/**
 * @param {string} s
 */
export function countWords(s) {
  if (!s || !s.trim()) return 0;
  return s.trim().split(/\s+/).length;
}

/**
 * @param {string} s
 */
export function countCommas(s) {
  if (!s) return 0;
  const m = s.match(/,/g);
  return m ? m.length : 0;
}
