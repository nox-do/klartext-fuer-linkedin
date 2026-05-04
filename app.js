/**
 * LinkedIn-nützlicher One-Pager: lokale Textanalyse, keine APIs.
 */

import {
  runChecklistAnalysis,
  BEST_ITEMS,
  NOGO_ITEMS,
  AUTO_SUPPORT_LABEL,
  collectChecklistHighlightSpans,
} from "./checklist-engine.js";

const DRAFT_MAX = 12000;
/** Richtwerte für Längen-Band (nur Hinweise in der UI) */
const REF_HEADLINE = 220;
const REF_INVITE = 300;
const REF_FEED = 3000;
const FIRST_LINE_SOFT = 140;
const FIRST_LINE_WARN = 210;
/** ~sichtbarer Text im Feed vor „mehr“ (Annäherung) */
const FEED_FOLD_CHARS = 200;

const KIND_ORDER = ["headline", "invite", "feed", "article"];
const KIND = {
  headline: { label: "Schlagzeile" },
  invite: { label: "Einladung / Kurznachricht" },
  feed: { label: "Feed-Post" },
  article: { label: "Artikel / langer Beitrag" },
};

/** Typische Füll-/Modewörter & Satzbausteine (DE/EN) — nur Stil-Hinweis, kein Urteil über Autorschaft */
const BUZZ_PATTERNS = [
  /\b(delves?|tapestry|leverage[sd]?|granular|holistic|robust|landscape|synerg(y|ies)|impactful)\b/gi,
  /\b(game\s*changer|cutting[\s-]edge|thought\s*leader|pain\s*points?|circle\s*back|deep\s*dive)\b/gi,
  /\b(enablement|learnings?|takeaways?|low-hanging\s*fruit|moving\s*forward)\b/gi,
  /(es\s+ist\s+wichtig|zusammenfassend|abschließend\s+lässt|in\s+der\s+heutigen\s+zeit|hier\s+sind\s+\d+|hier\s+ist\s+\d+)/gi,
  /\b(mehrwert|synergie|hebeln|skalieren|roadmap|journey|agile|thought\s*leadership)\b/gi,
  /\b(tiefgehend|fundiert|bandbreite|spannend|exciting|robuste\s+lösung)\b/gi,
];

let lastChecklistAnalysis = null;

const draft = document.getElementById("draft");
const draftStats = document.getElementById("draftStats");
const kindChips = document.getElementById("kindChips");
const kindDetail = document.getElementById("kindDetail");
const readMetrics = document.getElementById("readMetrics");
const btnClear = document.getElementById("btnClear");
const previewLine = document.getElementById("previewLine");
const firstLineCount = document.getElementById("firstLineCount");
const styleHints = document.getElementById("styleHints");
const nlpInsightsEl = document.getElementById("nlpInsights");

/** compromise + sentiment (AFINN), Browser-ESM */
const ESM_COMPROMISE = "https://esm.sh/compromise@14.14.2";
const ESM_SENTIMENT = "https://esm.sh/sentiment@5.0.2";

let nlpLib = null;
let SentimentCtor = null;
let nlpImportPromise = null;
let nlpLoadError = null;
let sentimentAnalyzer = null;
let nlpSeq = 0;

function lenClass(n, soft, hard = soft) {
  if (n <= soft) return "ok";
  if (n <= hard) return "warn";
  return "err";
}

function firstLine(text) {
  const t = text.replace(/\r\n/g, "\n");
  const i = t.indexOf("\n");
  return (i === -1 ? t : t.slice(0, i)).trim();
}

/** Erster Absatz (bis zur ersten Leerzeile zwischen Absätzen) — wie LinkedIn oft den Beitrag beginnt */
function firstParagraph(text) {
  const t = text.replace(/\r\n/g, "\n").trim();
  if (!t) return "";
  const m = t.match(/^([\s\S]*?)(?:\n\s*\n|$)/);
  return (m ? m[1] : t).trim();
}

