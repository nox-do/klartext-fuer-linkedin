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
 * @property {boolean} hasQuestion — `?` außerhalb von http(s)-URL-Spannen (nicht Querystring allein)
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
 * @typedef {'headline'|'invite'|'feed'|'article'|'unknown'} PostKind
 */

/**
 * @typedef {'first_line'|'ranked_segment'|'fallback'} SnippetSource
 */

/**
 * @typedef {Object} FoldModel
 * @property {number} approximateVisibleChars
 * @property {string} firstLine
 * @property {number} firstLineLength
 * @property {number} firstParagraphLength
 * @property {string[]} bestSnippetSegmentIds
 * @property {string} bestSnippetText
 * @property {SnippetSource} snippetSource
 */

/**
 * @typedef {Object} StructureModel
 * @property {number} hookStrength
 * @property {number} thesisStrength
 * @property {number|null} thesisPosition — 0–1 relativ zu `normalized.length`, sonst `null`
 * @property {string|null} strongestThesisSegmentId
 * @property {number} problemStrength
 * @property {number} benefitStrength
 * @property {number} ctaStrength
 * @property {number} scanability
 * @property {number} substance
 * @property {number} risk
 * @property {'low'|'medium'|'high'|'unknown'} topicDrift — **Heuristik:** Stärke steigt mit **Satzanzahl** (Komplexität/Länge), nicht mit semantischer Themen-Zerstreuung (§5.11).
 */

/**
 * @typedef {Object} RiskFinding
 * @property {string} id
 * @property {string} code
 * @property {'info'|'hint'|'warn'|'risk'} level
 * @property {string} message
 * @property {string} [segmentId]
 */

/**
 * @typedef {Object} PostModel
 * @property {string} id
 * @property {PostKind} kind
 * @property {number} kindConfidence — 0–1; niedrig bei heuristisch mehrdeutigen Kurztexten (§5.9). Nutzer-`kind` → 1.
 * @property {string} language — ISO-artig aus Normalisierung (`de`|`en`|`ru`|`unknown`)
 * @property {string} raw
 * @property {string} normalized
 * @property {DocumentMetrics} metrics
 * @property {Paragraph[]} paragraphs
 * @property {Segment[]} segments — flache Liste (Reihenfolge wie im Dokument)
 * @property {FoldModel} fold
 * @property {StructureModel} structure
 * @property {RiskFinding[]} risks
 * @property {string} version — Schema-/Builder-Version
 * @property {Object} [debug] — nur wenn `includeDebug` in {@link AnalyzePostOptions}
 * @property {string} [debug.topicDriftNote]
 */

/**
 * @typedef {Object} AnalyzePostOptions
 * @property {'de'|'en'|'ru'|'auto'} [localeHint]
 * @property {boolean} [includeSentencePairs]
 * @property {PostKind} [kind] — Nutzer-Kontext (Variante A, §5.9); sonst Heuristik
 * @property {string} [id]
 * @property {boolean} [includeDebug]
 */

/**
 * @typedef {Object} SegmentSemantics
 * @property {SurfaceFeatures} surface
 * @property {SignalScores} signals
 * @property {RoleScores} roles
 */

export {};
