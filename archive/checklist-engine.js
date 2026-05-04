/**
 * Checklisten — reine Heuristik-Analyse (kein DOM).
 *
 * Auto-Unterstützung pro Punkt:
 *
 * Best Practices
 * 1 Hook              weit   — erste Zeile im 1. Absatz: Länge, Fragezeichen, Zahl, Wortzahl
 * 2 Struktur         weit   — Absätze, längster Block ohne Pause
 * 3 Substanz         teil   — Zahlen, Beispiel-Marker, Listen-Muster (kein inhaltlicher Faktencheck)
 * 4 Verteilung       teil   — Textlänge vs. Richtwert, Hashtags, „Kommentar“-Hinweis
 * 5 Nachbearbeitung  teil   — CTA/Frage am Schluss; „laut lesen“ → n/a
 *
 * No-Gos
 * 1 Externe Links    weit   — http(s)-URLs im Text
 * 2 Frühes Edit      —      — aus Entwurf nicht erkennbar → n/a
 * 3 Engagement-Bait  teil   — grobe Muster (Kommentar/Like/Emoji-Ketten)
 * 4 Clickbait        gering — nur schwache Oberflächen-Signale
 * 5 Heikle Versprechen teil — Trigger-Wörter (Finanz/Gesundheit-Stil)
 * 6 Drittdaten       gering — Anführungszeichen / Zitat-Muster, unsicher
 */

/** @typedef {'full'|'partial'|'none'} AutoSupport */
/** @typedef {'pass'|'hint'|'warn'|'risk'|'na'} Signal */

import { firstLine, firstParagraph } from "./text-utils.js";

export const BEST_ITEMS = [
  "Hook: Die erste Zeile macht neugierig (Nutzen/Frage), nicht nur interner Kontext.",
  "Struktur: kurze Absätze / Leerzeilen — Mobile-Scannen möglich.",
  "Substanz: mindestens ein konkretes Detail (Zahl, Beispiel, Lernerkenntnis).",
  "Verteilung: Länge & Hashtags bewusst (langer Rest ggf. in den ersten Kommentar).",
  "Nachbearbeitung: CTA oder Frage am Ende; Rechtschreibung einmal laut vorlesen.",
];

export const NOGO_ITEMS = [
  "Externe Links unkritisch im Hauptpost — oft sinnvoller: Link im ersten Kommentar.",
  "Schweres Umschreiben direkt nach Veröffentlichung — frühe Massen-Edits vermeiden.",
  "Zu viele harte Engagement-Baits in einem Block („Kommentar X, like Y“).",
  "Stark irreführender Clickbait vs. tatsächlicher Inhalt.",
  "Heikle Versprechen (Finanz, Gesundheit, Recht) ohne saubere Absicherung.",
  "Sensible Drittdaten (Kunden/Kollegen) ohne klare Einwilligung zitiert.",
];

const REF_FEED_CHARS = 3000;

/**
 * @param {string} raw
 * @param {string|null} kindPrimary — 'headline'|'invite'|'feed'|'article'|null
 */
export function buildChecklistContext(raw, kindPrimary) {
  const t = raw.trim();
  const lead = firstParagraph(raw) || t;
  const fl = firstLine(lead);
  const paras = t ? t.split(/\n\s*\n/).filter((p) => p.trim()) : [];
  const maxParaLen = paras.length ? Math.max(...paras.map((p) => p.length)) : 0;
  const wc = t ? t.split(/\s+/).filter(Boolean).length : 0;
  const lines = t ? t.split(/\r?\n/).filter((l) => l.trim()) : [];
  const lastLine = lines.length ? lines[lines.length - 1].trim() : "";
  const hashtags = (t.match(/#[\p{L}\p{N}_]+/gu) || []).length;
  const urls = (t.match(/https?:\/\/[^\s\])>]+/gi) || []).length;
  const questions = (t.match(/\?/g) || []).length;

  return {
    raw,
    t,
    kindPrimary,
    lead,
    fl,
    paras,
    maxParaLen,
    wc,
    L: t.length,
    lastLine,
    hashtags,
    urls,
    questions,
  };
}

/**
 * @param {Signal} signal
 * @param {AutoSupport} autoSupport
 * @param {string} detail
 */
function row(autoSupport, signal, detail) {
  return { autoSupport, signal, detail };
}