/** Gekürzte Vorschau ähnlich Feed „vor Mehr anzeigen“ */
function linkedInFeedTeaser(raw) {
  const para = firstParagraph(raw);
  if (!para) return "";
  if (para.length <= FEED_FOLD_CHARS) return para;
  let cut = para.slice(0, FEED_FOLD_CHARS - 1);
  const sp = cut.lastIndexOf(" ");
  if (sp > FEED_FOLD_CHARS * 0.55) cut = cut.slice(0, sp);
  return `${cut.trimEnd()}…`;
}

/** Grobe Einladungs-/Kurznachrichten-Signale (Sprache, nicht Modell) */
function inviteSignals(t) {
  const low = t.slice(0, 520).toLowerCase();
  let s = 0;
  if (
    /\b(hallo|hi |liebe |lieber |sehr geehrte|ich schreibe|ich würde mich freuen|vernetz|netzwerk|profil|beitrag|gelesen|zufällig|zum zufall|kontakt|einladung|connect)\b/.test(
      low
    )
  )
    s += 2;
  if (/\b(du|dir|dich|dein|deine|euch|ihr|ihnen|sie\s)\b/.test(low)) s += 2;
  if (/\b(freue|freuen|möchte|würde gerne|kurz melden|kurz vorstellen|ansprechen|melde mich)\b/.test(low)) s += 1;
  if (/^\s*hi[,!]?\s/i.test(t)) s += 1;
  return s;
}

function deriveKind(text) {
  const t = text.trim();
  if (!t) {
    return { primaryKey: null, scores: { headline: 0, invite: 0, feed: 0, article: 0 }, reasons: [] };
  }
  const L = t.length;
  const words = t.split(/\s+/).filter(Boolean);
  const W = words.length;
  const paras = t.split(/\n\s*\n/).filter((p) => p.trim()).length;
  const nl = (t.match(/\r?\n/g) || []).length;
  const inv = inviteSignals(t);

  const scores = { headline: 0, invite: 0, feed: 0, article: 0 };

  if (L >= 3000 || (W >= 360 && paras >= 2) || (L >= 2200 && paras >= 3)) scores.article += 52;
  else if (L >= 2200 || W >= 280) scores.article += 26;

  scores.invite += inv * 16;
  if (L >= 40 && L <= 520) scores.invite += 24;
  if (L > 850) scores.invite -= 38;
  if (paras >= 3 && L > 700) scores.invite -= 22;

  if (L <= 240 && nl <= 2) scores.headline += 32;
  if (L <= 220) scores.headline += 26;
  if (/[|·•]{2,}/.test(t) && L < 420) scores.headline += 16;
  if (nl > 4) scores.headline -= 22;
  if (L > 300) scores.headline -= 18;
  if (inv >= 3) scores.headline -= 28;

  if (L >= 200 && L <= 3400) scores.feed += 24;
  if (L >= 380 && L <= 3000 && inv < 2) scores.feed += 22;
  if (paras >= 2) scores.feed += 14;
  if (scores.article > 42) scores.feed -= 18;

  let primaryKey = "feed";
  let best = -999;
  for (const k of KIND_ORDER) {
    if (scores[k] > best) {
      best = scores[k];
      primaryKey = k;
    }
  }

  const reasons = [];
  if (inv >= 2) reasons.push("persönliche Ansprache / typische Kurznachrichten-Wörter");
  if (L <= REF_HEADLINE + 40 && nl <= 2) reasons.push("sehr kompakt, wenig Zeilenumbruch");
  if (L > REF_FEED) reasons.push("über typischer Feed-Länge — eher Artikel oder Kommentar-Strategie");
  if (paras >= 2 && L > 500) reasons.push("mehrere Absätze — eher längerer Beitrag");
  if (reasons.length === 0) reasons.push("Länge und Struktur passen am ehesten zu dieser Kategorie");

  return { primaryKey, scores, reasons };
}

