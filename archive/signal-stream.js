import { BEST_ITEMS, NOGO_ITEMS } from "./checklist-engine.js";
import { KIND } from "./kind.js";
import { linkedInFeedTeaser } from "./text-utils.js";

function streamTruncate(s, n) {
  const t = String(s || "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1)}…`;
}

function pushChecklistRows(rows, titles, signals, level, prefix, seen, out, maxDetail) {
  for (const sig of signals) {
    for (let i = 0; i < rows.length; i++) {
      const item = rows[i];
      if (item?.signal !== sig) continue;
      const text = `${prefix}${titles[i]} — ${streamTruncate(item.detail, maxDetail)}`;
      const k = text.slice(0, 96).toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ level, text });
    }
  }
}

/** Priorisierte Kurzliste: Eignung → No-Go → Best practice → Feed → Stil. */
export function buildSignalStream(raw, kind, a, stolperHints) {
  const t = raw.trim();
  if (!t || !kind?.primaryKey) return [];

  const out = [];
  const seen = new Set();
  const push = (level, text) => {
    const k = text.slice(0, 96).toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ level, text });
  };

  const pk = kind.primaryKey;
  const reasons = kind.reasons?.length ? kind.reasons.join("; ") : "Länge und Struktur";
  push("info", `Eignung: ${KIND[pk].label} — ${streamTruncate(reasons, 170)}`);

  if (a?.nogo?.length) {
    pushChecklistRows(a.nogo, NOGO_ITEMS, ["risk"], "risk", "No-Go: ", seen, out, 130);
    pushChecklistRows(a.nogo, NOGO_ITEMS, ["warn"], "warn", "No-Go: ", seen, out, 130);
  }

  if (a?.best?.length) {
    pushChecklistRows(a.best, BEST_ITEMS, ["warn"], "warn", "Best practice: ", seen, out, 130);
  }

  if (pk === "feed" || pk === "article") {
    const teaser = linkedInFeedTeaser(raw);
    if (teaser && teaser.length > 15) push("info", `Feed-Schnipsel (ca.): „${streamTruncate(teaser, 115)}“`);
  }

  for (const h of stolperHints) {
    if (h.level === "warn") push("warn", h.text);
  }

  if (a?.nogo?.length) {
    pushChecklistRows(a.nogo, NOGO_ITEMS, ["hint"], "info", "No-Go: ", seen, out, 120);
  }
  if (a?.best?.length) {
    pushChecklistRows(a.best, BEST_ITEMS, ["hint"], "info", "Best practice: ", seen, out, 120);
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

/** Nur für DOM — Signale als CSS-Klassen */
export function insightItemClass(level) {
  return level === "risk" ? "risk" : level === "warn" ? "warn" : "info";
}
