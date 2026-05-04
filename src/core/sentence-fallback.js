/**
 * Satzgrenzen ohne Intl.Segmenter (AP1, Zieldokument).
 * @param {string} text — ein Absatz
 * @returns {{ localStart: number, localEnd: number }[]}
 */
export function rangesFallbackSentences(text) {
  /** @type {{ localStart: number, localEnd: number }[]} */
  const ranges = [];
  const n = text.length;
  let sentStart = 0;
  let i = 0;
  while (i < n) {
    const ch = text[i];
    if (".!?…".includes(ch) && isLikelySentenceEnd(text, i)) {
      const end = i + 1;
      pushTrimmedRange(text, sentStart, end, ranges);
      i = skipSpaces(text, end);
      sentStart = i;
    } else {
      i++;
    }
  }
  if (sentStart < n) pushTrimmedRange(text, sentStart, n, ranges);
  if (!ranges.length && text.trim()) {
    pushTrimmedRange(text, 0, n, ranges);
  }
  return ranges;
}

/**
 * @param {string} text
 * @param {number} punctIndex
 */
function isLikelySentenceEnd(text, punctIndex) {
  let j = skipSpaces(text, punctIndex + 1);
  if (j >= text.length) return true;
  const next = text[j];
  return (
    /[A-ZÄÖÜА-Я]/.test(next) ||
    /[0-9]/.test(next) ||
    /[\u201e"\u00ab\u201c'[(]/.test(next)
  );
}

/**
 * @param {string} text
 * @param {number} from
 */
function skipSpaces(text, from) {
  let j = from;
  while (j < text.length && /\s/.test(text[j])) j++;
  return j;
}

/**
 * @param {string} text
 * @param {number} a
 * @param {number} b
 * @param {{ localStart: number, localEnd: number }[]} ranges
 */
function pushTrimmedRange(text, a, b, ranges) {
  let t0 = a;
  let t1 = b;
  while (t0 < t1 && /\s/.test(text[t0])) t0++;
  while (t1 > t0 && /\s/.test(text[t1 - 1])) t1--;
  if (t0 < t1) ranges.push({ localStart: t0, localEnd: t1 });
}
