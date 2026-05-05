/**
 * AP4 — Rollen aus SignalScores, Position und wenigen Text-Hinweisen (Claim-Ansatz).
 * Keine ML; mehrere Rollen > 0 gleichzeitig möglich.
 */

import {
  CLAIM_HINT_MAX_CHARS,
  CLAIM_HINT_WEIGHT_NICHT,
  CLAIM_HINT_WEIGHT_SCHEITERT,
  CONTEXT_NARRATIVE_RE,
  DOC_SPAN_SINGLE_SENTENCE,
  ROLE_BENEFIT,
  ROLE_CONTEXT,
  ROLE_CTA,
  ROLE_EXAMPLE,
  ROLE_FILLER,
  ROLE_HOOK,
  ROLE_PAIR_MULTIPLIER,
  ROLE_PROBLEM,
  ROLE_PROOF,
  ROLE_RISK,
  ROLE_THESIS,
  ROLE_TRANSITION,
} from "../domain/role-and-structure-constants.js";

/**
 * @typedef {Object} RoleClassificationContext
 * @property {import('../domain/types.js').SegmentType} segmentType
 * @property {number} docSentenceIndex — Index unter reinen `sentence`-Segmenten (0-basiert)
 * @property {number} docSentenceCount — Anzahl `sentence`-Segmente gesamt
 * @property {number} paragraphSentenceIndex — Satzindex im Absatz
 * @property {number} paragraphSentenceCount — Sätze im Absatz
 * @property {string} text — Segmenttext (nur für wenige narrative/Claim-Marker)
 */

/**
 * @param {number} x
 */
function clamp01(x) {
  if (Number.isNaN(x) || x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

/**
 * Erste-Satz-Claim ohne vollständiges Kontrast-Signal (§5.7 thesis vs. §5.6 contrast).
 * @param {string} text
 * @param {boolean} isFirstInDoc
 */
function claimSetupHint(text, isFirstInDoc) {
  if (!isFirstInDoc || !text) return 0;
  const t = text.trim();
  if (t.length > CLAIM_HINT_MAX_CHARS) return 0;
  let h = 0;
  if (/\bnicht\b/i.test(t)) h += CLAIM_HINT_WEIGHT_NICHT;
  if (/\bscheitert(e|)?\b/i.test(t) || /\bscheitern\b/i.test(t)) h += CLAIM_HINT_WEIGHT_SCHEITERT;
  return clamp01(h);
}

/**
 * @param {import('../domain/types.js').SurfaceFeatures} surface
 * @param {import('../domain/types.js').SignalScores} signals
 * @param {RoleClassificationContext} ctx
 * @returns {import('../domain/types.js').RoleScores}
 */
export function classifyRoles(surface, signals, ctx) {
  const text = ctx.text ?? "";
  const pairTweak = ctx.segmentType === "sentence_pair" ? ROLE_PAIR_MULTIPLIER : 1;

  const nDoc = ctx.docSentenceCount;
  const isFirstInDoc = nDoc > 0 && ctx.docSentenceIndex === 0;
  const isLastInDoc = nDoc > 0 && ctx.docSentenceIndex === nDoc - 1;
  const nPara = ctx.paragraphSentenceCount;
  const isLastInParagraph = nPara > 0 && ctx.paragraphSentenceIndex === nPara - 1;
  const isMidParagraph = nPara > 1 && ctx.paragraphSentenceIndex > 0 && ctx.paragraphSentenceIndex < nPara - 1;

  const docSpan = nDoc <= 1 ? DOC_SPAN_SINGLE_SENTENCE : ctx.docSentenceIndex / (nDoc - 1);

  const claimHint = claimSetupHint(text, isFirstInDoc);

  let thesis =
    signals.contrast * ROLE_THESIS.contrast +
    claimHint * ROLE_THESIS.claimHint +
    (isFirstInDoc ? signals.pain * ROLE_THESIS.firstPain : 0);
  thesis *= pairTweak;
  thesis = clamp01(thesis);

  let hook =
    signals.contrast * ROLE_HOOK.contrast +
    signals.cta * ROLE_HOOK.cta +
    (isFirstInDoc ? ROLE_HOOK.firstBoost : 0);
  hook += surface.hasQuestion ? ROLE_HOOK.hasQuestion : 0;
  hook += surface.isAllCaps ? ROLE_HOOK.isAllCaps : 0;
  hook += claimHint * ROLE_HOOK.claimHint;
  hook *= pairTweak;
  hook = clamp01(hook);

  const problem = clamp01(signals.pain * ROLE_PROBLEM.pain + signals.risk * ROLE_PROBLEM.risk);

  const benefit = clamp01(signals.benefit * ROLE_BENEFIT.scale);

  let proof = clamp01(
    signals.proof * ROLE_PROOF.proof +
      signals.specificity * ROLE_PROOF.specificity +
      signals.personal * ROLE_PROOF.personal,
  );

  const example = clamp01(signals.example * ROLE_EXAMPLE.scale);

  let cta =
    signals.cta * ROLE_CTA.signal +
    (isLastInParagraph ? ROLE_CTA.lastParagraph : 0) +
    (isLastInDoc ? ROLE_CTA.lastDoc : 0);
  if (!surface.hasQuestion && signals.cta < ROLE_CTA.lowSignalThreshold) {
    cta *= ROLE_CTA.noQuestionDampen;
  }
  cta = clamp01(cta);

  const risk = clamp01(signals.risk * ROLE_RISK.scale);

  let context = signals.personal * ROLE_CONTEXT.personal;
  if (nDoc <= 1 || (docSpan > ROLE_CONTEXT.docSpanLow && docSpan < ROLE_CONTEXT.docSpanHigh)) {
    context += ROLE_CONTEXT.midDocBonus;
  }
  if (CONTEXT_NARRATIVE_RE.test(text)) context += ROLE_CONTEXT.narrativeBonus;
  context *= pairTweak;
  context = clamp01(context);

  const transition = clamp01(
    (surface.startsWeak ? ROLE_TRANSITION.startsWeak : 0) +
      (isMidParagraph ? ROLE_TRANSITION.midParagraph : 0) +
      signals.contrast * ROLE_TRANSITION.contrast,
  );

  let filler = 0;
  if (
    surface.wordCount >= ROLE_FILLER.wordMin &&
    signals.contrast < ROLE_FILLER.contrastMax &&
    signals.pain < ROLE_FILLER.painMax &&
    signals.cta < ROLE_FILLER.ctaMax
  ) {
    filler += ROLE_FILLER.add;
  }
  if (surface.startsWeak && surface.wordCount >= ROLE_FILLER.weakWordMin) filler += ROLE_FILLER.weakAdd;
  filler = clamp01(filler);

  return {
    hook,
    context,
    thesis,
    problem,
    benefit,
    example,
    proof,
    transition,
    cta,
    risk,
    filler,
  };
}
