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
      title: "Leitthese spaet platziert",
      message: "Der Artikel startet ohne klare Leitthese, dadurch fehlt frueh Orientierung.",
      action: "Formuliere die Leitthese im ersten Absatz in einem praezisen Satz.",
      topicBucket: "structure",
      tags: ["article", "structure"],
    }),
  ];
}
