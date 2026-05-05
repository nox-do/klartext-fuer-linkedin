/**
 * Nahtstelle für Fold-Snippets:
 * - AP6 primär segment-/signalbasiert aus PostModel (`resolveFeedSnippetFromPostModel`)
 * - Fallback optional via Raw-Ranker (`resolveFeedFoldTeaser`)
 */
import { resolveFeedFoldTeaser } from "../preview/feed-snippet-ranker.js";
import { resolveFeedSnippetFromPostModel } from "../preview/feed-snippet.js";

export { resolveFeedFoldTeaser, resolveFeedSnippetFromPostModel };
