import { rec } from "./_helpers.js";

export const HEADLINE_PACK_ID = "headline";

/**
 * AP7-Skeleton für Headline-Texte.
 * @param {import('../domain/recommendation-types.js').RuleContext} ctx
 * @returns {import('../domain/recommendation-types.js').RuleResult[]}
 */
export function runHeadlineRules(ctx) {
  const { post } = ctx;
  if (post.kind !== "headline" || post.kindConfidence < 0.55) return [];
  if (post.metrics.wordCount >= 12) return [];
  return [
    rec({
      id: "headline.too_short",
      packId: HEADLINE_PACK_ID,
      ruleId: "too_short",
      level: "info",
      priority: 26,
      title: "Headline sehr knapp",
      message: "Die Headline ist praegnant, laesst den konkreten Nutzen aber offen.",
      action: "Ergaenze 2-4 Woerter mit Zielgruppe oder Ergebnis.",
      topicBucket: "clarity",
      tags: ["headline", "clarity"],
    }),
  ];
}
