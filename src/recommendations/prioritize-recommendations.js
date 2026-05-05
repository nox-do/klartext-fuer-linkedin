const LEVEL_BOOST = {
  info: 0,
  hint: 2,
  warn: 6,
  risk: 12,
};

/**
 * @param {import('../domain/recommendation-types.js').RuleResult} r
 */
function weightedScore(r) {
  return r.priority + (LEVEL_BOOST[r.level] ?? 0);
}

/**
 * @param {import('../domain/recommendation-types.js').RuleResult[]} recommendations
 * @param {number} maxItems
 */
function buildPrioritizationTrace(recommendations, maxItems) {
  const sorted = [...recommendations].sort((a, b) => {
    const pa = weightedScore(a);
    const pb = weightedScore(b);
    if (pb !== pa) return pb - pa;
    return a.id.localeCompare(b.id);
  });

  /** @type {import('../domain/recommendation-types.js').RuleResult[]} */
  const picked = [];
  const usedBuckets = new Set();
  const pickedIds = new Set();
  /** @type {{id:string, picked:boolean, pass:string, reason:string, bucket:string|null, conflictsWith:string[], score:number}[]} */
  const decisions = [];

  /**
   * @param {import('../domain/recommendation-types.js').RuleResult} r
   */
  const evaluateSkipReason = (r) => {
    if (r.topicBucket && usedBuckets.has(r.topicBucket)) return "bucket_used";
    if (r.conflictsWith?.some((id) => pickedIds.has(id))) return "conflict_with_top";
    if (picked.some((x) => x.conflictsWith?.includes(r.id))) return "conflict_with_top_reverse";
    return null;
  };

  const consider = (pass) => {
    for (const r of sorted) {
      if (picked.length >= maxItems) {
        decisions.push({
          id: r.id,
          picked: false,
          pass,
          reason: "top_limit_reached",
          bucket: r.topicBucket ?? null,
          conflictsWith: r.conflictsWith ?? [],
          score: weightedScore(r),
        });
        continue;
      }
      if (pickedIds.has(r.id)) continue;
      const reason = evaluateSkipReason(r);
      if (reason) {
        decisions.push({
          id: r.id,
          picked: false,
          pass,
          reason,
          bucket: r.topicBucket ?? null,
          conflictsWith: r.conflictsWith ?? [],
          score: weightedScore(r),
        });
        continue;
      }
      picked.push(r);
      pickedIds.add(r.id);
      if (r.topicBucket) usedBuckets.add(r.topicBucket);
      decisions.push({
        id: r.id,
        picked: true,
        pass,
        reason: "selected",
        bucket: r.topicBucket ?? null,
        conflictsWith: r.conflictsWith ?? [],
        score: weightedScore(r),
      });
    }
  };

  consider("primary");
  if (picked.length < maxItems) consider("fill");

  return {
    top: picked,
    trace: {
      maxItems,
      sorted: sorted.map((r) => ({
        id: r.id,
        score: weightedScore(r),
        level: r.level,
        priority: r.priority,
        bucket: r.topicBucket ?? null,
        conflictsWith: r.conflictsWith ?? [],
      })),
      decisions,
    },
  };
}

/**
 * @param {import('../domain/recommendation-types.js').RuleResult[]} recommendations
 * @param {{ maxItems?: number }} [options]
 */
export function prioritizeRecommendations(recommendations, options = {}) {
  const maxItems = options.maxItems ?? 3;
  return buildPrioritizationTrace(recommendations, maxItems).top;
}

/**
 * Debug-Hilfe: gleiche Priorisierungslogik wie `prioritizeRecommendations`,
 * zusätzlich mit Entscheidungsprotokoll für UI/Analysen.
 * @param {import('../domain/recommendation-types.js').RuleResult[]} recommendations
 * @param {{ maxItems?: number }} [options]
 */
export function explainPrioritization(recommendations, options = {}) {
  const maxItems = options.maxItems ?? 3;
  return buildPrioritizationTrace(recommendations, maxItems);
}
