import { FEED_FOLD_CHARS } from "../domain/fold-constants.js";

/**
 * @param {string} text
 * @param {number} maxLen
 */
function foldTeaser(text, maxLen) {
  if (!text) return "";
  if (text.length <= maxLen) return text;
  let cut = text.slice(0, maxLen - 1);
  const sp = cut.lastIndexOf(" ");
  if (sp > maxLen * 0.55) cut = cut.slice(0, sp);
  return `${cut.trimEnd()}…`;
}

/**
 * @param {import('../domain/types.js').Segment} s
 * @param {number} sentenceIndex
 */
function scoreSentenceCandidate(s, sentenceIndex) {
  const { roles, signals, surface } = s;
  let score =
    roles.hook * 18 +
    roles.thesis * 14 +
    roles.benefit * 10 +
    roles.problem * 6 +
    roles.cta * 4 +
    roles.proof * 4 +
    signals.specificity * 2 -
    roles.risk * 8 -
    roles.filler * 6;

  if (sentenceIndex === 0 && roles.hook < 0.35 && roles.thesis < 0.35) score -= 2.4;
  if (sentenceIndex === 1) score += 1.2;
  if (surface.wordCount > 42) score -= 1.5;
  if (surface.wordCount < 6) score -= 1.6;
  if (surface.startsWeak) score -= 1.2;
  return score;
}

/**
 * @param {import('../domain/types.js').Segment} pair
 */
function scorePairCandidate(pair) {
  const { roles, signals, surface } = pair;
  let score =
    roles.hook * 16 +
    roles.thesis * 12 +
    roles.benefit * 9 +
    roles.problem * 5 +
    signals.contrast * 3.5 +
    roles.proof * 3 -
    roles.risk * 8 -
    roles.filler * 6;
  if (surface.wordCount > 55) score -= 2.5;
  if (surface.wordCount < 8) score -= 1.2;
  return score;
}

/**
 * Fairness: einzelner „starker Hook“ ohne Substanz soll nicht blind gewinnen.
 * @param {{ text: string, score: number }} c
 */
function applyFairnessGuard(c) {
  const t = c.text.trim();
  if (!t) return c.score;
  const words = t.split(/\s+/).filter(Boolean).length;
  const hasQuestion = /\?\s*$/.test(t);
  const hasContrast = /\bnicht\b[\s\S]{0,120}\bsondern\b/i.test(t);
  const hasBenefit = /\b(Überblick|weniger Aufwand|einfacher|Nutzen|hilft|spart)\b/i.test(t);
  const hasProof = /\b(Studie|Daten|Quelle|Statistik|Beweis|nachgewiesen|Forschung)\b/i.test(t);
  const hasPersonal = /\b(ich|wir|bei mir|habe ich|wir haben)\b/i.test(t);
  let s = c.score;
  if (hasQuestion && words <= 14 && !hasBenefit && !hasProof && !hasPersonal && !hasContrast) {
    s -= 2.2;
  }
  if (words < 5) s -= 1.2;
  return s;
}

/**
 * @param {{ text: string, score: number, segmentIds: string[] }[]} candidates
 */
function dedupeCandidates(candidates) {
  /** @type {Map<string, { text: string, score: number, segmentIds: string[] }>} */
  const map = new Map();
  for (const c of candidates) {
    const textKey = c.text.replace(/\s+/g, " ").trim().toLowerCase();
    const idKey = [...c.segmentIds].sort().join("|");
    const key = `${textKey}::${idKey}`;
    const prev = map.get(key);
    if (!prev || c.score > prev.score) map.set(key, c);
  }
  return [...map.values()];
}

/**
 * @param {import('../domain/types.js').Segment[]} sentenceSegs
 * @param {import('../domain/types.js').Segment} pair
 */
