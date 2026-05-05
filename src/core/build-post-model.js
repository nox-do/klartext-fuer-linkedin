/**
 * AP5 — PostModel aus NormalizedDocument (§5.8). Keine Regelpakete, nur Aggregation + Heuristiken.
 */

import { buildNormalizedDocument } from "./segment-document.js";
import { FEED_FOLD_CHARS } from "../domain/fold-constants.js";
import {
  BUILDER_SENSITIVE_SIGNAL_THRESHOLD,
  FOLD_MAX_SEGMENT_IDS,
  FOLD_SEGMENT_HEAD_CHARS,
  FOLD_SEGMENT_PREFIX_CHARS,
  KIND_ARTICLE_MIN_CHARS,
  KIND_ARTICLE_MIN_PARAGRAPHS,
  KIND_CONFIDENCE_ARTICLE,
  KIND_CONFIDENCE_EMPTY,
  KIND_CONFIDENCE_FEED_LONG,
  KIND_CONFIDENCE_FEED_LONG_WORDS,
  KIND_CONFIDENCE_FEED_SHORT,
  KIND_CONFIDENCE_HEADLINE,
  KIND_CONFIDENCE_INVITE,
  KIND_CONFIDENCE_USER_OVERRIDE,
  KIND_HEADLINE_MAX_CHARS,
  KIND_HEADLINE_MAX_PARAGRAPHS,
  KIND_HEADLINE_MAX_WORDS,
  KIND_INVITE_HINT_RE,
  KIND_INVITE_MAX_WORDS,
  STRUCTURE_CTA_BLEND_LAST_THIRD,
  STRUCTURE_CTA_BLEND_MAX,
  STRUCTURE_HOOK_BLEND_FIRST,
  STRUCTURE_HOOK_BLEND_MAX,
  STRUCTURE_HOOK_MAX_DAMPEN,
  STRUCTURE_RISK_BLEND_ROLE,
  STRUCTURE_RISK_BLEND_SIGNAL,
  STRUCTURE_ROLE_PEAK_SCALE,
  STRUCTURE_SCAN_BASE_LONG,
  STRUCTURE_SCAN_BASE_MID,
  STRUCTURE_SCAN_BASE_SHORT,
  STRUCTURE_SCAN_PARA_CAP,
  STRUCTURE_SCAN_PARA_STEP,
  STRUCTURE_SCAN_WORD_LONG,
  STRUCTURE_SCAN_WORD_SHORT,
  STRUCTURE_SUBSTANCE_SCALE,
  STRUCTURE_THESIS_PEAK_SCALE,
  TOPIC_DRIFT_SENTENCE_HIGH,
  TOPIC_DRIFT_SENTENCE_MEDIUM,
} from "../domain/role-and-structure-constants.js";
import { LONG_SENTENCE_CHARS, LONG_SENTENCE_WORDS } from "../domain/thresholds.js";
import { resolveFeedFoldTeaser } from "./resolve-fold-teaser.js";

export const POST_MODEL_VERSION = "0.1.1";

/**
 * @param {string} s
 */
function stableDocId(s) {
  let h = 5381;
  for (let i = 0; i < Math.min(s.length, 2000); i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  }
  return `doc-${(h >>> 0).toString(36)}`;
}

/**
 * @param {number} x
 */
