import { evidenceFromSegment, rec } from "./_helpers.js";

export const RISK_PACK_ID = "risk";

/**
 * @param {import('../domain/recommendation-types.js').RuleContext} ctx
 * @returns {import('../domain/recommendation-types.js').RuleResult[]}
 */
export function runRiskRules(ctx) {
  const { post } = ctx;
  /** @type {import('../domain/recommendation-types.js').RuleResult[]} */
  const out = [];

  for (const r of post.risks) {
    if (r.code === "sensitive_keyword") {
      out.push(
        rec({
          id: `risk.sensitive.${r.id}`,
          packId: RISK_PACK_ID,
          ruleId: "sensitive_keyword",
          level: "risk",
          priority: 90,
          title: "Heikler Begriff erkannt",
          message:
            "Der Text enthält Begriffe mit erhöhter Missverständnis- oder Compliance-Gefahr.",
          action: "Prüfe Formulierung, Einordnung und ggf. Quelle/Disclaimer.",
          evidence: evidenceFromSegment(post, r.segmentId),
          topicBucket: "risk",
          tags: ["risk", "compliance"],
        }),
      );
    }
  }

  if (post.structure.risk >= 0.6) {
    out.push(
      rec({
        id: "risk.overall_high",
        packId: RISK_PACK_ID,
        ruleId: "overall_high",
        level: "warn",
        priority: 72,
        title: "Erhöhtes Gesamtrisiko",
        message: "Mehrere Signale deuten auf heikle Interpretation durch Leser hin.",
        action: "Kernaussagen präzisieren und riskante Zuspitzungen abschwächen.",
        topicBucket: "risk",
        tags: ["risk", "overall"],
      }),
    );
  }

  return out;
}
