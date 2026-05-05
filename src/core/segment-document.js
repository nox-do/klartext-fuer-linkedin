import { normalizeText, segmenterLocaleForLanguage } from "./normalize-text.js";
import { classifyRoles } from "./classify-roles.js";
import { extractSignalScores } from "./extract-signal-scores.js";
import { extractSurfaceFeatures } from "./extract-surface-features.js";
import { rangesFallbackSentences } from "./sentence-fallback.js";
import { countWords } from "../utils/text-metrics.js";

/**
 * Vollständiges NormalizedDocument (AP1, Zieldokument §5.2).
 * @param {string | null | undefined} raw
 * @param {{ localeHint?: 'de'|'en'|'ru'|'auto', includeSentencePairs?: boolean }} [options] — Satzpaare nur bei `includeSentencePairs: true`
 * @returns {import('../domain/types.js').NormalizedDocument}
 */
export function buildNormalizedDocument(raw, options = {}) {
  const { raw: rawStr, normalized, language } = normalizeText(raw, {
    localeHint: options.localeHint,
  });
  const paragraphs = splitParagraphs(normalized);
  const includePairs = options.includeSentencePairs === true;

  /** @type {import('../domain/types.js').Paragraph[]} */
  const outParagraphs = [];
  let sentenceTotal = 0;

  /** @type {number[]} */
  const sentenceCountsPerParagraph = paragraphs.map((p) =>
    sentenceRanges(p.text, language).length,
  );
  const totalDocSentences = sentenceCountsPerParagraph.reduce((a, b) => a + b, 0);
  let docSentenceOffset = 0;

  for (let pi = 0; pi < paragraphs.length; pi++) {
    const { charStart, charEnd, text } = paragraphs[pi];
    const ranges = sentenceRanges(text, language);
    const sentenceSegments = buildSentenceSegments(
      text,
      ranges,
      charStart,
      pi,
      language,
      includePairs,
      {
        paragraphSentenceCount: sentenceCountsPerParagraph[pi],
        docSentenceOffsetStart: docSentenceOffset,
        docSentenceTotal: totalDocSentences,
      }
    );
    docSentenceOffset += sentenceCountsPerParagraph[pi];
    sentenceTotal += sentenceSegments.filter((s) => s.type === "sentence").length;
    outParagraphs.push({
      id: `p${pi}`,
      index: pi,
      text,
      charStart,
      charEnd,
      sentences: sentenceSegments,
    });
  }

  return {
    raw: rawStr,
    normalized,
    language,
    paragraphs: outParagraphs,
    metrics: {
      charCount: normalized.length,
      wordCount: countWords(normalized),
      paragraphCount: outParagraphs.length,
      sentenceCount: sentenceTotal,
    },
  };
}

/**
 * @param {string} normalized
 * @returns {{ charStart: number, charEnd: number, text: string }[]}
 */
function splitParagraphs(normalized) {
  if (!normalized) return [];
  /** @type {{ charStart: number, charEnd: number, text: string }[]} */
  const out = [];
  let blockStart = 0;
  const re = /\n\s*\n/g;
  let m;
  while ((m = re.exec(normalized)) !== null) {
    pushParagraphBlock(out, normalized, blockStart, m.index);
    blockStart = m.index + m[0].length;
  }
  pushParagraphBlock(out, normalized, blockStart, normalized.length);
  return out;
}

/**
 * @param {{ charStart: number, charEnd: number, text: string }[]} out
 * @param {string} norm
 * @param {number} blockStart
 * @param {number} blockEnd
 */
function pushParagraphBlock(out, norm, blockStart, blockEnd) {
  const slice = norm.slice(blockStart, blockEnd);
  const lead = slice.length - slice.trimStart().length;
  const trail = slice.length - slice.trimEnd().length;
  const t0 = blockStart + lead;
  const t1 = blockEnd - trail;
  if (t0 >= t1) return;
  out.push({ charStart: t0, charEnd: t1, text: norm.slice(t0, t1) });
}

/**
 * @typedef {Object} RolePlacement
 * @property {number} paragraphSentenceCount
 * @property {number} docSentenceOffsetStart
 * @property {number} docSentenceTotal
 */

