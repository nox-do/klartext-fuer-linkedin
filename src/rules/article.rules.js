import { rec } from "./_helpers.js";

export const ARTICLE_PACK_ID = "article";

/**
 * AP7-Skeleton für Artikel.
 * @param {import('../domain/recommendation-types.js').RuleContext} ctx
 * @returns {import('../domain/recommendation-types.js').RuleResult[]}
 */
export function runArticleRules(ctx) {
  const { post } = ctx;
  if (post.kind !== "article" || post.kindConfidence < 0.7) return [];
  /** @type {import('../domain/recommendation-types.js').RuleResult[]} */
  const out = [];

  if (post.structure.thesisPosition !== null && post.structure.thesisPosition > 0.35) {
    out.push(
      rec({
        id: "article.thesis_late",
        packId: ARTICLE_PACK_ID,
        ruleId: "thesis_late",
        level: "hint",
        priority: 40,
        title: "Leitthese spät platziert",
        message: "Der Artikel startet ohne klare Leitthese, dadurch fehlt früh Orientierung.",
        action: "Formuliere die Leitthese im ersten Absatz in einem präzisen Satz.",
        topicBucket: "structure",
        tags: ["article", "structure"],
      }),
    );
  }

  const hasStrongEarlyThesis =
    post.structure.thesisStrength >= 0.7 &&
    post.structure.thesisPosition !== null &&
    post.structure.thesisPosition <= 0.33;
  const highlyScannable = post.structure.scanability >= 0.88;

  // Langer, komplexer Artikel mit schwacher Führung: roten Faden stärken.
  if (
    post.kindConfidence >= 0.75 &&
    post.metrics.charCount >= 500 &&
    post.metrics.paragraphCount >= 3 &&
    (post.structure.topicDrift === "high" || post.structure.topicDrift === "medium") &&
    post.structure.scanability <= 0.88 &&
    !hasStrongEarlyThesis &&
    !highlyScannable
  ) {
    out.push(
      rec({
        id: "article.too_many_threads",
        packId: ARTICLE_PACK_ID,
        ruleId: "too_many_threads",
        level: "hint",
        priority: 34,
        title: "Roter Faden kann noch klarer werden",
        message:
          "Der Text ist umfangreich und deckt mehrere Punkte ab. Eine kurze Leitlinie zwischen den Abschnitten kann die Orientierung erleichtern.",
        action:
          "Formuliere einen 1-Satz-Leitgedanken und verweise zu Beginn jedes Abschnitts kurz darauf.",
        topicBucket: "structure",
        tags: ["article", "structure", "focus"],
      }),
    );
  }

  if (
    post.kindConfidence >= 0.75 &&
    post.metrics.charCount >= 850 &&
    post.metrics.paragraphCount >= 4 &&
    Math.max(
      post.structure.thesisStrength,
      post.structure.problemStrength,
      post.structure.benefitStrength,
    ) >= 0.35 &&
    post.structure.substance < 0.08 &&
    !(
      post.structure.thesisPosition !== null &&
      post.structure.thesisPosition <= 0.3 &&
      post.structure.scanability >= 0.86
    ) &&
    !(
      post.structure.thesisStrength >= 0.75 &&
      post.structure.thesisPosition !== null &&
      post.structure.thesisPosition <= 0.25
    )
  ) {
    out.push(
      rec({
        id: "article.core_claim_needs_summary",
        packId: ARTICLE_PACK_ID,
        ruleId: "core_claim_needs_summary",
        level: "hint",
        priority: 43,
        title: "Kernaussage stärker verdichten",
        message:
          "Es ist viel Substanz enthalten, aber die zentrale Aussage tritt noch nicht klar genug hervor.",
        action: "Setze einen 1-Satz-Summary-Claim im ersten Drittel oder als klare Schlusszeile.",
        topicBucket: "clarity",
        tags: ["article", "clarity", "summary"],
      }),
    );
  }

  if (
    post.kindConfidence >= 0.75 &&
    post.metrics.charCount >= 350 &&
    post.metrics.paragraphCount >= 3 &&
    post.structure.ctaStrength < 0.15 &&
    !(
      post.structure.thesisStrength >= 0.7 &&
      post.structure.thesisPosition !== null &&
      post.structure.thesisPosition <= 0.3
    )
  ) {
    out.push(
      rec({
        id: "article.closing_takeaway_missing",
        packId: ARTICLE_PACK_ID,
        ruleId: "closing_takeaway_missing",
        level: "info",
        priority: 24,
        title: "Sanfter Abschluss mit Takeaway fehlt",
        message:
          "Der Artikel endet ohne klare Einordnung, was Leser konkret mitnehmen sollen.",
        action:
          'Ergänze einen ruhigen Schlusssatz wie "Mein Fazit:" oder "Wichtig ist vor allem ...".',
        topicBucket: "closing",
        tags: ["article", "closing", "takeaway"],
      }),
    );
  }

  return out;
}