/** @param {ReturnType<typeof buildChecklistContext>} c */
function analyzeBestHook(c) {
  if (!c.t) return row("full", "na", "Kein Text.");
  if (c.kindPrimary === "headline" || c.kindPrimary === "invite") {
    return row("partial", "hint", "Kurz-/Anschreiben: Hook-Fokus gilt vor allem für Feed/Artikel — hier optional.");
  }
  const { fl } = c;
  const words = fl.split(/\s+/).filter(Boolean).length;
  const hasHookSignal = /\?/.test(fl) || /\d/.test(fl) || words >= 7;
  if (fl.length >= 26 && fl.length <= 210 && hasHookSignal) {
    return row("full", "pass", "Erste Zeile (1. Absatz) wirkt mit Frage/Zahl/Länge nutzbar.");
  }
  if (fl.length > 210) {
    return row("full", "warn", "Erste Zeile lang — im Feed oft stark gekürzt.");
  }
  if (fl.length > 0 && fl.length < 24 && c.L > 100) {
    return row("partial", "hint", "Erste Zeile sehr kurz — prüfen, ob der Hook weiter unten versteckt ist.");
  }
  return row("partial", "hint", "Hook könnte stärker sein (Frage, konkreter Nutzen, Zahl).");
}

/** @param {ReturnType<typeof buildChecklistContext>} c */
function analyzeBestStructure(c) {
  if (!c.t) return row("full", "na", "Kein Text.");
  const n = c.paras.length;
  if (c.L < 320 && n <= 1) return row("full", "pass", "Kurztext — wenige Absätze sind ok.");
  if (n >= 2) return row("full", "pass", `${n} Absätze — gut scannbar.`);
  if (c.maxParaLen > 900) return row("full", "warn", "Sehr langer Block ohne Absatzpause — mobil schwer.");
  return row("partial", "hint", "Ein Fließblock — eine Leerzeile kann Lesbarkeit erhöhen.");
}

/** @param {ReturnType<typeof buildChecklistContext>} c */
function analyzeBestSubstanz(c) {
  if (!c.t) return row("partial", "na", "Kein Text.");
  const hasNumber = /\d{2,}|%|\d+\.\d+/.test(c.t);
  const hasExample = /\b(z\.?\s*b\.?|beispiel|case|lesson|learned|erfahrung)\b/i.test(c.t);
  const hasList = /^\s*[-*•]\s/m.test(c.t) || /^\s*\d+\.\s/m.test(c.t);
  if (hasNumber || hasExample || hasList) {
    return row("partial", "pass", "Konkretes Signal (Zahl, Beispiel-Marker oder Liste) erkannt.");
  }
  return row("partial", "hint", "Wenig greifbares Detail — Zahl, Mini-Beispiel oder klare Aussage erwägen.");
}

/** @param {ReturnType<typeof buildChecklistContext>} c */
function analyzeBestVerteilung(c) {
  if (!c.t) return row("partial", "na", "Kein Text.");
  const mentionsComment = /\b(kommentar|ersten kommentar|first comment|link unten)\b/i.test(c.t);
  if (c.L > REF_FEED_CHARS && !mentionsComment) {
    return row("partial", "warn", `Über ~${REF_FEED_CHARS} Zeichen — Rest ggf. in den ersten Kommentar legen?`);
  }
  if (c.hashtags > 8) return row("partial", "warn", "Viele Hashtags — wirkt schnell nach Liste/Spam.");
  if (c.hashtags >= 1 && c.hashtags <= 6) return row("partial", "pass", "Hashtag-Anzahl im moderaten Rahmen.");
  if (c.L < REF_FEED_CHARS * 0.95) return row("partial", "pass", "Länge im typischen Feed-Rahmen (heuristisch).");
  return row("partial", "hint", "Hashtags/Länge bewusst setzen (oder absichtlich weglassen).");
}

/** @param {ReturnType<typeof buildChecklistContext>} c */
function analyzeBestNachbearbeitung(c) {
  if (!c.t) return row("partial", "na", "Kein Text.");
  const hasQ = /\?\s*$/.test(c.lastLine);
  const cta = /(kommentar|kommentiert|dm|nachricht|link|bio|umfrage|poll|speichern|teilen|folgt|melde\s*dich|was\s*meint)\b/i.test(c.lastLine);
  if (c.L < 200) return row("partial", "pass", "Kurz — CTA oft implizit.");
  if (hasQ || cta) return row("partial", "pass", "Letzte Zeile: Frage oder Handlungsaufforderung erkannt.");
  if (c.L > 400) {
    return row("partial", "hint", "Längerer Text ohne klare Frage/CTA am Ende — Reaktionen können seltener werden.");
  }
  return row("partial", "hint", "Ende prüfen: Frage oder klare nächste Aktion.");
}