function renderKindRecommendation(text) {
  const d = deriveKind(text);
  if (!kindChips) return d;
  if (!d.primaryKey) {
    kindChips.innerHTML = KIND_ORDER.map(
      (k) => `<span class="kind-chip" data-kind="${k}">${escapeHtml(KIND[k].label)}</span>`
    ).join("");
    if (kindDetail) kindDetail.textContent = "";
    return d;
  }
  kindChips.innerHTML = KIND_ORDER.map((k) => {
    const cls = k === d.primaryKey ? "kind-chip primary" : "kind-chip";
    return `<span class="${cls}" data-kind="${k}">${escapeHtml(KIND[k].label)}</span>`;
  }).join("");
  if (kindDetail) {
    kindDetail.textContent = `Am ehesten: ${KIND[d.primaryKey].label} — ${d.reasons.join("; ")}.`;
  }
  return d;
}

function updateFeedPreviewSection(raw, primaryKey) {
  const sec = document.getElementById("feedPreviewSection");
  if (!sec || !previewLine || !firstLineCount) return;

  const show = primaryKey === "feed" || primaryKey === "article";
  sec.hidden = !show;
  if (!show) return;

  const t = raw.trim();
  if (!t) {
    previewLine.textContent = "(noch leer)";
    firstLineCount.innerHTML = "";
    return;
  }

  const para = firstParagraph(raw);
  const teaser = linkedInFeedTeaser(raw);
  const hookLine = firstLine(para);
  const hookLen = hookLine.length;
  const teaserLen = teaser.length;
  const paraLen = para.length;
  const folded = teaser.endsWith("…");

  previewLine.textContent = teaser || "(leer)";
  const flCls = lenClass(hookLen, FIRST_LINE_SOFT, FIRST_LINE_WARN);
  firstLineCount.innerHTML = `<span class="${flCls}">${hookLen} Zeichen</span> erste Zeile · Vorschau <strong>${teaserLen}</strong> Zeichen${folded ? ` von ${paraLen} im 1. Absatz` : ""} <span style="color:var(--muted);font-weight:400">(Feed-Fold ~${FEED_FOLD_CHARS})</span>`;
}

function renderDraftStats(text) {
  if (!draftStats) return;
  const L = text.length;
  const W = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  let cls = "ok";
  if (L > REF_FEED) cls = "warn";
  else if (L > REF_INVITE + 120 && L <= REF_FEED) cls = "ok";
  draftStats.innerHTML = `<span class="${cls}">${L}</span> / ${DRAFT_MAX} Zeichen · <span class="${cls}">${W}</span> Wörter`;
}

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

