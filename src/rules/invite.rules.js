import { rec } from "./helpers.js";

export const INVITE_PACK_ID = "invite";

/**
 * AP7-Skeleton: wenige sichere Checks, Detailausbau folgt.
 * @param {import('../domain/recommendation-types.js').RuleContext} ctx
 * @returns {import('../domain/recommendation-types.js').RuleResult[]}
 */
export function runInviteRules(ctx) {
  const { post } = ctx;
  if (post.kind !== "invite" || post.kindConfidence < 0.55) return [];
  if (post.metrics.wordCount <= 60) return [];
  return [
    rec({
      id: "invite.too_long",
      packId: INVITE_PACK_ID,
      ruleId: "too_long",
      level: "hint",
      priority: 42,
      title: "Einladung sehr ausführlich",
      message: "Beim Erstkontakt funktionieren oft kürzere, klar fokussierte Anfragen besser.",
      action: "Kürze auf Anlass + kurzer Bezug + freundlicher Abschluss.",
      topicBucket: "brevity",
      tags: ["invite", "brevity"],
    }),
  ];
}
