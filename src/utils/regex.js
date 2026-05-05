/**
 * Zentrale Muster für Surface-Features (AP2). Keine Imports aus core/.
 */

/** https?-URLs bis Whitespace/Klammer */
export const RE_URL = /https?:\/\/[^\s)\]>]+/i;

/** LinkedIn-ähnliche Hashtags (#Wort, Unicode-Buchstaben/Zahlen) */
export const RE_HASHTAG = /#[\p{L}\p{N}_]+/gu;

/** Vorkommen von `?` im String (Rohtest; Surface nutzt {@link hasQuestionMarkOutsideHttpUrls}) */
export const RE_QUESTION_MARK = /\?/;

/** Ziffern, Prozent, Euro (inkl. „100 %“) */
export const RE_NUMBER = /\d|[%€\u20AC‰]/;

/** Schwache Satzanfänge (DE), erster Wortlaut */
export const RE_WEAK_OPENER =
  /^(Dabei|Außerdem|Daher|Deshalb|Somit|Diese|Dieses|Dieser|Zudem|Ferner|Zunächst|Und zwar)\b/i;

/** Mindestens drei aufeinanderfolgende „Emoji“-Grapheme (inkl. ZWJ-Sequenzen vereinfacht). */
export const RE_EMOJI_RUN = /(?:\p{Extended_Pictographic}(?:\u200d\p{Extended_Pictographic}|\uFE0F)*){3}/u;

/**
 * @param {string} s
 */
export function hasUrl(s) {
  return RE_URL.test(s);
}

/**
 * @param {string} s
 */
export function hasHashtag(s) {
  RE_HASHTAG.lastIndex = 0;
  return RE_HASHTAG.test(s);
}

/**
 * Rohtest: irgendwo ein `?` (inkl. in URL-Queries).
 * @param {string} s
 */
export function hasQuestionMark(s) {
  return RE_QUESTION_MARK.test(s ?? "");
}

/**
 * `?` nur außerhalb von `http(s):`-URLs (gleiche Spanne wie {@link RE_URL}).
 * Für `SurfaceFeatures.hasQuestion` / AP3-`cta`, um Querystrings nicht als Satzfrage zu zählen.
 *
 * @param {string} s
 */
export function hasQuestionMarkOutsideHttpUrls(s) {
  const t = s ?? "";
  const stripUrls = new RegExp(RE_URL.source, `${RE_URL.flags}g`);
  const withoutUrls = t.replace(stripUrls, "");
  return RE_QUESTION_MARK.test(withoutUrls);
}

/**
 * @param {string} s
 */
export function hasNumberLike(s) {
  return RE_NUMBER.test(s);
}

/**
 * @param {string} s
 */
export function hasEmojiRun(s) {
  return RE_EMOJI_RUN.test(s);
}

/**
 * @param {string} s — Segmenttext (getrimmt für ersten Token)
 */
export function startsWithWeakOpener(s) {
  const t = s.trim();
  if (!t) return false;
  return RE_WEAK_OPENER.test(t);
}