const BEST_ANALYZERS = [analyzeBestHook, analyzeBestStructure, analyzeBestSubstanz, analyzeBestVerteilung, analyzeBestNachbearbeitung];

/** @param {ReturnType<typeof buildChecklistContext>} c */
function analyzeNogoLinks(c) {
  if (!c.t) return row("full", "na", "Kein Text.");
  if (c.urls >= 1) return row("full", "risk", `${c.urls} URL(s) im Text — prüfen: Link besser in den ersten Kommentar?`);
  return row("full", "pass", "Keine http(s)-URL im Fließtext erkannt.");
}

function analyzeNogoEdit(_c) {
  return row("none", "na", "Aus dem Entwurf nicht ableitbar — nach dem Posten bewusst wenig schwer editieren.");
}

/** @param {ReturnType<typeof buildChecklistContext>} c */
function analyzeNogoBait(c) {
  if (!c.t) return row("partial", "na", "Kein Text.");
  const bait = /(kommentar.*like|like.*kommentar|like.*folgt|folgt.*like|teilt.*kommentar)/i.test(c.t);
  const emojiRun = /([\u{1F300}-\u{1F9FF}]\s*){5,}/u.test(c.t);
  if (bait || emojiRun) {
    return row("partial", "warn", "Auffällige Engagement-Bait-Muster — wirkt schnell forciert.");
  }
  return row("partial", "pass", "Kein grobes Bait-Muster erkannt (heuristisch).");
}

/** @param {ReturnType<typeof buildChecklistContext>} c */
function analyzeNogoClickbait(c) {
  if (!c.t) return row("none", "na", "Kein Text.");
  const lines = c.t.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const first = lines[0] || "";
  if (first.length > 12 && first === first.toUpperCase() && /[A-ZÄÖÜ]/.test(first)) {
    return row("partial", "hint", "Erste Zeile komplett in GROSSBUCHSTABEN — kann nach Clickbait wirken.");
  }
  return row("partial", "pass", "Kein starkes Oberflächen-Signal für irreführenden Clickbait.");
}

/** @param {ReturnType<typeof buildChecklistContext>} c */
function analyzeNogoHeikel(c) {
  if (!c.t) return row("partial", "na", "Kein Text.");
  const risky = /\b(garantiert|100\s*%\s*gewinn|risikofrei|sicherer gewinn|krankheit heilen|finanzfreiheit sofort)\b/i.test(c.t);
  if (risky) return row("partial", "risk", "Heikle Versprechen-ähnliche Formulierung — rechtlich/fachlich absichern.");
  return row("partial", "pass", "Keine typischen Heikel-Trigger erkannt (sehr grob).");
}

/** @param {ReturnType<typeof buildChecklistContext>} c */
function analyzeNogoDritte(c) {
  if (!c.t) return row("none", "na", "Kein Text.");
  const quoted = (c.t.match(/"[^"]{10,120}"/g) || []).length;
  if (quoted >= 2) {
    return row("partial", "hint", "Mehrere längere Zitate — prüfen, ob Einwilligung / Kontext geklärt ist.");
  }
  return row("none", "pass", "Aus Text allein kaum beurteilbar.");
}

const NOGO_ANALYZERS = [analyzeNogoLinks, analyzeNogoEdit, analyzeNogoBait, analyzeNogoClickbait, analyzeNogoHeikel, analyzeNogoDritte];

/**
 * @param {string} rawText
 * @param {string|null} kindPrimaryKey
 * @returns {{ context: object, best: object[], nogo: object[], meta: { version: number } }}
 */
export function runChecklistAnalysis(rawText, kindPrimaryKey) {
  const context = buildChecklistContext(rawText, kindPrimaryKey);
  const best = BEST_ITEMS.map((title, i) => ({
    index: i,
    title,
    ...BEST_ANALYZERS[i](context),
  }));
  const nogo = NOGO_ITEMS.map((title, i) => ({
    index: i,
    title,
    ...NOGO_ANALYZERS[i](context),
  }));
  return { context, best, nogo, meta: { version: 1 } };
}

const URL_RE_GLOBAL = /https?:\/\/[^\s\])>]+/gi;
const BAIT_RE = /(kommentar.*like|like.*kommentar|like.*folgt|folgt.*like|teilt.*kommentar)/gi;
const EMOJI_RUN_RE = /([\u{1F300}-\u{1F9FF}]\s*){5,}/u;
const RISKY_RE = /\b(garantiert|100\s*%\s*gewinn|risikofrei|sicherer gewinn|krankheit heilen|finanzfreiheit sofort)\b/gi;
const QUOTE_RE = /"[^"]{10,120}"/g;
const HASHTAG_RE = /#[\p{L}\p{N}_]+/gu;

