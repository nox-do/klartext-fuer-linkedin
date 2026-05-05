/**
 * @param {import('../domain/types.js').PostModel} post
 * @param {string | undefined} segmentId
 * @returns {import('../domain/recommendation-types.js').RuleEvidence[] | undefined}
 */
export function evidenceFromSegment(post, segmentId) {
  if (!segmentId) return undefined;
  const seg = post.segments.find((s) => s.id === segmentId);
  if (!seg) return undefined;
  return [
    {
      segmentId: seg.id,
      text: seg.text,
      charStart: seg.charStart,
      charEnd: seg.charEnd,
    },
  ];
}

/**
 * @param {Partial<import('../domain/recommendation-types.js').RuleResult>} x
 * @returns {import('../domain/recommendation-types.js').RuleResult}
 */
export function rec(x) {
  return {
    id: x.id ?? "rule.unknown",
    packId: x.packId ?? "baseline",
    ruleId: x.ruleId ?? "unknown",
    level: x.level ?? "hint",
    priority: x.priority ?? 0,
    title: x.title ?? "Hinweis",
    message: x.message ?? "",
    action: x.action,
    evidence: x.evidence,
    topicBucket: x.topicBucket,
    conflictsWith: x.conflictsWith,
    tags: x.tags ?? [],
  };
}
