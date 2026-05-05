/**
 * Feed-Snippet-Ranker (80/20): Kandidaten erzeugen → ausschließen → nach Hook-Signalen ranken → falten.
 * Keine NLP-Libs; optional Intl.Segmenter (Baseline), sonst grober Satz-Split.
 *
 * Kanonische Implementierung unter `src/preview/` (vor AP6: noch Rohtext-first; später Anreicherung aus PostModel).
 */

import { FEED_FOLD_CHARS } from "../domain/fold-constants.js";
import { FEED_SNIPPET_PROFILE } from "../domain/feed-snippet-constants.js";

/** @typedef {{ id: string, text: string, score: number, flags: string[] }} RankedSnippet */

const SIGNALS = {
  contrast: [/\bnicht\b[\s\S]{0,80}\bsondern\b/i, /\beigentlich\b[\s\S]{0,60}\baber\b/i, /\bdoch\b/i, /\btrotzdem\b/i],
  pain: [/\bProblem(e|)?\b/i, /\bscheitert(e|)?\b/i, /\bAufwand\b/i, /\btut weh\b/i, /\bRisiko\b/i, /\bvergisst\b/i, /\bHerausforderung\b/i],
  benefit: [/\bÜberblick\b/i, /\bweniger Aufwand\b/i, /\beinfacher\b/i, /\bHebel\b/i, /\bspart\b/i, /\bNutzen\b/i, /\bklar(er|e)?\b/i],
  personal: [/\bich\b/i, /\bmein(e|er|em|en)?\b/i, /\bmir\b/i, /\bbei mir\b/i, /\buns\b/i],
  specificity: [/\d/, /€/, /%/],
  riskKeyword: [/\bSchwarzarbeit\b/i, /\bSteuerhinterziehung\b/i, /\billegal(e|er|es)?\b/i, /\bBetrug\b/i],
};

const WEAK_OPENERS = /^(Dabei|Außerdem|Daher|Deshalb|Somit|Diese|Dieses|Dieser|Zudem|Ferner|Zunächst|Und zwar)\b/i;

function firstParagraphNorm(raw) {
  const t = raw.replace(/\r\n/g, "\n").trim();
  if (!t) return "";
  const m = t.match(/^([\s\S]*?)(?:\n\s*\n|$)/);
  return (m ? m[1] : t).trim();
}

/** @param {string} text @param {string} [locale='de'] */
export function splitSentencesLocale(text, locale = "de") {
  const t = text.replace(/\r\n/g, "\n").trim();
  if (!t) return [];
  try {
    if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
      const seg = new Intl.Segmenter(locale, { granularity: "sentence" });
      return [...seg.segment(t)]
        .map((s) => s.segment.trim())
        .filter((s) => s.length > 2);
    }
  } catch {
    /* ignore */
  }
  return t
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

function normKey(s) {
  return s.replace(/\s+/g, " ").trim().toLowerCase().slice(0, 160);
}

/**
 * Für DE-Feedtexte liefert Segmenter oft **einen** langen Block. Dann: grobe Satz-/Klausel-Splits mergen.
 * Für Paare/Kandidaten-Reihenfolge: bevorzugt Segmenter, sonst Interpunktion.
 */
export function splitSentencesHybrid(para, locale = "de") {
  const seen = new Set();
  const out = [];
  const add = (s) => {
    const t = s.replace(/\s+/g, " ").trim();
    if (t.length < 16) return;
    const k = normKey(t);
    if (seen.has(k)) return;
    seen.add(k);
    out.push(t);
  };

  const loc = splitSentencesLocale(para, locale);
  for (const s of loc) add(s);

  for (const part of para.split(/[.!?…]+/)) add(part);
  for (const part of para.split(/\n+/)) add(part);
  for (const part of para.split(/\s*[;]\s+/)) add(part);

  /** Ein Riesen-Segment: zusätzlich an Gedankenstrich / Doppelpunkt teilen */
  if (loc.length === 1 && loc[0].length > 160) {
    for (const part of loc[0].split(/\s+[—–]\s+/)) add(part);
    for (const part of loc[0].split(/\s*:\s+/)) add(part);
  }

  return out;
}

