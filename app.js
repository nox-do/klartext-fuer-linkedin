import { composeRecommendationsFromRaw } from "./src/recommendations/compose-recommendations.js?v=20260505-3";

const inputEl = document.getElementById("inputText");
const statusEl = document.getElementById("status");
const top3El = document.getElementById("top3");
const previewEl = document.getElementById("preview");
const detailsEl = document.getElementById("detailsList");
const debugEl = document.getElementById("debugOut");
const copyInputBtn = document.getElementById("copyInputBtn");
const copyTop3Btn = document.getElementById("copyTop3Btn");
const copyPreviewBtn = document.getElementById("copyPreviewBtn");
const copyDebugBtn = document.getElementById("copyDebugBtn");
const clearBtn = document.getElementById("clearBtn");
const LEVEL_LABELS = {
  info: "Info",
  hint: "Hinweis",
  warn: "Warnung",
  risk: "Risiko",
};

/**
 * @param {string} text
 */
async function copyText(text) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    if (statusEl) statusEl.textContent = "Kopiert.";
  } catch {
    if (statusEl) statusEl.textContent = "Kopieren fehlgeschlagen.";
  }
}

/**
 * @param {ReturnType<typeof composeRecommendationsFromRaw>} result
 */
function renderTop3(result) {
  if (!top3El) return;
  top3El.innerHTML = "";
  if (result.emptyState) {
    const hasInput = Boolean(result.post?.normalized?.trim());
    const title = hasInput ? "Aktuell kein dringender Hebel" : "Noch nichts zu bewerten";
    const message = hasInput
      ? "Der Entwurf wirkt bereits stabil. Wenn du magst, pruefe Details/Debug fuer Feinschliff."
      : "Fuege mehr Text ein, dann erscheinen die wichtigsten Hebel.";
    top3El.innerHTML =
      `<div class="item"><h3>${title}</h3><p class="muted">${message}</p></div>`;
    return;
  }

  for (const r of result.top) {
    const node = document.createElement("article");
    node.className = "item";
    const action = r.action ? `<p><strong>Aktion:</strong> ${r.action}</p>` : "";
    const levelLabel = LEVEL_LABELS[r.level] ?? r.level;
    node.innerHTML = `
      <h3>${r.title}</h3>
      <p><span class="pill">${levelLabel}</span> <span class="pill">prio ${r.priority}</span></p>
      <p>${r.message}</p>
      ${action}
    `;
    top3El.appendChild(node);
  }
}

/**
 * @param {ReturnType<typeof composeRecommendationsFromRaw>} result
 */
function renderPreview(result) {
  if (!previewEl) return;
  const parts = previewParts(result);
  if (!parts.header) {
    previewEl.textContent = "Keine Snippet-Vorschau verfügbar.";
    return;
  }

  previewEl.innerHTML = "";
  const head = document.createElement("div");
  head.className = "preview-head";
  head.textContent = parts.header;
  previewEl.appendChild(head);

  if (parts.intro) {
    const intro = document.createElement("p");
    intro.className = "preview-intro";
    intro.textContent = parts.intro;
    previewEl.appendChild(intro);
  }
}

/**
 * @param {ReturnType<typeof composeRecommendationsFromRaw>} result
 */
function renderDetails(result) {
  if (!detailsEl) return;
  detailsEl.innerHTML = "";
  for (const r of result.details) {
    const node = document.createElement("article");
    node.className = "item";
    const action = r.action ? `<p><strong>Aktion:</strong> ${r.action}</p>` : "";
    const levelLabel = LEVEL_LABELS[r.level] ?? r.level;
    node.innerHTML = `
      <h3>${r.title}</h3>
      <p><span class="pill">${levelLabel}</span></p>
      <p>${r.message}</p>
      ${action}
    `;
    detailsEl.appendChild(node);
  }
}

/**
 * @param {ReturnType<typeof composeRecommendationsFromRaw>} result
 */
