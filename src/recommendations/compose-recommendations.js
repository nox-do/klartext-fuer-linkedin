import { analyzePost } from "../core/analyze-post.js";
import { mergeRecommendations } from "./merge-recommendations.js";
import { explainPrioritization } from "./prioritize-recommendations.js?v=20260505-2";
import { runRulePacks, DEFAULT_RULE_PACKS } from "../rules/run-rule-packs.js";

/**
 * @param {import('../domain/types.js').PostModel} post
 * @param {import('../domain/recommendation-types.js').RuleResult[]} ruleResults
 */
export function composeRecommendations(post, ruleResults) {
  const merged = mergeRecommendations(ruleResults);
  const noInput = !post.normalized.trim();
  const trace = noInput ? null : explainPrioritization(merged, { maxItems: 3 });
  const top = noInput ? [] : trace.top;
  const emptyState = noInput || top.length === 0;
  return {
    top,
    details: merged,
    selectionTrace: trace?.trace ?? null,
    emptyState,
    meta: {
      totalRules: ruleResults.length,
      totalMerged: merged.length,
      selectedTop: top.length,
      kind: post.kind,
      kindConfidence: post.kindConfidence,
    },
  };
}

/**
 * Komfortfunktion AP8: text -> PostModel -> RuleResults -> Composer.
 * @param {string | null | undefined} raw
 * @param {{ selectedPacks?: string[], analyzeOptions?: import('../domain/types.js').AnalyzePostOptions }} [options]
 */
export function composeRecommendationsFromRaw(raw, options = {}) {
  const post = analyzePost(raw, options.analyzeOptions);
  const ruleResults = runRulePacks(post, options.selectedPacks ?? DEFAULT_RULE_PACKS);
  return {
    post,
    ...composeRecommendations(post, ruleResults),
  };
}
