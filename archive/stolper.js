import { FIRST_LINE_SOFT, FIRST_LINE_WARN } from "./constants.js";
import {
  firstLine,
  firstParagraph,
  sentences,
  sentenceWordLengths,
  stdev,
} from "./text-utils.js";

/** Typische Füll-/Modewörter & Satzbausteine (DE/EN) — nur Stil-Hinweis */
export const BUZZ_PATTERNS = [
  /\b(delves?|tapestry|leverage[sd]?|granular|holistic|robust|landscape|synerg(y|ies)|impactful)\b/gi,
  /\b(game\s*changer|cutting[\s-]edge|thought\s*leader|pain\s*points?|circle\s*back|deep\s*dive)\b/gi,
  /\b(enablement|learnings?|takeaways?|low-hanging\s*fruit|moving\s*forward)\b/gi,
  /(es\s+ist\s+wichtig|zusammenfassend|abschließend\s+lässt|in\s+der\s+heutigen\s+zeit|hier\s+sind\s+\d+|hier\s+ist\s+\d+)/gi,
  /\b(mehrwert|synergie|hebeln|skalieren|roadmap|journey|agile|thought\s*leadership)\b/gi,
  /\b(tiefgehend|fundiert|bandbreite|spannend|exciting|robuste\s+lösung)\b/gi,
];

function countBuzz(text) {
  let total = 0;
  const seen = new Set();
  for (const re of BUZZ_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      total++;
      const key = m[0].toLowerCase();
      if (seen.size < 6) seen.add(key);
    }
  }
  return { total, samples: [...seen] };
}

/** Erste 1–2 Wörter eines Satzes (grob) */
function openerKey(sentence) {
  const w = sentence.split(/\s+/).filter(Boolean).slice(0, 2);
  return w.map((x) => x.replace(/^[^\p{L}\p{N}]+/u, "").toLowerCase()).join(" ");
}

function openerRepeats(text) {
  const sents = sentences(text);
  const map = new Map();
  for (const s of sents) {
    const k = openerKey(s);
    if (k.length < 2) continue;
    map.set(k, (map.get(k) || 0) + 1);
  }
  let best = null;
  for (const [k, c] of map) {
    if (c >= 3 && (!best || c > best.count)) best = { key: k, count: c };
  }
  return best;
}