function sentences(text) {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function sentenceWordLengths(text) {
  return sentences(text).map((s) => s.split(/\s+/).filter(Boolean).length);
}

function stdev(nums) {
  if (nums.length < 2) return 0;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const v = nums.reduce((s, n) => s + (n - mean) ** 2, 0) / (nums.length - 1);
  return Math.sqrt(v);
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

function buildStolperHints(tFull) {
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

function renderHints(hints) {
  if (!styleHints) return;
  styleHints.innerHTML = hints
    .map((h) => `<li class="${h.level === "warn" ? "warn" : "info"}">${escapeHtml(h.text)}</li>`)
    .join("");
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Kurztext für die Signal-Liste (ein Zeilenumbruch → Leerzeichen) */
function streamTruncate(s, n) {
  const t = String(s || "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1)}…`;
}

/**
 * Eine priorisierte Kurzliste: Eignung → Risiken/Warnungen → Feed-Hook → Stil.
 * Volle Details bleiben unter „Technische Details“.
 */
function buildSignalStream(raw, kind, a, stolperHints) {
  const t = raw.trim();
  if (!t || !kind?.primaryKey) return [];

  const out = [];
  const seen = new Set();
  const dedupeKey = (x) => x.slice(0, 96).toLowerCase();
  const push = (level, text) => {
    const k = dedupeKey(text);
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ level, text });
  };

  const pk = kind.primaryKey;
  const reasons = kind.reasons?.length ? kind.reasons.join("; ") : "Länge und Struktur";
  push("info", `Eignung: ${KIND[pk].label} — ${streamTruncate(reasons, 170)}`);

  if (a?.nogo?.length) {
    for (let i = 0; i < a.nogo.length; i++) {
      const item = a.nogo[i];
      if (item?.signal === "risk") push("risk", `No-Go: ${NOGO_ITEMS[i]} — ${streamTruncate(item.detail, 130)}`);
    }
    for (let i = 0; i < a.nogo.length; i++) {
      const item = a.nogo[i];
      if (item?.signal === "warn") push("warn", `No-Go: ${NOGO_ITEMS[i]} — ${streamTruncate(item.detail, 130)}`);
    }
  }

  if (a?.best?.length) {
    for (let i = 0; i < a.best.length; i++) {
      const item = a.best[i];
      if (item?.signal === "warn") push("warn", `Best practice: ${BEST_ITEMS[i]} — ${streamTruncate(item.detail, 130)}`);
    }
  }

  if (pk === "feed" || pk === "article") {
    const teaser = linkedInFeedTeaser(raw);
    if (teaser && teaser.length > 15) push("info", `Feed-Schnipsel (ca.): „${streamTruncate(teaser, 115)}“`);
  }

  for (const h of stolperHints) {
    if (h.level === "warn") push("warn", h.text);
  }

  if (a?.nogo?.length) {
    for (let i = 0; i < a.nogo.length; i++) {
      const item = a.nogo[i];
      if (item?.signal === "hint") push("info", `No-Go: ${NOGO_ITEMS[i]} — ${streamTruncate(item.detail, 120)}`);
    }
  }

  if (a?.best?.length) {
    for (let i = 0; i < a.best.length; i++) {
      const item = a.best[i];
      if (item?.signal === "hint") push("info", `Best practice: ${BEST_ITEMS[i]} — ${streamTruncate(item.detail, 120)}`);
    }
  }

  for (const h of stolperHints) {
    if (h.level === "info") push("info", h.text);
  }

  const MAX = 8;
  let list = out.slice(0, MAX);
  if (list.length === 1 && t.length > 40) {
    list.push({
      level: "info",
      text: "Keine weiteren markanten Signale in der Kurzliste — unter „Technische Details“: Lesbarkeit, NLP, vollständige Checklisten und Stil-Hinweise.",
    });
  }
  return list;
}

function renderInsightStream(items) {
  const sec = document.getElementById("insightsSection");
  const ul = document.getElementById("signalStream");
  if (!sec || !ul) return;
  if (!items.length) {
    sec.hidden = true;
    ul.innerHTML = "";
    return;
  }
  sec.hidden = false;
  ul.innerHTML = items
    .map((it) => {
      const cls = it.level === "risk" ? "risk" : it.level === "warn" ? "warn" : "info";
      return `<li class="sig-${cls}">${escapeHtml(it.text)}</li>`;
    })
    .join("");
}

const HL_PRI = { risk: 5, warn: 4, hint: 3, pass: 2, na: 1 };
const HL_NAME = ["", "na", "pass", "hint", "warn", "risk"];

function paintSpansToMask(mask, spans) {
  for (const s of spans) {
    const p = HL_PRI[s.signal] || 0;
    if (!p) continue;
    const a = Math.max(0, s.start);
    const b = Math.min(mask.length, s.end);
    for (let i = a; i < b; i++) {
      if (mask[i] < p) mask[i] = p;
    }
  }
}

function paintBuzzToMask(norm, mask) {
  const p = HL_PRI.hint;
  for (const re of BUZZ_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(norm)) !== null) {
      const a = m.index;
      const b = Math.min(mask.length, m.index + m[0].length);
      for (let i = a; i < b; i++) {
        if (mask[i] < p) mask[i] = p;
      }
    }
  }
}

function renderPreviewRich(norm, mask) {
  let html = "";
  let i = 0;
  while (i < norm.length) {
    const v = mask[i];
    let j = i + 1;
    while (j < norm.length && mask[j] === v) j++;
    const frag = norm.slice(i, j);
    const esc = escapeHtml(frag);
    if (!v) html += esc;
    else html += `<span class="hl hl-${HL_NAME[v]}" title="${HL_NAME[v]}">${esc}</span>`;
    i = j;
  }
  return html.replace(/\n/g, "<br>");
}

/** Beispiel: erste Zeile mit **fett** (viele LinkedIn-Clients); Absätze mit Leerzeile. */
function linkedInFormatExample(raw) {
  const n = raw.replace(/\r\n/g, "\n").trim();
  if (!n) return "";
  const m = n.match(/^([\s\S]*?)(?:\n\s*\n|$)/);
  const firstBlock = m ? m[1] : n;
  const fl = firstLine(firstBlock);
  if (!fl) return n;
  const nl = firstBlock.indexOf("\n");
  const restInFirst = nl === -1 ? "" : firstBlock.slice(nl + 1).trim();
  const afterBlocks = m ? n.slice(m[0].length).trim() : "";
  const chunks = [`**${fl}**`];
  if (restInFirst) chunks.push(restInFirst);
  if (afterBlocks) chunks.push(afterBlocks);
  return chunks.join("\n\n").replace(/\n{3,}/g, "\n\n");
}

function renderLivePreview(raw) {
  const rich = document.getElementById("previewRich");
  const fmt = document.getElementById("linkedInExampleFormat");
  const panel = document.getElementById("previewPanel");
  if (!rich || !fmt || !panel) return;
  const norm = raw.replace(/\r\n/g, "\n");
  if (!norm.trim()) {
    panel.hidden = true;
    rich.innerHTML = "";
    fmt.value = "";
    return;
  }
  panel.hidden = false;
  const mask = new Uint8Array(norm.length);
  if (lastChecklistAnalysis) paintSpansToMask(mask, collectChecklistHighlightSpans(norm, lastChecklistAnalysis));
  paintBuzzToMask(norm, mask);
  rich.innerHTML = renderPreviewRich(norm, mask);
  fmt.value = linkedInFormatExample(raw);
}

async function ensureNlp() {
  if (nlpLib && SentimentCtor) return true;
  try {
    if (!nlpImportPromise) {
      nlpImportPromise = Promise.all([import(ESM_COMPROMISE), import(ESM_SENTIMENT)]).then(([cMod, sMod]) => {
        nlpLib = cMod.default;
        SentimentCtor = sMod.default;
      });
    }
    await nlpImportPromise;
    nlpLoadError = null;
    return !!(nlpLib && SentimentCtor);
  } catch (e) {
    nlpLoadError = e;
    nlpImportPromise = null;
    return false;
  }
}

function getSentimentAnalyzer() {
  if (!SentimentCtor) return null;
  if (!sentimentAnalyzer) sentimentAnalyzer = new SentimentCtor();
  return sentimentAnalyzer;
}

function countEmojiExtended(text) {
  try {
    return [...text.matchAll(/\p{Extended_Pictographic}/gu)].length;
  } catch {
    return 0;
  }
}

function hookStrengthScore({ hookText, hookComparative, firstLineLen }) {
  let s = 42;
  const words = hookText.trim().split(/\s+/).filter(Boolean).length;
  if (words >= 5) s += 18;
  if (words >= 8) s += 8;
  if (/\?/.test(hookText)) s += 12;
  if (hookComparative > 0.08) s += 8;
  if (firstLineLen >= 35 && firstLineLen <= 200) s += 12;
  return Math.min(100, Math.round(s));
}

function computeNlpInsightsHtml(text) {
  const doc = nlpLib(text);
  let nSents;
  let nWords;
  try {
    nSents = Math.max(1, doc.sentences().length);
    nWords = doc.terms().length;
  } catch {
    const s = sentences(text);
    nSents = Math.max(1, s.length);
    nWords = text.split(/\s+/).filter(Boolean).length;
  }
  const density = (nWords / nSents).toFixed(1);

  const sa = getSentimentAnalyzer();
  const full = sa ? sa.analyze(text) : { score: 0, comparative: 0, positive: [], negative: [] };
  const hookWords = text.trim().split(/\s+/).slice(0, 10).join(" ");
  const hookAn = hookWords && sa ? sa.analyze(hookWords) : { score: 0, comparative: 0 };

  let toneLabel = "neutral (AFINN)";
  if (full.comparative > 0.05) toneLabel = "eher positiv";
  else if (full.comparative < -0.05) toneLabel = "eher negativ";

  const questions = (text.match(/\?/g) || []).length;
  const emojis = countEmojiExtended(text);
  const hashtags = (text.match(/#[\p{L}\p{N}_]+/gu) || []).length;
  const flLen = firstLine(text).length;
  const hookScore = hookStrengthScore({
    hookText: hookWords,
    hookComparative: hookAn.comparative || 0,
    firstLineLen: flLen,
  });

  const posArr = full.positive || [];
  const negArr = full.negative || [];
  const posHint =
    posArr.length && posArr.length <= 4
      ? `<br><span style="font-size:0.75rem">Positive Treffer: ${posArr.map((w) => escapeHtml(String(w))).join(", ")}</span>`
      : "";
  const negHint =
    negArr.length && negArr.length <= 4
      ? `<br><span style="font-size:0.75rem">Negative Treffer: ${negArr.map((w) => escapeHtml(String(w))).join(", ")}</span>`
      : "";

  return `
<div class="nlp-grid">
  <div class="nlp-card"><strong>Content density</strong>
    <span class="nlp-val">${density}</span> Ø Wörter / Satz (compromise)<br>
    <span style="font-size:0.76rem">${nWords} Wörter · ${nSents} Sätze</span>
  </div>
  <div class="nlp-card"><strong>Tonality (AFINN)</strong>
    <span class="nlp-val">${(full.comparative ?? 0).toFixed(3)}</span> comparative · Score ${full.score ?? 0}
    <br><span style="font-size:0.76rem">${escapeHtml(toneLabel)}</span>${posHint}${negHint}
  </div>
  <div class="nlp-card"><strong>Hook (10 Wörter)</strong>
    <span class="nlp-val">${hookScore}</span> / 100 heuristisch<br>
    <span style="font-size:0.76rem">Snippet: „${escapeHtml(hookWords.slice(0, 120))}${hookWords.length > 120 ? "…" : ""}“</span>
  </div>
  <div class="nlp-card"><strong>Pattern</strong>
    <span class="nlp-val">${questions}</span> Fragezeichen ·
    <span class="nlp-val">${emojis}</span> Emoji ·
    <span class="nlp-val">${hashtags}</span> Hashtags
  </div>
</div>`;
}

async function updateNlpPanel(text) {
  if (!nlpInsightsEl) return;
  const seq = ++nlpSeq;
  const t = text.trim();
  if (!t) {
    nlpInsightsEl.innerHTML =
      '<span style="color:var(--muted)">Noch kein Text — hier erscheinen Dichte, Tonality, Hook &amp; Muster (nach compromise / sentiment).</span>';
    return;
  }
  nlpInsightsEl.textContent = "Lade / analysiere …";
  const ok = await ensureNlp();
  if (seq !== nlpSeq) return;
  if (!ok) {
    nlpInsightsEl.innerHTML = `<span class="warn">NLP-Module nicht ladbar (Netzwerk/Blocker?). ${escapeHtml(String(nlpLoadError?.message || nlpLoadError || "Fehler"))}</span>`;
    return;
  }
  nlpInsightsEl.innerHTML = computeNlpInsightsHtml(t);
}

function checklistSignalLabel(signal) {
  const m = { pass: "OK", hint: "Hinweis", warn: "Achtung", risk: "Risiko", na: "k. A." };
  return m[signal] || signal;
}

function renderChecklistProgress() {
  const bestFill = document.getElementById("bestProgressFill");
  const bestTrack = document.getElementById("bestProgressTrack");
  const bestLabel = document.getElementById("bestProgressLabel");
  const nogoFill = document.getElementById("nogoProgressFill");
  const nogoTrack = document.getElementById("nogoProgressTrack");
  const nogoLabel = document.getElementById("nogoProgressLabel");
  const banner = document.getElementById("nogoBanner");
  if (!bestFill || !nogoFill || !bestLabel || !nogoLabel) return;

  const a = lastChecklistAnalysis;
  if (!a?.best?.length) {
    bestFill.style.width = "0%";
    bestLabel.textContent = "";
    nogoFill.style.width = "0%";
    nogoFill.classList.remove("has-risk");
    nogoLabel.textContent = "";
    if (banner) banner.hidden = true;
    return;
  }

  /** Leerer Entwurf: alle Zeilen sind „k. A.“ — sonst würde `na` fälschlich ~35 % Best-Deckung ergeben */
  const hasText = Boolean(a.context?.t?.length);
  if (!hasText) {
    bestFill.style.width = "0%";
    bestLabel.textContent = "Noch kein Text — Balken folgt dem ersten Zeichen.";
    nogoFill.style.width = "0%";
    nogoFill.classList.remove("has-risk");
    nogoLabel.textContent = "Noch kein Text.";
    if (banner) banner.hidden = true;
    if (bestTrack) {
      bestTrack.setAttribute("aria-valuenow", "0");
      bestTrack.setAttribute("aria-valuetext", bestLabel.textContent);
    }
    if (nogoTrack) {
      nogoTrack.setAttribute("aria-valuenow", "0");
      nogoTrack.setAttribute("aria-valuetext", nogoLabel.textContent);
    }
    return;
  }

  const bestPts = a.best.reduce((s, it) => {
    if (it.signal === "pass") return s + 1;
    if (it.signal === "hint") return s + 0.58;
    if (it.signal === "warn") return s + 0.22;
    if (it.signal === "na") return s + 0.35;
    return s;
  }, 0);
  const bestPct = (bestPts / a.best.length) * 100;
  bestFill.style.width = `${bestPct}%`;
  bestLabel.textContent = `Deckung ~${Math.round(bestPct)}% (Best Practices, heuristisch)`;
  if (bestTrack) {
    bestTrack.setAttribute("aria-valuenow", String(Math.round(bestPct)));
    bestTrack.setAttribute("aria-valuetext", bestLabel.textContent);
  }

  const riskN = a.nogo.filter((it) => it.signal === "risk").length;
  const warnN = a.nogo.filter((it) => it.signal === "warn").length;
  const safety = a.nogo.reduce((s, it) => {
    if (it.signal === "risk") return s + 0;
    if (it.signal === "warn") return s + 0.42;
    if (it.signal === "pass") return s + 1;
    if (it.signal === "hint") return s + 0.72;
    if (it.signal === "na") return s + 0.88;
    return s;
  }, 0);
  const nPct = (safety / a.nogo.length) * 100;
  nogoFill.style.width = `${nPct}%`;
  nogoFill.classList.toggle("has-risk", riskN > 0);
  nogoLabel.textContent = riskN
    ? `${riskN} Risiko${riskN > 1 ? "e" : ""}${warnN ? `, ${warnN} Achtung` : ""}`
    : warnN
      ? `${warnN} Achtung — kein harter Risiko-Treffer`
      : "Kein Risiko-Signal in der Heuristik";
  if (nogoTrack) {
    nogoTrack.setAttribute("aria-valuenow", String(Math.round(nPct)));
    nogoTrack.setAttribute("aria-valuetext", nogoLabel.textContent);
  }
  if (banner) banner.hidden = riskN === 0;
}

function renderChecklistRow(item, title) {
  const sig = item?.signal || "na";
  const sup = item ? AUTO_SUPPORT_LABEL[item.autoSupport] || item.autoSupport : "";
  const detail = item?.detail || "—";
  return `<li class="check-result sig-${sig}" role="status">
    <span class="check-band">${escapeHtml(checklistSignalLabel(sig))}</span>
    <div class="check-title">${escapeHtml(title)}</div>
    <p class="check-detail">${escapeHtml(detail)}</p>
    ${sup ? `<p class="check-support">${escapeHtml(sup)}</p>` : ""}
  </li>`;
}

function renderChecklists() {
  const bestList = document.getElementById("bestList");
  const nogoList = document.getElementById("nogoList");
  if (!bestList || !nogoList) return;

  const a = lastChecklistAnalysis;

  bestList.innerHTML = BEST_ITEMS.map((title, i) => renderChecklistRow(a?.best[i], title)).join("");

  nogoList.innerHTML = NOGO_ITEMS.map((title, i) => renderChecklistRow(a?.nogo[i], title)).join("");

  renderChecklistProgress();
}

function analyzeReadability(text) {
  const t = text.trim();
  if (!t) {
    return "<strong>Noch leer.</strong> Sobald du schreibst, erscheinen Kennzahlen.";
  }
  const words = t.split(/\s+/).filter(Boolean);
  const wc = words.length;
  const sents = sentences(t);
  const sc = Math.max(1, sents.length);
  const avgWords = (wc / sc).toFixed(1);
  const paras = t.split(/\n\s*\n/).filter((p) => p.trim()).length;
  const hashtags = (t.match(/#[\p{L}\p{N}_]+/gu) || []).length;
  const minutes = Math.ceil(wc / 180);
  const longSent = sents.filter((s) => s.split(/\s+/).length > 35).length;
  const parts = [
    `<strong>${wc}</strong> Wörter · ~<strong>${minutes}</strong> Min. Vorlesezeit (ca. 180 Wörter/Min.)`,
    `Sätze (grob): <strong>${sc}</strong> · Ø Wörter/Satz: <strong>${avgWords}</strong>`,
    `Absätze (Leerzeile getrennt): <strong>${paras}</strong> · Hashtags: <strong>${hashtags}</strong>`,
  ];
  if (longSent > 0) {
    parts.push(`<span class="warn">${longSent} sehr lange(r) Satz/Sätze — ggf. kürzen für Mobile.</span>`);
  }
  return parts.join("<br>");
}

function refresh() {
  const raw = draft?.value ?? "";
  const t = raw;

  renderDraftStats(raw);
  const kind = renderKindRecommendation(t);
  lastChecklistAnalysis = runChecklistAnalysis(raw, kind.primaryKey ?? null);
  const hints = buildStolperHints(raw);

  if (raw.trim()) renderInsightStream(buildSignalStream(raw, kind, lastChecklistAnalysis, hints));
  else renderInsightStream([]);

  updateFeedPreviewSection(raw, kind.primaryKey);

  readMetrics.innerHTML = analyzeReadability(raw);
  renderHints(hints);
  void updateNlpPanel(raw);

  renderChecklists();
  renderLivePreview(raw);
}

async function copyField(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const text = el.tagName === "TEXTAREA" || el.tagName === "INPUT" ? el.value : (el.textContent ?? "");
  if (!String(text).trim()) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    if (typeof el.select === "function") el.select();
    document.execCommand("copy");
  }
}

function wireCopyButtons() {
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", () => copyField(btn.getAttribute("data-copy")));
  });
}

draft?.addEventListener("input", refresh);
btnClear?.addEventListener("click", () => {
  if (draft) draft.value = "";
  refresh();
});

wireCopyButtons();
refresh();
