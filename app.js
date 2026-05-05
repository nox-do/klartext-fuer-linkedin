import { composeRecommendationsFromRaw } from "./src/recommendations/compose-recommendations.js";

const inputEl = document.getElementById("inputText");
const statusEl = document.getElementById("status");
const top3El = document.getElementById("top3");
const previewEl = document.getElementById("preview");
const detailsEl = document.getElementById("detailsList");
const debugEl = document.getElementById("debugOut");
const copyInputBtn = document.getElementById("copyInputBtn");
const copyTop3Btn = document.getElementById("copyTop3Btn");
const clearBtn = document.getElementById("clearBtn");

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
    top3El.innerHTML =
      '<div class="item"><h3>Noch nichts zu bewerten</h3><p class="muted">Füge mehr Text ein, dann erscheinen die wichtigsten Hebel.</p></div>';
    return;
  }

  for (const r of result.top) {
    const node = document.createElement("article");
    node.className = "item";
    const action = r.action ? `<p><strong>Aktion:</strong> ${r.action}</p>` : "";
    node.innerHTML = `
      <h3>${r.title}</h3>
      <p><span class="pill">${r.level}</span> <span class="pill">prio ${r.priority}</span></p>
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
  const fold = result.post.fold;
  previewEl.textContent =
    fold.bestSnippetText || "Keine Snippet-Vorschau verfügbar.";
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
    node.innerHTML = `
      <h3>${r.id}</h3>
      <p><span class="pill">${r.packId}</span> <span class="pill">${r.level}</span></p>
      <p>${r.title} — ${r.message}</p>
    `;
    detailsEl.appendChild(node);
  }
}

/**
 * @param {ReturnType<typeof composeRecommendationsFromRaw>} result
 */
function renderDebug(result) {
  if (!debugEl) return;
  debugEl.textContent = JSON.stringify(
    {
      meta: result.meta,
      kind: result.post.kind,
      kindConfidence: result.post.kindConfidence,
      fold: result.post.fold,
      structure: result.post.structure,
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

let lastResult = null;

function analyzeAndRender() {
  const raw = inputEl?.value ?? "";
  const result = composeRecommendationsFromRaw(raw, {
    selectedPacks: ["baseline", "feed", "risk"],
    analyzeOptions: { localeHint: "auto", includeDebug: true },
  });
  lastResult = result;
  renderTop3(result);
  renderPreview(result);
  renderDetails(result);
  renderDebug(result);
  if (statusEl) {
    statusEl.textContent = result.emptyState
      ? "Empty State aktiv."
      : `Analyse ok: ${result.top.length} Top-Hebel`;
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

if (clearBtn && inputEl) {
  clearBtn.addEventListener("click", () => {
    inputEl.value = "";
    analyzeAndRender();
  });
}

analyzeAndRender();
