/**
 * Kalibrierung AP4 (Rollen) und AP5 (`StructureModel`, `kind`-Schwellen).
 * Anpassungen bewusst zentral — Ziel: stabile Heuristiken, weniger Drift (Review AP4+AP5).
 */

// --- AP4 Rollen (classify-roles) ---

export const ROLE_PAIR_MULTIPLIER = 0.94;

export const CLAIM_HINT_MAX_CHARS = 160;
export const CLAIM_HINT_WEIGHT_NICHT = 0.34;
export const CLAIM_HINT_WEIGHT_SCHEITERT = 0.24;

/** @type {readonly [number, number]} — docSpan neutral wenn nur ein Satz */
export const DOC_SPAN_SINGLE_SENTENCE = 0.34;

export const ROLE_THESIS = {
  contrast: 0.84,
  claimHint: 0.62,
  firstPain: 0.26,
};

export const ROLE_HOOK = {
  contrast: 0.44,
  cta: 0.34,
  firstBoost: 0.34,
  hasQuestion: 0.11,
  isAllCaps: 0.09,
  claimHint: 0.32,
};

export const ROLE_PROBLEM = { pain: 0.88, risk: 0.14 };
export const ROLE_BENEFIT = { scale: 0.9 };
export const ROLE_PROOF = { proof: 0.82, specificity: 0.14, personal: 0.4 };
export const ROLE_EXAMPLE = { scale: 0.92 };

export const ROLE_CTA = {
  signal: 0.8,
  lastParagraph: 0.13,
  lastDoc: 0.09,
  lowSignalThreshold: 0.08,
  noQuestionDampen: 0.35,
};

export const ROLE_RISK = { scale: 0.94 };

export const ROLE_CONTEXT = {
  personal: 0.56,
  midDocBonus: 0.16,
  narrativeBonus: 0.26,
  docSpanLow: 0.1,
  docSpanHigh: 0.92,
};

export const ROLE_TRANSITION = {
  startsWeak: 0.44,
  midParagraph: 0.24,
  contrast: 0.1,
};

export const ROLE_FILLER = {
  wordMin: 30,
  contrastMax: 0.18,
  painMax: 0.22,
  ctaMax: 0.18,
  add: 0.24,
  weakWordMin: 24,
  weakAdd: 0.14,
};

/** Zeit-/Erzähl-Marker für Kontext-Rolle (DE-first). */
export const CONTEXT_NARRATIVE_RE = /Monate|Wochen|Jahren|habe ich|wir haben/i;

// --- AP5 StructureModel ---

export const STRUCTURE_CTA_BLEND_MAX = 0.42;
export const STRUCTURE_CTA_BLEND_LAST_THIRD = 0.58;

export const STRUCTURE_SCAN_WORD_SHORT = 20;
export const STRUCTURE_SCAN_WORD_LONG = 35;
export const STRUCTURE_SCAN_BASE_SHORT = 0.72;
export const STRUCTURE_SCAN_BASE_MID = 0.55;
export const STRUCTURE_SCAN_BASE_LONG = 0.38;
export const STRUCTURE_SCAN_PARA_STEP = 0.05;
export const STRUCTURE_SCAN_PARA_CAP = 0.18;

export const STRUCTURE_SUBSTANCE_SCALE = 1.05;

export const STRUCTURE_RISK_BLEND_SIGNAL = 0.55;
export const STRUCTURE_RISK_BLEND_ROLE = 0.45;

export const STRUCTURE_THESIS_PEAK_SCALE = 0.98;
export const STRUCTURE_ROLE_PEAK_SCALE = 0.95;

export const STRUCTURE_HOOK_BLEND_MAX = 0.48;
export const STRUCTURE_HOOK_BLEND_FIRST = 0.52;
export const STRUCTURE_HOOK_MAX_DAMPEN = 0.88;

/** `topicDrift` in §5.11: nur Satzzahl-Heuristik, keine semantische Topic-Analyse. */
export const TOPIC_DRIFT_SENTENCE_MEDIUM = 8;
export const TOPIC_DRIFT_SENTENCE_HIGH = 18;

// --- AP5 PostKind (infer) ---

export const KIND_ARTICLE_MIN_PARAGRAPHS = 3;
export const KIND_ARTICLE_MIN_CHARS = 1200;
export const KIND_HEADLINE_MAX_WORDS = 14;
export const KIND_HEADLINE_MAX_PARAGRAPHS = 1;
export const KIND_HEADLINE_MAX_CHARS = 180;
export const KIND_INVITE_MAX_WORDS = 95;

/** Heuristik für Einladungs-Ton (unscharf; UI-`kind` bevorzugen). */
export const KIND_INVITE_HINT_RE =
  /\b(vernetzen|Vernetzen|Netzwerk|connect|Kennenlernen|kennenzulernen)\b/i;

// --- AP5 Risiko-Sammlung (Builder, nicht Rule Engine) ---

export const BUILDER_SENSITIVE_SIGNAL_THRESHOLD = 0.48;

// --- AP5 kindConfidence (0–1): niedrig → AP7 format-spezifische Packs zurückhaltend ---

export const KIND_CONFIDENCE_USER_OVERRIDE = 1;
export const KIND_CONFIDENCE_EMPTY = 0;
export const KIND_CONFIDENCE_ARTICLE = 0.82;
export const KIND_CONFIDENCE_HEADLINE = 0.52;
export const KIND_CONFIDENCE_INVITE = 0.62;
/** Längerer Default-Feed: eher wirklich Feed. */
export const KIND_CONFIDENCE_FEED_LONG_WORDS = 40;
export const KIND_CONFIDENCE_FEED_LONG = 0.7;
/** Kurzer Text im Feed-Eimer: oft Headline/Kurz-Feed/Einladung — keine harten Feed-Tipps. */
export const KIND_CONFIDENCE_FEED_SHORT = 0.48;

// --- Fold: Segment-Matching (Stub bis AP6) ---

export const FOLD_SEGMENT_HEAD_CHARS = 48;
export const FOLD_SEGMENT_PREFIX_CHARS = 24;
export const FOLD_MAX_SEGMENT_IDS = 4;