function renderDebug(result) {
  if (!debugEl) return;
  const selectionTrace = result.selectionTrace ?? null;
  const notPicked = (selectionTrace?.decisions ?? []).filter((d) => !d.picked);
  const blockedSummary = notPicked.slice(0, 8).map((d) => ({
    id: d.id,
    reason: d.reason,
    score: d.score,
    bucket: d.bucket,
  }));
  debugEl.textContent = JSON.stringify(
    {
      meta: result.meta,
      kind: result.post.kind,
      kindConfidence: result.post.kindConfidence,
      fold: result.post.fold,
      structure: result.post.structure,
      selectionSummary: {
        topIds: result.top.map((r) => r.id),
        blockedCount: notPicked.length,
        blockedSample: blockedSummary,
      },
      selectionTrace,
    },
    null,
    2,
  );
}

/**
 * @param {ReturnType<typeof composeRecommendationsFromRaw>} result
 */
function top3AsText(result) {
  if (!result.top.length) return "Keine Top-3 verfügbar.";
  return result.top
    .map(
      (r, i) =>
        `${i + 1}. ${r.title}\nWarum: ${r.message}\nAktion: ${r.action ?? "-"}\n`,
    )
    .join("\n");
}

/**
 * @param {ReturnType<typeof composeRecommendationsFromRaw>} result
 */
function previewAsText(result) {
  const parts = previewParts(result);
  if (!parts.header) return "Keine Snippet-Vorschau verfügbar.";
  return parts.intro ? `${parts.header}\n\n${parts.intro}` : parts.header;
}

/**
 * @param {string} s
 * @param {number} maxLen
 */
function trimEllipsis(s, maxLen) {
  const t = (s ?? "").trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`;
}

/**
 * @param {ReturnType<typeof composeRecommendationsFromRaw>} result
 */
function previewParts(result) {
  const fold = result.post.fold ?? {};
  const header = (fold.firstLine || fold.bestSnippetText || "").trim();
  if (result.post.kind !== "article") {
    return { header };
  }

  const paragraphs = (result.post.paragraphs ?? [])
    .map((p) => (p.text ?? "").trim())
    .filter(Boolean);

  let introSource =
    paragraphs.find((p, i) => i > 0 && p !== header) ||
    paragraphs.find((p) => p !== header) ||
    "";

  if (!introSource) {
    const sentenceTexts = (result.post.segments ?? [])
      .filter((s) => s.type === "sentence")
      .map((s) => (s.text ?? "").trim())
      .filter((t) => t && t !== header);
    introSource = sentenceTexts.slice(0, 2).join(" ");
  }

  const intro = trimEllipsis(introSource, 380);
  return { header, intro };
}

let lastResult = null;

function analyzeAndRender() {
  const raw = inputEl?.value ?? "";
  const result = composeRecommendationsFromRaw(raw, {
    // In der UI immer alle vorhandenen Packs laufen lassen;
    // die Pack-Runner filtern intern ueber post.kind/kindConfidence.
    selectedPacks: ["baseline", "feed", "risk", "article", "headline", "invite"],
    analyzeOptions: { localeHint: "auto", includeDebug: true },
  });
  lastResult = result;
  renderTop3(result);
  renderPreview(result);
  renderDetails(result);
  renderDebug(result);
  if (statusEl) {
    if (!result.post?.normalized?.trim()) {
      statusEl.textContent = "Empty State aktiv.";
    } else if (result.top.length === 0) {
      statusEl.textContent = "Analyse ok: kein dringender Hebel gefunden.";
    } else {
      statusEl.textContent = `Analyse ok: ${result.top.length} Top-Hebel`;
    }
  }
}

if (inputEl) {
  inputEl.addEventListener("input", analyzeAndRender);
}

if (copyInputBtn) {
  copyInputBtn.addEventListener("click", () => copyText(inputEl?.value ?? ""));
}

if (copyTop3Btn) {
  copyTop3Btn.addEventListener("click", () => {
    if (!lastResult) return;
    copyText(top3AsText(lastResult));
  });
}

if (copyPreviewBtn) {
  copyPreviewBtn.addEventListener("click", () => {
    if (!lastResult) return;
    copyText(previewAsText(lastResult));
  });
}

if (copyDebugBtn) {
  copyDebugBtn.addEventListener("click", () => {
    copyText(debugEl?.textContent ?? "");
  });
}

if (clearBtn && inputEl) {
  clearBtn.addEventListener("click", () => {
    inputEl.value = "";
    analyzeAndRender();
  });
}

analyzeAndRender();
