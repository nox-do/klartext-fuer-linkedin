import { rec } from "./_helpers.js";

export const FEED_PACK_ID = "feed";

/**
 * @param {import('../domain/recommendation-types.js').RuleContext} ctx
 * @returns {import('../domain/recommendation-types.js').RuleResult[]}
 */
export function runFeedRules(ctx) {
  const { post } = ctx;
  /** @type {import('../domain/recommendation-types.js').RuleResult[]} */
  const out = [];
  if (post.kind !== "feed") return out;

  if (post.kindConfidence < 0.55) {
    out.push(
      rec({
        id: "feed.kind_uncertain",
        packId: FEED_PACK_ID,
        ruleId: "kind_uncertain",
        level: "info",
        priority: 18,
        title: "Texttyp unsicher",
        message:
          "Der Text ist evtl. eher Headline/Einladung als klassischer Feed-Post.",
        action:
          "Nutze den richtigen Kontext (Feed/Headline/Invite), damit Tipps präziser werden.",
        topicBucket: "kind",
        tags: ["feed", "kind"],
      }),
    );
    return out;
  }

  if (post.structure.ctaStrength < 0.2 && post.metrics.charCount > 400) {
    out.push(
      rec({
        id: "feed.cta_missing",
        packId: FEED_PACK_ID,
        ruleId: "cta_missing",
        level: "hint",
        priority: 62,
        title: "Abschluss ohne Anschluss",
        message: "Längere Feed-Posts profitieren oft von einer klaren Abschlussfrage.",
        action: "Ergänze eine konkrete Frage, die Erfahrungen oder Positionen abholt.",
        topicBucket: "cta",
        tags: ["feed", "cta", "engagement"],
      }),
    );
  }

  if (
    post.structure.thesisPosition !== null &&
    post.structure.thesisPosition > 0.55 &&
    post.structure.thesisStrength >= 0.35
  ) {
    out.push(
      rec({
        id: "feed.thesis_too_late",
        packId: FEED_PACK_ID,
        ruleId: "thesis_too_late",
        level: "hint",
        priority: 58,
        title: "These kommt spät",
        message: "Der Kernpunkt erscheint spät im Text und verliert Feed-Wirkung.",
        action: "Ziehe die stärkste These in Satz 1 oder 2.",
        topicBucket: "structure",
        conflictsWith: ["baseline.empty_text"],
        tags: ["feed", "structure", "thesis"],
      }),
    );
  }

  return out;
}