export function buildStolperHints(tFull) {
  const hints = [];
  const t = tFull.trim();

  if (!t) {
    hints.push({ level: "info", text: "Noch leer — Stil-Checks greifen, sobald du schreibst." });
    return hints;
  }

  const lead = firstParagraph(tFull) || t;
  const fl = firstLine(lead);
  if (fl.length > FIRST_LINE_WARN) {
    hints.push({
      level: "warn",
      text: `Erste Zeile ${fl.length} Zeichen — im Feed oft stark gekürzt; Hook nach vorn.`,
    });
  } else if (fl.length > FIRST_LINE_SOFT) {
    hints.push({
      level: "info",
      text: `Erste Zeile ${fl.length} Zeichen — noch ok; kritische Info in die ersten ~${FIRST_LINE_SOFT} Zeichen legen.`,
    });
  } else if (fl.length > 0 && fl.length < 22) {
    hints.push({
      level: "info",
      text: "Sehr kurze erste Zeile — wenn das der ganze Hook ist: stark; sonst nächste Zeile nutzen.",
    });
  }

  const paras = t.split(/\n\s*\n/).filter((p) => p.trim());
  const maxPara = paras.length ? Math.max(...paras.map((p) => p.length)) : 0;
  if (maxPara > 950) {
    hints.push({
      level: "warn",
      text: "Block ohne Absatzpause — auf dem Handy schwer scannbar; Leerzeile setzen.",
    });
  }
  if (paras.length === 1 && t.length > 500) {
    hints.push({
      level: "info",
      text: "Nur ein Fließblock — ein Absatzwechsel erhöht Lesbarkeit (auch ohne „Story“-Format).",
    });
  }

  const hashtags = (t.match(/#[\p{L}\p{N}_]+/gu) || []).length;
  if (hashtags > 8) hints.push({ level: "warn", text: `${hashtags} Hashtags — wirkt schnell nach Spam / SEO-Liste.` });
  else if (hashtags === 0 && t.length > 350) {
    hints.push({
      level: "info",
      text: "Keine Hashtags — völlig ok; wenn Sichtbarkeit: wenige, inhaltlich passende erwägen.",
    });
  }

  const lines = t.split(/\r?\n/).filter((l) => l.trim());
  const last = lines.length ? lines[lines.length - 1].trim() : "";
  const hasQuestion = /\?\s*$/.test(last);
  const cta = /(kommentar|kommentiert|dm|nachricht|link\s*(in|zur)?\s*bio|umfrage|poll|speichern|teilen|folgt|melde\s*dich|was\s*meint|eure\s*erfahrung)/i.test(last);
  if (t.length > 450 && !hasQuestion && !cta) {
    hints.push({
      level: "info",
      text: "Keine offensichtliche Frage oder Handlungsaufforderung am Schluss — oft weniger Reaktionen.",
    });
  }

  const buzz = countBuzz(t);
  if (buzz.total >= 6) {
    hints.push({
      level: "warn",
      text: `Viele typische Modewörter/Füllmuster (${buzz.total}) — klingt schnell „einheitsbrei“.`,
    });
  } else if (buzz.total >= 2) {
    hints.push({
      level: "info",
      text: `Ca. ${buzz.total} typische Füll-/Modewörter${buzz.samples.length ? ` (${buzz.samples.join(", ")})` : ""} — bewusst variieren.`,
    });
  }

  const em = (t.match(/[—–]/g) || []).length;
  const sc = Math.max(1, sentences(t).length);
  if (em >= 5 && em / sc > 0.35) {
    hints.push({
      level: "info",
      text: "Viele Gedankenstriche — stilistisch oft mit generisch wirkenden Texten assoziiert (nicht beweisend).",
    });
  }

  const rep = openerRepeats(t);
  if (rep) {
    hints.push({
      level: "warn",
      text: `Satzanfang „${rep.key}…“ mehrfach (${rep.count}×) — Rhythmus wirkt mechanisch.`,
    });
  }

  const lens = sentenceWordLengths(t);
  if (lens.length >= 6 && stdev(lens) < 3.8) {
    hints.push({
      level: "info",
      text: "Sehr gleichmäßige Satzlängen — kurze Schlagzeilen-Sätze und längere Erklär-Sätze mischen.",
    });
  }

  const we = (t.match(/\b(wir|uns|unser[e]?)\b/gi) || []).length;
  const ich = (t.match(/\bich\b/gi) || []).length;
  const wc = t.split(/\s+/).filter(Boolean).length || 1;
  if (we / wc > 0.06 && we > 8) {
    hints.push({ level: "info", text: "Viel „Wir/Uns“ — persönlicheres „Ich“ oder konkrete Beispiele können näher wirken." });
  }
  if (ich / wc > 0.08 && ich > 10) {
    hints.push({ level: "info", text: "Sehr viel „Ich“ — einmal Team/Kunde/Leser mitdenken, wirkt weniger monologisch." });
  }

  if (t.length < 650 && /^hi[,!]?\s/i.test(t) && !/\b(dein|ihr|name|freut|gelesen|profil|beitrag)\b/i.test(t)) {
    hints.push({
      level: "info",
      text: "Beginnt generisch („Hi …“) — bei Kurznachricht: konkreter Bezug (Post, Firma) erhöht Antwortquote.",
    });
  }

  if (t.length > 0 && t.length < 400 && /[|•]{3,}/.test(t)) {
    hints.push({ level: "info", text: "Viele Trennzeichen in kurzem Text — auf kleinen Screens unleserlich?" });
  }

  return hints.slice(0, 12);
}
