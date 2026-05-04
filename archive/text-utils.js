/** Reine Text-Hilfen (kein DOM) — von Checkliste & UI gemeinsam genutzt. */

import { FEED_FOLD_CHARS } from "./constants.js";
import { resolveFeedFoldTeaser } from "./feed-snippet-ranker.js";

export { FEED_FOLD_CHARS };

export function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function firstLine(text) {
  const t = text.replace(/\r\n/g, "\n");
  const i = t.indexOf("\n");
  return (i === -1 ? t : t.slice(0, i)).trim();
}

/** Erster Absatz (bis zur ersten Leerzeile zwischen Absätzen) */
export function firstParagraph(text) {
  const t = text.replace(/\r\n/g, "\n").trim();
  if (!t) return "";
  const m = t.match(/^([\s\S]*?)(?:\n\s*\n|$)/);
  return (m ? m[1] : t).trim();
}

export function sentences(text) {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function sentenceWordLengths(text) {
  return sentences(text).map((s) => s.split(/\s+/).filter(Boolean).length);
}

export function stdev(nums) {
  if (nums.length < 2) return 0;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const v = nums.reduce((s, n) => s + (n - mean) ** 2, 0) / (nums.length - 1);
  return Math.sqrt(v);
}

/** Gekürzte Vorschau ähnlich Feed „vor Mehr anzeigen“ — Snippet-Ranker mit Fallback auf 1. Absatz. */
export function linkedInFeedTeaser(raw) {
  return resolveFeedFoldTeaser(raw, FEED_FOLD_CHARS).teaser;
}
