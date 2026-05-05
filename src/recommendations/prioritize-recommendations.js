const LEVEL_BOOST = {
  info: 0,
  hint: 2,
  warn: 6,
  risk: 12,
};

/**
 * @param {import('../domain/recommendation-types.js').RuleResult[]} recommendations
 * @param {{ maxItems?: number }} [options]
 */
export function prioritizeRecommendations(recommendations, options = {}) {
  const maxItems = options.maxItems ?? 3;
  const sorted = [...recommendations].sort((a, b) => {
    const pa = a.priority + (LEVEL_BOOST[a.level] ?? 0);
    const pb = b.priority + (LEVEL_BOOST[b.level] ?? 0);
    if (pb !== pa) return pb - pa;
    return a.id.localeCompare(b.id);
  });

  /** @type {import('../domain/recommendation-types.js').RuleResult[]} */
  const picked = [];
  const usedBuckets = new Set();
  const pickedIds = new Set();

  for (const r of sorted) {
    if (picked.length >= maxItems) break;
    if (r.topicBucket && usedBuckets.has(r.topicBucket)) continue;
    if (r.conflictsWith?.some((id) => pickedIds.has(id))) continue;
    if (picked.some((x) => x.conflictsWith?.includes(r.id))) continue;
    picked.push(r);
    pickedIds.add(r.id);
    if (r.topicBucket) usedBuckets.add(r.topicBucket);
  }

  // Kontrollierte Auffüllrunde: gleiche Schutzlogik erneut anwenden.
  // Lieber <maxItems als widersprüchliche oder doppelte Top-Hebel.
  if (picked.length < maxItems) {
    for (const r of sorted) {
      if (picked.length >= maxItems) break;
      if (pickedIds.has(r.id)) continue;
      if (r.topicBucket && usedBuckets.has(r.topicBucket)) continue;
      if (r.conflictsWith?.some((id) => pickedIds.has(id))) continue;
      if (picked.some((x) => x.conflictsWith?.includes(r.id))) continue;
      picked.push(r);
      pickedIds.add(r.id);
      if (r.topicBucket) usedBuckets.add(r.topicBucket);
    }
  }

  return picked;
}
