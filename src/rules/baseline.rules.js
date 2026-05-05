import {
  BUZZWORD_DENSE_MIN_SEGMENTS,
  BUZZWORD_DENSE_MIN_WORDS,
  BUZZWORD_DENSE_SEGMENT_RATIO,
  LONG_PARAGRAPH_CHARS,
  LONG_PARAGRAPH_SENTENCES,
  LONG_SENTENCE_CHARS,
  LONG_SENTENCE_WORDS,
  WALL_OF_TEXT_MIN_POST_CHARS,
} from "../domain/thresholds.js";
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
        title: "Einstieg sehr betont",
        message: "Der erste Satz wirkt durch GROSSSCHREIBUNG schnell konfrontativ.",
        action: "Prüfe normale Schreibweise, wenn du sachlich statt alarmierend wirken willst.",
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
        message: "Ein sehr langer Satz erschwert das schnelle Erfassen im Feed.",
        action: "Teile den Satz in zwei kurze Aussagen (Problem + Wirkung).",
        evidence: evidenceFromSegment(post, longSentence.id),
        topicBucket: "readability",
        tags: ["baseline", "readability"],
      }),
    );
  }

  const denseParagraph = post.paragraphs.find(
    (p) =>
      post.metrics.charCount >= WALL_OF_TEXT_MIN_POST_CHARS &&
      (p.text.length > LONG_PARAGRAPH_CHARS ||
        p.sentences.filter((s) => s.type === "sentence").length > LONG_PARAGRAPH_SENTENCES),
  );
  if (denseParagraph) {
    out.push(
      rec({
        id: "baseline.wall_of_text",
        packId: BASELINE_PACK_ID,
        ruleId: "wall_of_text",
        level: "hint",
        priority: 42,
        title: "Absatz wirkt sehr dicht",
        message: "Ein langer Absatz kann im LinkedIn-Feed wie eine Textwand wirken.",
        action: "Teile den Absatz in 2-3 kürzere Blöcke. Eine Aussage pro Absatz reicht oft.",
        evidence: [
          {
            text: denseParagraph.text,
            charStart: denseParagraph.charStart,
            charEnd: denseParagraph.charEnd,
          },
        ],
        topicBucket: "readability",
        tags: ["baseline", "readability", "formatting"],
      }),
    );
  }

  const buzzwordSegments = post.segments.filter(
    (s) => s.type === "sentence" && s.signals.buzzword >= 0.5,
  );
  const sentenceCount = post.segments.filter((s) => s.type === "sentence").length;
  const hasCriticalBuzzwordFraming =
    /\b(buzzword|hype|etikett|marketing|nur|bloß|scheinbar|heißt nicht)\b/i.test(
      post.normalized,
    );
  const buzzwordDense =
    post.metrics.wordCount >= BUZZWORD_DENSE_MIN_WORDS &&
    buzzwordSegments.length >= BUZZWORD_DENSE_MIN_SEGMENTS &&
    buzzwordSegments.length / Math.max(1, sentenceCount) >= BUZZWORD_DENSE_SEGMENT_RATIO &&
    !hasCriticalBuzzwordFraming;

  if (buzzwordDense) {
    out.push(
      rec({
        id: "baseline.buzzword_dense",
        packId: BASELINE_PACK_ID,
        ruleId: "buzzword_dense",
        level: "hint",
        priority: 34,
        title: "Viele abstrakte Schlagworte",
        message:
          "Der Text nutzt mehrere Buzzwords. Das kann kompetent wirken, aber auch austauschbar.",
        action:
          "Ersetze 1-2 Schlagworte durch konkrete Beispiele, Zahlen oder beobachtbare Wirkung.",
        evidence: buzzwordSegments.slice(0, 3).map((s) => ({
          segmentId: s.id,
          text: s.text,
          charStart: s.charStart,
          charEnd: s.charEnd,
        })),
        topicBucket: "clarity",
        tags: ["baseline", "clarity", "buzzword"],
      }),
    );
  }

  const sentenceSegs = post.segments.filter((s) => s.type === "sentence");
  const urlInSentence = sentenceSegs.find(
    (s, i) =>
      s.surface.hasUrl &&
      // Frühe Links lenken meist stärker ab; spätere Verweise sind oft inhaltlich nötig.
      i <= 1,
  );
  if (urlInSentence) {
    out.push(
      rec({
        id: "baseline.url_in_main_text",
        packId: BASELINE_PACK_ID,
        ruleId: "url_in_main_text",
        level: "info",
        priority: 20,
        title: "Link lenkt früh ab",
        message: "Ein Link im Fließtext kann den Lesefluss vor dem Kernpunkt unterbrechen.",
        action: "Setze den Link ans Ende oder in den ersten Kommentar.",
        evidence: evidenceFromSegment(post, urlInSentence.id),
        topicBucket: "focus",
        tags: ["baseline", "focus"],
      }),
    );
  }

  return out;
}
