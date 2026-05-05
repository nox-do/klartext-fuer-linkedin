import { evidenceFromSegment, rec } from "./_helpers.js";

export const RISK_PACK_ID = "risk";

/**
 * Konservativer Guardrail gegen Ueberwarnung:
 * Wenn ein sensibler Begriff explizit als Negativbeispiel/Kritik eingeordnet wird,
 * erzeugen wir keine harte sensitive-Rule.
 * @param {string} text
 */
function isDistancedContext(text) {
  const t = text ?? "";
  const hasMarker = /\b(negativbeispiel|kritik|kritisch|einordn|distanzier|warnung)\b/i.test(t);
  const hasQuotedKeyword = /["'„][^"'”]{0,40}(Schwarzarbeit|Steuerhinterziehung|illegal|Betrug)[^"'”]{0,40}["'”]/i.test(
    t,
  );
  return hasMarker || hasQuotedKeyword;
}

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
      const segText = post.segments.find((s) => s.id === r.segmentId)?.text ?? "";
      if (isDistancedContext(segText)) continue;
      out.push(
        rec({
          id: `risk.sensitive.${r.id}`,
          packId: RISK_PACK_ID,
          ruleId: "sensitive_keyword",
          level: "risk",
          priority: 90,
          title: "Missverstaendlicher Begriff moeglich",
          message:
            "Ein Begriff kann je nach Leserschaft rechtlich oder reputativ heikel verstanden werden.",
          action:
            "Praezisiere den Kontext in einem Zusatzsatz und vermeide missverstaendliche Verkuerzung.",
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
        title: "Aussage mit erhoehtem Interpretationsrisiko",
        message: "Mehrere Formulierungen koennen zugespitzt oder falsch ausgelegt werden.",
        action:
          "Pruefe zuerst den staerksten Claim: Was ist belegt, was ist Meinung? Formuliere trennscharf.",
        topicBucket: "risk",
        tags: ["risk", "overall"],
      }),
    );
  }

  return out;
}
