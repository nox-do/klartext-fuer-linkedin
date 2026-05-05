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
  if (post.structure.thesisPosition !== null && post.structure.thesisPosition <= 0.35) return [];
  return [
    rec({
      id: "article.thesis_late",
      packId: ARTICLE_PACK_ID,
      ruleId: "thesis_late",
      level: "hint",
      priority: 40,
      title: "These im Artikel spät",
      message: "Artikel profitieren von einer früheren Leitthese im Einstieg.",
      action: "Formuliere den Hauptpunkt in den ersten Abschnitten klarer.",
      topicBucket: "structure",
      tags: ["article", "structure"],
    }),
  ];
}