/** @param {string} norm — Text mit \n, Positionen wie im Entwurf */
export function trimBounds(norm) {
  let t0 = 0;
  let t1 = norm.length;
  while (t0 < t1 && /\s/.test(norm[t0])) t0++;
  while (t1 > t0 && /\s/.test(norm[t1 - 1])) t1--;
  return { t0, t1 };
}

/**
 * Zeichenbereiche für die Vorschau (Signale wie in der Checkliste).
 * @param {string} norm
 * @param {ReturnType<typeof runChecklistAnalysis>} analysis
 * @returns {{ start: number, end: number, signal: Signal }[]}
 */
export function collectChecklistHighlightSpans(norm, analysis) {
  /** @type {{ start: number, end: number, signal: Signal }[]} */
  const spans = [];
  const push = (a, b, signal) => {
    const start = Math.max(0, Math.min(a, b));
    const end = Math.max(0, Math.max(a, b));
    if (end > start) spans.push({ start, end, signal });
  };

  const { context, best, nogo } = analysis;
  const { t0, t1 } = trimBounds(norm);
  const t = norm.slice(t0, t1);
  if (!t) return spans;

  if (nogo[0].signal === "risk") {
    let m;
    URL_RE_GLOBAL.lastIndex = 0;
    while ((m = URL_RE_GLOBAL.exec(norm)) !== null) push(m.index, m.index + m[0].length, "risk");
  }

  if (nogo[2].signal === "warn") {
    let m;
    BAIT_RE.lastIndex = 0;
    while ((m = BAIT_RE.exec(norm)) !== null) push(m.index, m.index + m[0].length, "warn");
    while ((m = EMOJI_RUN_RE.exec(norm)) !== null) push(m.index, m.index + m[0].length, "warn");
  }

  if (nogo[3].signal === "hint") {
    const lines = t.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const first = lines[0] || "";
    if (first.length > 12 && first === first.toUpperCase() && /[A-ZÄÖÜ]/.test(first)) {
      const k = t.indexOf(first);
      if (k >= 0) push(t0 + k, t0 + k + first.length, "hint");
    }
  }

  if (nogo[4].signal === "risk") {
    let m;
    RISKY_RE.lastIndex = 0;
    while ((m = RISKY_RE.exec(norm)) !== null) push(m.index, m.index + m[0].length, "risk");
  }

  if (nogo[5].signal === "hint") {
    let m;
    QUOTE_RE.lastIndex = 0;
    while ((m = QUOTE_RE.exec(norm)) !== null) push(m.index, m.index + m[0].length, "hint");
  }

  const fl = context.fl;
  if (fl && (best[0].signal === "warn" || best[0].signal === "hint")) {
    const k = t.indexOf(fl);
    if (k >= 0) push(t0 + k, t0 + k + fl.length, best[0].signal);
  }

  if (best[1].signal === "warn") {
    const paras = t.split(/\n\s*\n/).filter((p) => p.trim());
    let long = "";
    for (const p of paras) {
      if (p.length > long.length) long = p;
    }
    if (long.length > 900) {
      const off = t.indexOf(long);
      if (off >= 0) push(t0 + off, t0 + off + long.length, "warn");
    }
  }

  if (best[3].signal === "warn") {
    if (context.hashtags > 8) {
      let m;
      HASHTAG_RE.lastIndex = 0;
      while ((m = HASHTAG_RE.exec(t)) !== null) push(t0 + m.index, t0 + m.index + m[0].length, "warn");
    }
    const mentionsComment = /\b(kommentar|ersten kommentar|first comment|link unten)\b/i.test(context.t);
    if (context.L > REF_FEED_CHARS && !mentionsComment && t.length > REF_FEED_CHARS) {
      push(t0 + REF_FEED_CHARS, t1, "warn");
    }
  }

  if (best[4].signal === "hint" && context.lastLine && context.L > 400) {
    const ll = context.lastLine;
    const idx = t.lastIndexOf(ll);
    if (idx >= 0) push(t0 + idx, t0 + idx + ll.length, "hint");
  }

  return spans;
}

/** Kurz-Legende für UI-Tooltip oder Infobox */
export const AUTO_SUPPORT_LABEL = {
  full: "stark aus Text ableitbar",
  partial: "teilweise / grob",
  none: "nicht aus Entwurf ableitbar",
};
