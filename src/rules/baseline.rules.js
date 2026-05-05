import { LONG_SENTENCE_CHARS, LONG_SENTENCE_WORDS } from "../domain/thresholds.js";
import { evidenceFromSegment, rec } from "./_helpers.js";

export const BASELINE_PACK_ID = "baseline";

/**
 * @param {import('../domain/recommendation-types.js').RuleContext} ctx
 * @returns {import('../domain/recommendation-types.js').RuleResult[]}
 */
export function runBaselineRules(ctx) {
  const { post } = ctx;
  /** @type {import('../domain/recommendation-types.js').RuleResult[]} */
  const out = [];

  if (!post.normalized.trim()) {
    out.push(
      rec({
        id: "baseline.empty_text",
        packId: BASELINE_PACK_ID,
        ruleId: "empty_text",
        level: "warn",
        priority: 100,
        title: "Text fehlt",
        message: "Ohne Text gibt es keine sinnvolle LinkedIn-Analyse.",
        action: "Füge mindestens 2-3 Sätze ein, dann erneut analysieren.",
        topicBucket: "input",
        tags: ["baseline", "input"],
      }),
    );
    return out;
  }

  const firstSentence = post.segments.find((s) => s.type === "sentence");
  if (firstSentence?.surface.isAllCaps) {
    out.push(
      rec({
        id: "baseline.all_caps_opening",
        packId: BASELINE_PACK_ID,
        ruleId: "all_caps_opening",
        level: "hint",
        priority: 38,
        title: "Einstieg wirkt laut",
        message: "ALL-CAPS im ersten Satz kann wie Schrei-Marketing wirken.",
        action: "Prüfe normale Schreibweise für einen ruhigeren Einstieg.",
        evidence: evidenceFromSegment(post, firstSentence.id),
        topicBucket: "tone",
        tags: ["baseline", "tone"],
      }),
    );
  }

  const longSentence = post.segments.find(
    (s) =>
      s.type === "sentence" &&
      (s.surface.wordCount >= LONG_SENTENCE_WORDS || s.surface.length >= LONG_SENTENCE_CHARS),
  );
  if (longSentence) {
    out.push(
      rec({
        id: "baseline.long_sentence",
        packId: BASELINE_PACK_ID,
        ruleId: "long_sentence",
        level: "hint",
        priority: 44,
        title: "Sehr langer Satz",
        message: "Lange Sätze bremsen Scanbarkeit im Feed.",
        action: "Teile den Satz in zwei kürzere Aussagen auf.",
        evidence: evidenceFromSegment(post, longSentence.id),
        topicBucket: "readability",
        tags: ["baseline", "readability"],
      }),
    );
  }

  const urlInSentence = post.segments.find((s) => s.type === "sentence" && s.surface.hasUrl);
  if (urlInSentence) {
    out.push(
      rec({
        id: "baseline.url_in_main_text",
        packId: BASELINE_PACK_ID,
        ruleId: "url_in_main_text",
        level: "info",
        priority: 20,
        title: "Link im Haupttext",
        message: "Frühe Links können Fokus vom Argument wegziehen.",
        action: "Prüfe, ob der Link später oder im Kommentar besser passt.",
        evidence: evidenceFromSegment(post, urlInSentence.id),
        topicBucket: "focus",
        tags: ["baseline", "focus"],
      }),
    );
  }

  return out;
}
