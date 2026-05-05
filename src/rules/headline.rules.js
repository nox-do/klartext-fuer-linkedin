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
      message: "Die Headline ist prägnant, lässt den konkreten Nutzen aber offen.",
      action: "Ergänze 2-4 Wörter mit Zielgruppe oder Ergebnis.",
      topicBucket: "clarity",
      tags: ["headline", "clarity"],
    }),
  ];
}