/** Geordnete Satzliste für Paare & Eröffnungs-Erkennung (nicht nur ein ICU-Block). */
function splitOrderedForPairs(para, locale = "de") {
  const loc = splitSentencesLocale(para, locale);
  if (loc.length >= 2) return loc;

  /** Ein „Satz“ für ICU, aber mehrere Zeilen / Sinneinheiten — vor Interpunktion splitten */
  if (loc.length === 1 && loc[0].length > 90) {
    const byNl = loc[0]
      .split(/\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 22);
    if (byNl.length >= 2) return byNl;
  }

  const rough = para
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/[.!?…]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);
  if (rough.length >= 2) return rough;

  if (loc.length === 1 && loc[0].length > 120) {
    const byDash = loc[0].split(/\s+[—–]\s+/).map((s) => s.trim()).filter((s) => s.length > 20);
    if (byDash.length >= 2) return byDash;
  }
  return loc.length ? loc : rough;
}

function wordCount(s) {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function foldTeaser(text, maxLen) {
  if (!text) return "";
  if (text.length <= maxLen) return text;
  let cut = text.slice(0, maxLen - 1);
  const sp = cut.lastIndexOf(" ");
  if (sp > maxLen * 0.55) cut = cut.slice(0, sp);
  return `${cut.trimEnd()}…`;
}

function excludeCandidate(text) {
  const t = text.trim();
  if (t.length < 22) return true;
  if (/^https?:\/\/\S+$/i.test(t)) return true;
  if (/^(#\w+\s*)+$/u.test(t)) return true;
  return false;
}

/**
 * @param {string} text
 * @param {typeof FEED_SNIPPET_PROFILE} [profile]
 */
export function scoreSnippetCandidate(text, profile = FEED_SNIPPET_PROFILE) {
  const w = profile.weights;
  let score = 0;
  const flags = [];
  const t = text.trim();
  const len = t.length;
  const wc = wordCount(t);

  if (len >= profile.lenIdealMin && len <= profile.lenIdealMax) score += w.lenIdeal;
  else if (len >= profile.lenOkMin && len <= profile.lenOkMax) score += w.lenOk;
  else score += w.lenBad;

  if (/\?\s*$/.test(t)) {
    score += w.question;
    flags.push("question");
  }
  if (SIGNALS.contrast.some((r) => r.test(t))) {
    score += w.contrast;
    flags.push("contrast");
  }
  if (SIGNALS.pain.some((r) => r.test(t))) {
    score += w.pain;
    flags.push("pain");
  }
  if (SIGNALS.benefit.some((r) => r.test(t))) {
    score += w.benefit;
    flags.push("benefit");
  }
  if (SIGNALS.personal.some((r) => r.test(t))) {
    score += w.personal;
    flags.push("personal");
  }
  if (SIGNALS.specificity.some((r) => r.test(t))) {
    score += w.specificity;
    flags.push("specificity");
  }
  if (WEAK_OPENERS.test(t)) score += w.weakStart;
  if (wc > 40) score += w.longSentence;
  if ((t.match(/,/g) || []).length >= 4) score += w.manyCommas;
  if (SIGNALS.riskKeyword.some((r) => r.test(t))) {
    score += w.riskKeyword;
    flags.push("sensitive-term");
  }

  return { score, flags };
}

/**
 * Kandidaten nur aus dem ersten Absatz (wie bisheriger Feed-Fold-Kontext).
 * @returns {{ id: string, text: string }[]}
 */
export function buildSnippetCandidates(para) {
  const out = [];
  const ordered = splitOrderedForPairs(para, "de");
  const hybrid = splitSentencesHybrid(para, "de");
  const seen = new Set();

  const push = (id, text) => {
    const t = text.replace(/\s+/g, " ").trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    out.push({ id, text: t });
  };

  for (let i = 0; i < ordered.length; i++) {
    push(`s${i}`, ordered[i]);
    if (i + 1 < ordered.length) {
      const pair = `${ordered[i]} ${ordered[i + 1]}`.trim();
      if (pair.length <= 320) push(`p${i}`, pair);
    }
  }

  for (const h of hybrid) {
    const dup = ordered.some((o) => normKey(o) === normKey(h));
    if (!dup && h.length >= 40 && h.length <= 260) push(`h-${normKey(h).slice(0, 12)}`, h);
  }

  const p = para.trim();
  if (p.length >= 40 && p.length <= 280 && ordered.length > 1) push("para", p);

  const fl = p.split("\n")[0]?.trim() || "";
  const rest = p.slice(fl.length).trim();
  if (fl.length >= 12 && fl.length <= 120 && rest.length >= 20) {
    const sub = rest.split(/(?<=[.!?])\s+/)[0]?.trim();
    if (sub) push("head+follow", `${fl} ${sub}`);
  }

  return out;
}

function openingSentenceNorm(para) {
  const ord = splitOrderedForPairs(para, "de");
  if (!ord.length) return "";
  return normKey(ord[0]);
}

function applyOpeningDemotion(para, cand, baseScore, flags) {
  const ord = splitOrderedForPairs(para, "de");
  if (ord.length < 2) return baseScore;
  const open = openingSentenceNorm(para);
  if (!open || normKey(cand.text) !== open) return baseScore;
  const strong = flags.includes("question") || flags.includes("contrast") || flags.includes("pain");
  if (strong) return baseScore;
  return baseScore - 5;
}

export function rankFeedSnippetCandidates(raw, k = 8) {
  const para = firstParagraphNorm(raw);
  if (!para) return [];
  const cands = buildSnippetCandidates(para);
  const ranked = [];
  for (const c of cands) {
    if (excludeCandidate(c.text)) continue;
    const { score: rawScore, flags } = scoreSnippetCandidate(c.text);
    const score = applyOpeningDemotion(para, c, rawScore, flags);
    ranked.push({ id: c.id, text: c.text, score, flags });
  }
  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const ia = /^s(\d+)$/.exec(a.id)?.[1];
    const ib = /^s(\d+)$/.exec(b.id)?.[1];
    if (ia !== undefined && ib !== undefined) return Number(ib) - Number(ia);
    return 0;
  });
  return ranked.slice(0, k);
}

function fallbackTeaserFromParagraph(para, foldChars) {
  if (!para) return "";
  if (para.length <= foldChars) return para;
  let cut = para.slice(0, foldChars - 1);
  const sp = cut.lastIndexOf(" ");
  if (sp > foldChars * 0.55) cut = cut.slice(0, sp);
  return `${cut.trimEnd()}…`;
}

/**
 * @returns {{ teaser: string, source: 'ranked'|'fallback'|'ranked-weak', score?: number, flags?: string[] }}
 */
export function resolveFeedFoldTeaser(raw, foldChars = FEED_FOLD_CHARS) {
  const para = firstParagraphNorm(raw);
  if (!para) return { teaser: "", source: "fallback" };

  const ranked = rankFeedSnippetCandidates(raw, 12);
  const minScore = -12;
  let best = ranked.find((r) => r.score >= minScore) ?? ranked[0];

  if (best && /^p(\d+)$/.test(best.id)) {
    const i = Number(/^p(\d+)$/.exec(best.id)[1]);
    const second = ranked.find((r) => r.id === `s${i + 1}`);
    if (second && second.score >= best.score - 2) best = second;
  }

  if (best) {
    return {
      teaser: foldTeaser(best.text, foldChars),
      source: ranked.some((r) => r.score >= minScore) ? "ranked" : "ranked-weak",
      score: best.score,
      flags: best.flags,
    };
  }

  return {
    teaser: fallbackTeaserFromParagraph(para, foldChars),
    source: "fallback",
  };
}
