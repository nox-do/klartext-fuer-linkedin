import { COPY_DE_OVERRIDES } from "./copy.de.js";

/**
 * @param {import('../domain/recommendation-types.js').RuleResult[]} input
 * @returns {import('../domain/recommendation-types.js').RuleResult[]}
 */
export function mergeRecommendations(input) {
  /** @type {Map<string, import('../domain/recommendation-types.js').RuleResult>} */
  const byRule = new Map();

  for (const r of input) {
    const key = `${r.packId}:${r.ruleId}`;
    const prev = byRule.get(key);
    if (!prev) {
      byRule.set(key, { ...r });
      continue;
    }

    const keep = prev.priority >= r.priority ? prev : r;
    const other = keep === prev ? r : prev;
    const mergedEvidence = [...(keep.evidence ?? []), ...(other.evidence ?? [])];
    const uniqueEvidence = mergedEvidence.filter(
      (e, i, arr) =>
        arr.findIndex(
          (x) =>
            x.segmentId === e.segmentId &&
            x.charStart === e.charStart &&
            x.charEnd === e.charEnd,
        ) === i,
    );
    byRule.set(key, {
      ...keep,
      tags: Array.from(new Set([...(keep.tags ?? []), ...(other.tags ?? [])])),
      evidence: uniqueEvidence.length ? uniqueEvidence : undefined,
    });
  }

  return Array.from(byRule.values()).map((r) => {
    const override = COPY_DE_OVERRIDES[r.id];
    return override ? { ...r, ...override } : r;
  });
}
