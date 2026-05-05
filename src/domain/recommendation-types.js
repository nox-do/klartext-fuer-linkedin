/**
 * AP7: Recommendation-nahe Typen für Rule Engine.
 */

/**
 * @typedef {Object} RuleEvidence
 * @property {string} [segmentId]
 * @property {string} text
 * @property {number} charStart
 * @property {number} charEnd
 */

/**
 * @typedef {'info'|'hint'|'warn'|'risk'} RuleLevel
 */

/**
 * @typedef {Object} RuleResult
 * @property {string} id
 * @property {string} packId
 * @property {string} ruleId
 * @property {RuleLevel} level
 * @property {number} priority
 * @property {string} title
 * @property {string} message
 * @property {string} [action]
 * @property {RuleEvidence[]} [evidence]
 * @property {string} [topicBucket] — z. B. `cta`, `structure`, `risk`, `readability`
 * @property {string[]} [conflictsWith] — Regel-IDs, die nicht gleichzeitig priorisiert werden sollen
 * @property {string[]} tags
 */

/**
 * @typedef {Object} RuleContext
 * @property {import('./types.js').PostModel} post
 * @property {{ selectedPacks: string[] }} meta
 */

/**
 * @typedef {(ctx: RuleContext) => RuleResult[]} Rule
 */

export {};