/**
 * @param {string} paragraphText
 * @param {{ localStart: number, localEnd: number }[]} ranges
 * @param {number} paragraphGlobalStart
 * @param {number} paragraphIndex
 * @param {import('../domain/types.js').DetectedLanguage} language
 * @param {boolean} includePairs
 * @param {RolePlacement} rp
 * @returns {import('../domain/types.js').Segment[]}
 */
function buildSentenceSegments(
  paragraphText,
  ranges,
  paragraphGlobalStart,
  paragraphIndex,
  language,
  includePairs,
  rp
) {
  /** @type {import('../domain/types.js').Segment[]} */
  const sentences = [];
  for (let si = 0; si < ranges.length; si++) {
    const { localStart, localEnd } = ranges[si];
    const g0 = paragraphGlobalStart + localStart;
    const g1 = paragraphGlobalStart + localEnd;
    const text = paragraphText.slice(localStart, localEnd);
    const surface = extractSurfaceFeatures(text);
    const signals = extractSignalScores(surface, text, language);
    const roles = classifyRoles(surface, signals, {
      segmentType: "sentence",
      docSentenceIndex: rp.docSentenceOffsetStart + si,
      docSentenceCount: rp.docSentenceTotal,
      paragraphSentenceIndex: si,
      paragraphSentenceCount: rp.paragraphSentenceCount,
      text,
    });
    sentences.push({
      id: `p${paragraphIndex}-s${si}`,
      type: "sentence",
      text,
      paragraphIndex: paragraphIndex,
      sentenceIndex: si,
      charStart: g0,
      charEnd: g1,
      surface,
      signals,
      roles,
    });
  }

  if (includePairs && ranges.length >= 2) {
    for (let si = 0; si < ranges.length - 1; si++) {
      const a = ranges[si];
      const b = ranges[si + 1];
      const localStart = a.localStart;
      const localEnd = b.localEnd;
      const g0 = paragraphGlobalStart + localStart;
      const g1 = paragraphGlobalStart + localEnd;
      const text = paragraphText.slice(localStart, localEnd);
      const surface = extractSurfaceFeatures(text);
      const signals = extractSignalScores(surface, text, language);
      const roles = classifyRoles(surface, signals, {
        segmentType: "sentence_pair",
        docSentenceIndex: rp.docSentenceOffsetStart + si,
        docSentenceCount: rp.docSentenceTotal,
        paragraphSentenceIndex: si,
        paragraphSentenceCount: rp.paragraphSentenceCount,
        text,
      });
      sentences.push({
        id: `p${paragraphIndex}-sp${si}-${si + 1}`,
        type: "sentence_pair",
        text,
        paragraphIndex: paragraphIndex,
        charStart: g0,
        charEnd: g1,
        surface,
        signals,
        roles,
      });
    }
  }

  return sentences;
}

/**
 * @param {string} text — Absatztext
 * @param {import('../domain/types.js').DetectedLanguage} language
 * @returns {{ localStart: number, localEnd: number }[]}
 */
function sentenceRanges(text, language) {
  if (!text.trim()) return [];
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    const loc = segmenterLocaleForLanguage(language);
    try {
      const seg = new Intl.Segmenter(loc, { granularity: "sentence" });
      return rangesFromIntlSegmenter(text, seg);
    } catch {
      /* Intl locale unsupported */
    }
  }
  return rangesFallbackSentences(text);
}

/**
 * @param {string} text
 * @param {Intl.Segmenter} seg
 */
function rangesFromIntlSegmenter(text, seg) {
  /** @type {{ localStart: number, localEnd: number }[]} */
  const ranges = [];
  let cursor = 0;
  for (const data of seg.segment(text)) {
    const piece = data.segment;
    let start;
    if (typeof data.index === "number") {
      start = data.index;
    } else if (text.startsWith(piece, cursor)) {
      start = cursor;
    } else {
      start = text.indexOf(piece, cursor);
    }
    if (start < 0) continue;
    const end = start + piece.length;
    cursor = end;
    const lead = piece.length - piece.trimStart().length;
    const trail = piece.length - piece.trimEnd().length;
    const t0 = start + lead;
    const t1 = end - trail;
    if (t0 < t1) ranges.push({ localStart: t0, localEnd: t1 });
  }
  return ranges.length ? ranges : rangesFallbackSentences(text);
}
