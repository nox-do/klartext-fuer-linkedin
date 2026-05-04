/**
 * @param {string | null | undefined} raw
 * @param {{ localeHint?: 'de'|'en'|'ru'|'auto' }} [options]
 * @returns {{ raw: string, normalized: string, language: import('../domain/types.js').DetectedLanguage }}
 */
export function normalizeText(raw, options = {}) {
  const r = raw == null ? "" : String(raw);
  const withLf = r.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const normalized = withLf.trim();
  const language = resolveLanguage(normalized, options.localeHint);
  return { raw: r, normalized, language };
}

/**
 * @param {string} normalized
 * @param {'de'|'en'|'ru'|'auto'|undefined} hint
 * @returns {import('../domain/types.js').DetectedLanguage}
 */
function resolveLanguage(normalized, hint) {
  if (hint === "de" || hint === "en" || hint === "ru") return hint;
  if (!normalized) return "unknown";
  if (/[а-яА-ЯёЁ]{2,}/.test(normalized)) return "ru";
  if (/[äöüÄÖÜß]/.test(normalized)) return "de";
  if (/[a-zA-Z]/.test(normalized)) return "en";
  return "unknown";
}

/**
 * Segmentierungssprache für Intl.Segmenter (Fallback: de).
 * @param {import('../domain/types.js').DetectedLanguage} language
 */
export function segmenterLocaleForLanguage(language) {
  if (language === "en") return "en";
  if (language === "ru") return "ru";
  return "de";
}
