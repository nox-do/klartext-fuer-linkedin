import { analyzePost } from "../core/analyze-post.js";
import { runArticleRules, ARTICLE_PACK_ID } from "./article.rules.js";
import { runBaselineRules, BASELINE_PACK_ID } from "./baseline.rules.js";
import { runFeedRules, FEED_PACK_ID } from "./feed.rules.js";
import { runHeadlineRules, HEADLINE_PACK_ID } from "./headline.rules.js";
import { runInviteRules, INVITE_PACK_ID } from "./invite.rules.js";
import { runRiskRules, RISK_PACK_ID } from "./risk.rules.js";

export const DEFAULT_RULE_PACKS = [BASELINE_PACK_ID, FEED_PACK_ID, RISK_PACK_ID];

/** @type {Record<string, (ctx: import('../domain/recommendation-types.js').RuleContext) => import('../domain/recommendation-types.js').RuleResult[]>} */
const PACK_RUNNERS = {
  [BASELINE_PACK_ID]: runBaselineRules,
  [FEED_PACK_ID]: runFeedRules,
  [RISK_PACK_ID]: runRiskRules,
  [INVITE_PACK_ID]: runInviteRules,
  [HEADLINE_PACK_ID]: runHeadlineRules,
  [ARTICLE_PACK_ID]: runArticleRules,
};

/**
 * @param {import('../domain/types.js').PostModel} post
 * @param {string[]} [selectedPacks]
 * @returns {import('../domain/recommendation-types.js').RuleResult[]}
 */
export function runRulePacks(post, selectedPacks = DEFAULT_RULE_PACKS) {
  const packs = selectedPacks.filter((p) => PACK_RUNNERS[p]);
  const ctx = { post, meta: { selectedPacks: packs } };
  /** @type {import('../domain/recommendation-types.js').RuleResult[]} */
  const out = [];
  for (const p of packs) {
    out.push(...PACK_RUNNERS[p](ctx));
  }
  return out.sort((a, b) => b.priority - a.priority);
}

/**
 * Komfortfunktion: Text analysieren + ausgewählte Packs ausführen.
 * @param {string | null | undefined} raw
 * @param {{ selectedPacks?: string[], analyzeOptions?: import('../domain/types.js').AnalyzePostOptions }} [options]
 */
export function runRulePacksOnRaw(raw, options = {}) {
  const post = analyzePost(raw, options.analyzeOptions);
  return runRulePacks(post, options.selectedPacks);
}