function sentenceIdsOverlappingPair(sentenceSegs, pair) {
  return sentenceSegs
    .filter(
      (s) =>
        s.paragraphIndex === pair.paragraphIndex &&
        s.charStart >= pair.charStart &&
        s.charEnd <= pair.charEnd,
    )
    .map((s) => s.id);
}

/**
 * AP6: Segment-/Signal-basierte Snippet-Auswahl aus dem PostModel statt Raw-only-Ranker.
 *
 * @param {{ paragraphs: import('../domain/types.js').Paragraph[], segments: import('../domain/types.js').Segment[] }} postLike
 * @param {number} [foldChars]
 * @returns {{ teaser: string, source: 'ranked_segment'|'fallback'|'first_line', score?: number, segmentIds: string[] }}
 */
export function resolveFeedSnippetFromPostModel(postLike, foldChars = FEED_FOLD_CHARS) {
  const firstParagraph = postLike.paragraphs[0]?.text ?? "";
  const firstLine = firstParagraph.split("\n")[0]?.trim() ?? "";
  const sentenceSegs = postLike.segments.filter(
    (s) => s.type === "sentence" && s.paragraphIndex === 0,
  );

  /** @type {{ text: string, score: number, segmentIds: string[] }[]} */
  const candidates = [];
  for (let i = 0; i < sentenceSegs.length; i++) {
    const s = sentenceSegs[i];
    candidates.push({
      text: s.text,
      score: scoreSentenceCandidate(s, i),
      segmentIds: [s.id],
    });
  }

  for (const p of postLike.segments.filter(
    (s) => s.type === "sentence_pair" && s.paragraphIndex === 0,
  )) {
    candidates.push({
      text: p.text,
      score: scorePairCandidate(p),
      segmentIds: sentenceIdsOverlappingPair(sentenceSegs, p),
    });
  }

  // Falls keine gespeicherten sentence_pair-Segmente existieren: aus Nachbarsätzen bilden.
  for (let i = 0; i < sentenceSegs.length - 1; i++) {
    const a = sentenceSegs[i];
    const b = sentenceSegs[i + 1];
    const pairText = `${a.text} ${b.text}`.trim();
    if (!pairText) continue;
    const pseudoPair = {
      roles: {
        hook: Math.max(a.roles.hook, b.roles.hook),
        context: Math.max(a.roles.context, b.roles.context),
        thesis: Math.max(a.roles.thesis, b.roles.thesis),
        problem: Math.max(a.roles.problem, b.roles.problem),
        benefit: Math.max(a.roles.benefit, b.roles.benefit),
        example: Math.max(a.roles.example, b.roles.example),
        proof: Math.max(a.roles.proof, b.roles.proof),
        transition: Math.max(a.roles.transition, b.roles.transition),
        cta: Math.max(a.roles.cta, b.roles.cta),
        risk: Math.max(a.roles.risk, b.roles.risk),
        filler: Math.max(a.roles.filler, b.roles.filler),
      },
      signals: {
        contrast: Math.max(a.signals.contrast, b.signals.contrast),
      },
      surface: {
        wordCount: a.surface.wordCount + b.surface.wordCount,
      },
    };
    candidates.push({
      text: pairText,
      score: scorePairCandidate(/** @type {any} */ (pseudoPair)) - 0.6,
      segmentIds: [a.id, b.id],
    });
  }

  const guarded = dedupeCandidates(
    candidates.map((c) => ({ ...c, score: applyFairnessGuard(c) })),
  );
  guarded.sort((a, b) => b.score - a.score);
  const best = guarded[0];
  if (best && best.text.trim()) {
    return {
      teaser: foldTeaser(best.text, foldChars),
      source: "ranked_segment",
      score: best.score,
      segmentIds: best.segmentIds,
    };
  }

  if (firstLine) {
    return {
      teaser: foldTeaser(firstLine, foldChars),
      source: "first_line",
      segmentIds: [],
    };
  }

  return { teaser: "", source: "fallback", segmentIds: [] };
}
