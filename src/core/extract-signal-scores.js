import {
  BENEFIT_PATTERNS,
  BUZZWORD_PATTERN,
  CONTRAST_PATTERNS,
  CTA_AUDIENCE_PRONOUN,
  CTA_PATTERNS,
  CTA_QUESTION_LEAD,
  EXAMPLE_PATTERNS,
  PAIN_PATTERNS,
  PERSONAL_PATTERNS,
  PROOF_PATTERNS,
  RISK_KEYWORD_PATTERNS,
  SPECIFICITY_PATTERNS,
} from "../utils/signal-patterns.js";

/**
 * @param {number} x
 */
function clamp01(x) {
  if (Number.isNaN(x) || x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

/**
 * @param {RegExp[]} patterns
 * @param {string} text
 */
function countPatternMatches(patterns, text) {
  let n = 0;
  for (const re of patterns) {
    if (re.test(text)) n++;
  }
  return n;
}

/**
 * @param {string} text
 */
function scoreContrast(text) {
  if (CONTRAST_PATTERNS[0].test(text)) return 0.88;
  if (CONTRAST_PATTERNS[1].test(text)) return 0.76;
  let s = 0;
  for (let i = 2; i < CONTRAST_PATTERNS.length; i++) {
    if (CONTRAST_PATTERNS[i].test(text)) s = Math.max(s, 0.44);
  }
  return s;
}

/**
 * @param {string} text
 */
function scorePain(text) {
  const hits = countPatternMatches(PAIN_PATTERNS, text);
  if (hits === 0) return 0;
  return clamp01(0.52 + (hits - 1) * 0.14);
}

/**
 * @param {string} text
 */
function scoreBenefit(text) {
  const hits = countPatternMatches(BENEFIT_PATTERNS, text);
  if (hits === 0) return 0;
  return clamp01(0.48 + (hits - 1) * 0.12);
}

/**
 * @param {string} text
 */
function scorePersonal(text) {
  if (countPatternMatches(PERSONAL_PATTERNS, text) === 0) return 0;
  return 0.72;
}

/**
 * @param {import('../domain/types.js').SurfaceFeatures} surface
 * @param {string} text
 */
function scoreSpecificity(surface, text) {
  let s = 0;
  if (surface.hasNumber) s += 0.42;
  if (surface.hasUrl) s += 0.22;
  for (const re of SPECIFICITY_PATTERNS) {
    if (re.test(text)) {
      s += 0.28;
      break;
    }
  }
  return clamp01(s);
}

/**
 * @param {string} text
 */
function scoreRisk(text) {
  const hits = countPatternMatches(RISK_KEYWORD_PATTERNS, text);
  if (hits === 0) return 0;
  return clamp01(0.72 + hits * 0.12);
}

/**
 * @param {import('../domain/types.js').SurfaceFeatures} surface
 * @param {string} text
 */
function scoreCta(surface, text) {
  const t = text.trim();
  const ctaTypes = countCtaTypes(t);

  if (ctaTypes.length > 0) {
    const hasStrongIntent = ctaTypes.some((type) =>
      ["comment", "dm", "follow", "resource", "contact"].includes(type),
    );
    if (hasStrongIntent) {
      return clamp01(0.72 + (ctaTypes.length - 1) * 0.08);
    }
    return 0.58;
  }

  if (!surface.hasQuestion) return 0;
  const lead = CTA_QUESTION_LEAD.test(t);
  const aud = CTA_AUDIENCE_PRONOUN.test(t);
  if (lead && aud) return 0.88;
  if (lead && t.endsWith("?")) return 0.82;
  if (aud && t.includes("?")) return 0.78;
  return 0.5;
}

/**
 * @param {string} text
 */
function countCtaTypes(text) {
  /** @type {string[]} */
  const found = [];
  for (const [type, patterns] of Object.entries(CTA_PATTERNS)) {
    if (patterns.some((re) => re.test(text))) found.push(type);
  }
  return found;
}

/**
 * @param {import('../domain/types.js').SurfaceFeatures} surface
 * @param {string} text
 */
function scoreProof(surface, text) {
  let s = 0;
  if (surface.hasNumber) s += 0.32;
  if (countPatternMatches(PROOF_PATTERNS, text) > 0) s += 0.55;
  return clamp01(s);
}

/**
 * @param {string} text
 */
function scoreExample(text) {
  for (const re of EXAMPLE_PATTERNS) {
    if (re.test(text)) return 0.74;
  }
  return 0;
}

/**
 * @param {string} text
 */
function scoreBuzzword(text) {
  if (!BUZZWORD_PATTERN.test(text)) return 0;
  return 0.62;
}

/**
 * SignalScores aus Oberfläche + Textmustern (AP3, Zieldokument §5.6).
 * Muster sind DE-first; `language` ist für spätere Lokalisierung reserviert.
 *
 * @param {import('../domain/types.js').SurfaceFeatures} surface
 * @param {string} text — gleicher String wie bei `extractSurfaceFeatures`
 * @param {import('../domain/types.js').DetectedLanguage} [_language]
 * @returns {import('../domain/types.js').SignalScores}
 */
export function extractSignalScores(surface, text, _language = "unknown") {
  const t = text ?? "";
  return {
    contrast: clamp01(scoreContrast(t)),
    pain: clamp01(scorePain(t)),
    benefit: clamp01(scoreBenefit(t)),
    personal: clamp01(scorePersonal(t)),
    specificity: clamp01(scoreSpecificity(surface, t)),
    risk: clamp01(scoreRisk(t)),
    cta: clamp01(scoreCta(surface, t)),
    proof: clamp01(scoreProof(surface, t)),
    example: clamp01(scoreExample(t)),
    buzzword: clamp01(scoreBuzzword(t)),
  };
}