function clamp01(x) {
  if (Number.isNaN(x) || x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

/**
 * @param {import('../domain/types.js').NormalizedDocument} doc
 * @returns {import('../domain/types.js').Segment[]}
 */
export function flattenSegments(doc) {
  /** @type {import('../domain/types.js').Segment[]} */
  const out = [];
  for (const p of doc.paragraphs) {
    for (const s of p.sentences) out.push(s);
  }
  return out;
}

/**
 * @param {import('../domain/types.js').Segment[]} segments
 */
function sentenceSegmentsOnly(segments) {
  return segments.filter((s) => s.type === "sentence");
}

/**
 * @param {string} normalized
 * @param {import('../domain/types.js').DocumentMetrics} metrics
 * @param {import('../domain/types.js').AnalyzePostOptions} options
 * @returns {import('../domain/types.js').PostKind}
 */
function inferPostKind(normalized, metrics, options) {
  if (options.kind) return options.kind;
  if (!metrics.charCount) return "unknown";
  if (metrics.paragraphCount >= KIND_ARTICLE_MIN_PARAGRAPHS && metrics.charCount > KIND_ARTICLE_MIN_CHARS) {
    return "article";
  }
  /** Einladungen oft kurz: vor „Headline“, damit Vernetzungs-Kontext nicht fälschlich als Titelzeile gilt (§5.9). */
  if (KIND_INVITE_HINT_RE.test(normalized) && metrics.wordCount < KIND_INVITE_MAX_WORDS) {
    return "invite";
  }
  if (
    metrics.wordCount <= KIND_HEADLINE_MAX_WORDS &&
    metrics.paragraphCount <= KIND_HEADLINE_MAX_PARAGRAPHS &&
    metrics.charCount < KIND_HEADLINE_MAX_CHARS
  ) {
    return "headline";
  }
  return "feed";
}

/**
 * Nutzerhilfe: bei Unsicherheit niedriger Wert → AP7 soll format-spezifische Packs nicht „hart“ feuern (§5.9).
 * @param {import('../domain/types.js').PostKind} kind
 * @param {import('../domain/types.js').DocumentMetrics} metrics
 * @param {import('../domain/types.js').AnalyzePostOptions} options
 */
function inferKindConfidence(kind, metrics, options) {
  if (options.kind) return KIND_CONFIDENCE_USER_OVERRIDE;
  if (!metrics.charCount) return KIND_CONFIDENCE_EMPTY;
  if (kind === "article") return KIND_CONFIDENCE_ARTICLE;
  if (kind === "headline") return KIND_CONFIDENCE_HEADLINE;
  if (kind === "invite") return KIND_CONFIDENCE_INVITE;
  if (kind === "feed") {
    return metrics.wordCount >= KIND_CONFIDENCE_FEED_LONG_WORDS
      ? KIND_CONFIDENCE_FEED_LONG
      : KIND_CONFIDENCE_FEED_SHORT;
  }
  return KIND_CONFIDENCE_FEED_SHORT;
}

/**
 * @param {import('../domain/types.js').Segment[]} sentenceSegs
 * @param {number} normLen
 * @returns {import('../domain/types.js').StructureModel}
 */
function computeStructure(sentenceSegs, normLen) {
  if (sentenceSegs.length === 0) {
    return {
      hookStrength: 0,
      thesisStrength: 0,
      thesisPosition: null,
      problemStrength: 0,
      benefitStrength: 0,
      ctaStrength: 0,
      scanability: 0,
      substance: 0,
      risk: 0,
      topicDrift: "unknown",
    };
  }

  const maxRole = (key) => Math.max(0, ...sentenceSegs.map((s) => s.roles[key]));

  let bestThesis = 0;
  let thesisCharStart = /** @type {number|null} */ (null);
  for (const s of sentenceSegs) {
    if (s.roles.thesis > bestThesis) {
      bestThesis = s.roles.thesis;
      thesisCharStart = s.charStart;
    }
  }

  const thesisPosition =
    normLen > 0 && thesisCharStart !== null ? clamp01(thesisCharStart / normLen) : null;

  const n = sentenceSegs.length;
  const ctaMax = maxRole("cta");
  const lastThird = sentenceSegs.slice(Math.max(0, Math.floor((2 * n) / 3)));
  const ctaLastThird = lastThird.length ? Math.max(0, ...lastThird.map((s) => s.roles.cta)) : 0;
  const ctaStrength = clamp01(
    STRUCTURE_CTA_BLEND_MAX * ctaMax + STRUCTURE_CTA_BLEND_LAST_THIRD * ctaLastThird,
  );

  const avgWords =
    sentenceSegs.reduce((a, s) => a + s.surface.wordCount, 0) / sentenceSegs.length;
  let scanBase =
    avgWords < STRUCTURE_SCAN_WORD_SHORT
      ? STRUCTURE_SCAN_BASE_SHORT
      : avgWords < STRUCTURE_SCAN_WORD_LONG
        ? STRUCTURE_SCAN_BASE_MID
        : STRUCTURE_SCAN_BASE_LONG;
  const uniqueParas = new Set(sentenceSegs.map((s) => s.paragraphIndex)).size;
  const paraHint = Math.min(
    STRUCTURE_SCAN_PARA_CAP,
    Math.max(1, uniqueParas) * STRUCTURE_SCAN_PARA_STEP,
  );
  const scanability = clamp01(scanBase + paraHint);

  const substanceRaw =
    sentenceSegs.reduce(
      (a, s) => a + (s.signals.proof + s.signals.specificity + s.signals.benefit) / 3,
      0,
    ) / sentenceSegs.length;
  const substance = clamp01(substanceRaw * STRUCTURE_SUBSTANCE_SCALE);

  const riskSig = Math.max(0, ...sentenceSegs.map((s) => s.signals.risk));
  const riskRole = maxRole("risk");
  const risk = clamp01(
    STRUCTURE_RISK_BLEND_SIGNAL * riskSig + STRUCTURE_RISK_BLEND_ROLE * riskRole,
  );

  let topicDrift = /** @type {import('../domain/types.js').StructureModel['topicDrift']} */ ("low");
  if (sentenceSegs.length > TOPIC_DRIFT_SENTENCE_HIGH) topicDrift = "high";
  else if (sentenceSegs.length > TOPIC_DRIFT_SENTENCE_MEDIUM) topicDrift = "medium";

  const hookFirst = sentenceSegs.length ? sentenceSegs[0].roles.hook : 0;
  const hookMax = maxRole("hook");
  const hookStrength = clamp01(
    STRUCTURE_HOOK_BLEND_MAX * hookMax +
      STRUCTURE_HOOK_BLEND_FIRST *
        Math.max(hookFirst, hookMax * STRUCTURE_HOOK_MAX_DAMPEN),
  );

  return {
    hookStrength,
    thesisStrength: clamp01(bestThesis * STRUCTURE_THESIS_PEAK_SCALE),
    thesisPosition,
    problemStrength: clamp01(maxRole("problem") * STRUCTURE_ROLE_PEAK_SCALE),
    benefitStrength: clamp01(maxRole("benefit") * STRUCTURE_ROLE_PEAK_SCALE),
    ctaStrength,
    scanability,
    substance,
    risk,
    topicDrift,
  };
}

/**
 * @param {string} raw
 * @param {string} normalized
 * @param {import('../domain/types.js').Paragraph[]} paragraphs
 * @param {import('../domain/types.js').Segment[]} flatSegs
 * @returns {import('../domain/types.js').FoldModel}
 */
function computeFold(raw, normalized, paragraphs, flatSegs) {
  const firstLine = normalized.split("\n")[0]?.trim() ?? "";
  const firstPara = paragraphs[0]?.text ?? "";
  const foldResolved = resolveFeedFoldTeaser(raw, FEED_FOLD_CHARS);

  /** @type {import('../domain/types.js').SnippetSource} */
  let snippetSource = "fallback";
  if (foldResolved.source === "ranked" || foldResolved.source === "ranked-weak") {
    snippetSource = "ranked_segment";
  } else {
    snippetSource = "fallback";
  }

  let bestSnippetText = foldResolved.teaser;
  if (!bestSnippetText && firstLine) {
    bestSnippetText =
      firstLine.length <= FEED_FOLD_CHARS
        ? firstLine
        : `${firstLine.slice(0, Math.max(0, FEED_FOLD_CHARS - 1)).trimEnd()}…`;
    snippetSource = "first_line";
  }

  const teaserNorm = bestSnippetText.replace(/…\s*$/, "").trim();
  /** @type {string[]} */
  const bestSnippetSegmentIds = [];
  if (teaserNorm) {
    for (const s of flatSegs) {
      if (s.type !== "sentence") continue;
      const head = s.text.slice(0, Math.min(FOLD_SEGMENT_HEAD_CHARS, s.text.length));
      if (
        head &&
        (teaserNorm.includes(head) ||
          teaserNorm.startsWith(s.text.slice(0, FOLD_SEGMENT_PREFIX_CHARS)))
      ) {
        bestSnippetSegmentIds.push(s.id);
      }
      if (bestSnippetSegmentIds.length >= FOLD_MAX_SEGMENT_IDS) break;
    }
  }

  return {
    approximateVisibleChars: FEED_FOLD_CHARS,
    firstLine,
    firstLineLength: firstLine.length,
    firstParagraphLength: firstPara.length,
    bestSnippetSegmentIds,
    bestSnippetText,
    snippetSource,
  };
}

/**
 * @param {import('../domain/types.js').Segment[]} sentenceSegs
 * @param {string} normalized
 */
function collectRisks(sentenceSegs, normalized) {
  /** @type {import('../domain/types.js').RiskFinding[]} */
  const risks = [];
  let seq = 0;
  if (!normalized.trim()) {
    risks.push({
      id: `risk-${seq++}`,
      code: "empty_text",
      level: "warn",
      message: "Text ist leer.",
    });
    return risks;
  }

  for (const s of sentenceSegs) {
    if (s.signals.risk >= BUILDER_SENSITIVE_SIGNAL_THRESHOLD) {
      risks.push({
        id: `risk-${seq++}`,
        code: "sensitive_keyword",
        level: "risk",
        message: "Mögliche heikle Begriffe (Signal).",
        segmentId: s.id,
      });
    }
  }

  const longSeg = sentenceSegs.find(
    (s) =>
      s.surface.wordCount >= LONG_SENTENCE_WORDS || s.surface.length >= LONG_SENTENCE_CHARS,
  );
  if (longSeg) {
    risks.push({
      id: `risk-${seq++}`,
      code: "long_sentence",
      level: "hint",
      message: "Sehr langer Satz — Lesbarkeit prüfen.",
      segmentId: longSeg.id,
    });
  }

  return risks;
}

/**
 * @param {string | null | undefined} raw
 * @param {import('../domain/types.js').AnalyzePostOptions} [options]
 * @returns {import('../domain/types.js').PostModel}
 */
export function buildPostModel(raw, options = {}) {
  const doc = buildNormalizedDocument(raw, {
    localeHint: options.localeHint,
    includeSentencePairs: options.includeSentencePairs === true,
  });

  const flatSegs = flattenSegments(doc);
  const sentenceSegs = sentenceSegmentsOnly(flatSegs);
  const kind = inferPostKind(doc.normalized, doc.metrics, options);
  const kindConfidence = clamp01(inferKindConfidence(kind, doc.metrics, options));
  const structure = computeStructure(sentenceSegs, doc.normalized.length);
  const fold = computeFold(doc.raw, doc.normalized, doc.paragraphs, flatSegs);
  const risks = collectRisks(sentenceSegs, doc.normalized);

  /** @type {import('../domain/types.js').PostModel} */
  const post = {
    id: options.id ?? stableDocId(doc.normalized),
    kind,
    kindConfidence,
    language: doc.language,
    raw: doc.raw,
    normalized: doc.normalized,
    metrics: doc.metrics,
    paragraphs: doc.paragraphs,
    segments: flatSegs,
    fold,
    structure,
    risks,
    version: POST_MODEL_VERSION,
  };

  if (options.includeDebug === true) {
    post.debug = {
      sentenceSegmentCount: sentenceSegs.length,
      totalSegmentCount: flatSegs.length,
      topicDriftNote:
        "topicDrift = Satzzahl-Heuristik (keine semantische Themen-Analyse), vgl. §5.11 Zielbild.",
    };
  }

  return post;
}

/**
 * Öffentliche API (Zielbild AP5).
 * @param {string | null | undefined} raw
 * @param {import('../domain/types.js').AnalyzePostOptions} [options]
 * @returns {import('../domain/types.js').PostModel}
 */
export function analyzePost(raw, options) {
  return buildPostModel(raw, options ?? {});
}
