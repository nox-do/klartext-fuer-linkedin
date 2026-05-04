/**
 * @typedef {'de'|'en'|'ru'|'unknown'} DetectedLanguage
 */

/**
 * @typedef {'sentence'|'line'|'sentence_pair'|'list_item'} SegmentType
 */

/**
 * @typedef {Object} SurfaceFeatures
 * @property {number} length
 * @property {number} wordCount
 * @property {number} commaCount
 * @property {boolean} hasQuestion
 * @property {boolean} hasNumber
 * @property {boolean} hasUrl
 * @property {boolean} hasHashtag
 * @property {boolean} hasEmojiRun
 * @property {boolean} startsWeak
 * @property {boolean} isAllCaps
 */

/**
 * @typedef {Object} SignalScores
 * @property {number} contrast
 * @property {number} pain
 * @property {number} benefit
 * @property {number} personal
 * @property {number} specificity
 * @property {number} risk
 * @property {number} cta
 * @property {number} proof
 * @property {number} example
 * @property {number} buzzword
 */

/**
 * @typedef {Object} RoleScores
 * @property {number} hook
 * @property {number} context
 * @property {number} thesis
 * @property {number} problem
 * @property {number} benefit
 * @property {number} example
 * @property {number} proof
 * @property {number} transition
 * @property {number} cta
 * @property {number} risk
 * @property {number} filler
 */

/**
 * @typedef {Object} Segment
 * @property {string} id
 * @property {SegmentType} type
 * @property {string} text
 * @property {number} paragraphIndex
 * @property {number} [sentenceIndex]
 * @property {number} charStart
 * @property {number} charEnd
 * @property {SurfaceFeatures} surface
 * @property {SignalScores} signals
 * @property {RoleScores} roles
 */

/**
 * @typedef {Object} Paragraph
 * @property {string} id
 * @property {number} index
 * @property {string} text
 * @property {number} charStart
 * @property {number} charEnd
 * @property {Segment[]} sentences
 */

/**
 * @typedef {Object} DocumentMetrics
 * @property {number} charCount
 * @property {number} wordCount
 * @property {number} paragraphCount
 * @property {number} sentenceCount
 */

/**
 * @typedef {Object} NormalizedDocument
 * @property {string} raw
 * @property {string} normalized
 * @property {DetectedLanguage} language
 * @property {Paragraph[]} paragraphs
 * @property {DocumentMetrics} metrics
 */

/**
 * @typedef {Object} SegmentSemantics
 * @property {SurfaceFeatures} surface
 * @property {SignalScores} signals
 * @property {RoleScores} roles
 */

export {};
