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
      title: "Sehr kurze Headline",
      message: "Sehr kurze Titel verlieren oft Kontext.",
      action: "Prüfe, ob ein präziser Nutzenhinweis ergänzt werden sollte.",
      topicBucket: "clarity",
      tags: ["headline", "clarity"],
    }),
  ];
}
