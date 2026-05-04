/**
 * LinkedIn-Texthelfer: Orchestrierung — Logik in Modulen, hier nur DOM & Ablauf.
 */

import {
  runChecklistAnalysis,
  BEST_ITEMS,
  NOGO_ITEMS,
  AUTO_SUPPORT_LABEL,
} from "./checklist-engine.js";
import { DRAFT_MAX, REF_FEED, REF_INVITE, FIRST_LINE_SOFT, FIRST_LINE_WARN } from "./constants.js";
import { KIND, KIND_ORDER, deriveKind } from "./kind.js";
import { updateNlpPanel } from "./nlp-panel.js";
import { renderLivePreview } from "./preview-render.js";
import { buildSignalStream, insightItemClass } from "./signal-stream.js";
import { buildStolperHints } from "./stolper.js";
import {
  escapeHtml,
  FEED_FOLD_CHARS,
  firstLine,
  firstParagraph,
  linkedInFeedTeaser,
  sentences,
} from "./text-utils.js";

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

function lenClass(n, soft, hard = soft) {
  if (n <= soft) return "ok";
  if (n <= hard) return "warn";
  return "err";
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

function renderHints(hints) {
  if (!styleHints) return;
  styleHints.innerHTML = hints
    .map((h) => `<li class="${h.level === "warn" ? "warn" : "info"}">${escapeHtml(h.text)}</li>`)
    .join("");
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
      const cls = insightItemClass(it.level);
      return `<li class="sig-${cls}">${escapeHtml(it.text)}</li>`;
    })
    .join("");
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

  renderDraftStats(raw);
  const kind = renderKindRecommendation(raw);
  lastChecklistAnalysis = runChecklistAnalysis(raw, kind.primaryKey ?? null);
  const hints = buildStolperHints(raw);

  if (raw.trim()) renderInsightStream(buildSignalStream(raw, kind, lastChecklistAnalysis, hints));
  else renderInsightStream([]);

  updateFeedPreviewSection(raw, kind.primaryKey);

  readMetrics.innerHTML = analyzeReadability(raw);
  renderHints(hints);
  void updateNlpPanel(raw, nlpInsightsEl);

  renderChecklists();
  renderLivePreview(raw, lastChecklistAnalysis);
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
