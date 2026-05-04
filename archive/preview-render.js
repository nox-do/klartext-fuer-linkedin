import { collectChecklistHighlightSpans } from "./checklist-engine.js";
import { BUZZ_PATTERNS } from "./stolper.js";
import { escapeHtml, firstLine } from "./text-utils.js";

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
export function linkedInFormatExample(raw) {
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

/** `analysis` = Ergebnis von `runChecklistAnalysis` (oder null). */
export function renderLivePreview(raw, analysis) {
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
  if (analysis) paintSpansToMask(mask, collectChecklistHighlightSpans(norm, analysis));
  paintBuzzToMask(norm, mask);
  rich.innerHTML = renderPreviewRich(norm, mask);
  fmt.value = linkedInFormatExample(raw);
}
