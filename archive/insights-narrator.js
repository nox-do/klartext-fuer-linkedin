/**
 * Insights-Lead-Narrator — angelehnt an bb_pilot: Semantik getrennt, Copy deterministisch + Varianten-Seed.
 * Liefert nur feste deutsche Strings + escapte Konstanten (z. B. Eignungs-Label); kein Rohtext in HTML.
 */

import { KIND } from "./kind.js";
import { escapeHtml } from "./text-utils.js";

/** @typedef {'snippet'|'normal'|'long'} LengthBand */
/** @typedef {'urls'|'bait'|'heikel'|'long_tail'|'structure'|'hook'|'neutral'} Emphasis */
/** @typedef {'none'|'soft'|'firm'} Urgency */

/** Deterministischer Varianten-Index (wie pickVariantIndex in bb_pilot). */
export function pickVariantIndex(seed, variantCount) {
  if (variantCount <= 1 || !seed) return 0;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % variantCount;
}

function pick(seed, salt, variants) {
  const idx = pickVariantIndex(`${seed}::${salt}`, variants.length);
  return variants[idx];
}

/**
 * @param {string} raw
 * @param {ReturnType<import('./kind.js').deriveKind>} kind
 * @param {ReturnType<import('./checklist-engine.js').runChecklistAnalysis> | null} analysis
 */
export function buildInsightsLeadSemantics(raw, kind, analysis) {
  const t = raw.trim();
  if (!t) return null;

  const pk = kind.primaryKey || "feed";
  const L = t.length;
  const paras = t.split(/\n\s*\n/).filter((p) => p.trim()).length;
  const nogo = analysis?.nogo || [];
  const best = analysis?.best || [];
  const risks = nogo.filter((r) => r.signal === "risk").length;
  const warns = [...nogo, ...best].filter((r) => r.signal === "warn").length;

  /** @type {LengthBand} */
  let lengthBand = "normal";
  if (L < 90) lengthBand = "snippet";
  else if (L > 2800 || paras >= 4) lengthBand = "long";

  /** @type {Emphasis} */
  let emphasis = "neutral";
  if (nogo[0]?.signal === "risk") emphasis = "urls";
  else if (nogo[2]?.signal === "warn") emphasis = "bait";
  else if (nogo[4]?.signal === "risk") emphasis = "heikel";
  else if (best[3]?.signal === "warn" && L > 3000) emphasis = "long_tail";
  else if (best[1]?.signal === "warn") emphasis = "structure";
  else if (best[0]?.signal === "warn" || best[0]?.signal === "hint") emphasis = "hook";

  /** @type {Urgency} */
  let urgency = "none";
  if (risks > 0) urgency = "firm";
  else if (warns >= 3) urgency = "soft";

  return {
    schemaVersion: 1,
    kindPrimary: pk,
    lengthBand,
    emphasis,
    urgency,
    risks,
    warns,
  };
}

/**
 * @param {NonNullable<ReturnType<typeof buildInsightsLeadSemantics>>} sem
 * @param {string} raw — für Varianten-Seed
 * @returns {string} sicheres HTML (nur eigene Tags + escapte Labels)
 */
export function formatInsightsLeadHtml(sem, raw) {
  const seed = raw.trim().slice(0, 160);
  const kindLabel = escapeHtml(KIND[sem.kindPrimary]?.label || "Feed-Post");

  const openByKind = {
    headline: [
      `Kurz und wuchtig — wir ordnen das als <strong>${kindLabel}</strong> ein und achten auf Zeichenbudget und Zeilenumbrüche.`,
      `Sehr kompakter Text; für uns liest er sich am ehesten als <strong>${kindLabel}</strong>. Darunter prüfen wir Länge und Lesefluss.`,
      `Wenig Raum, viel Aussage: Heuristik sagt <strong>${kindLabel}</strong>. Wir schauen, ob die Zeile für den Kontext reicht.`,
    ],
    invite: [
      `Persönliche Ansprache und Länge deuten für uns auf <strong>${kindLabel}</strong>. Darunter prüfen wir Tonfall und typische Stolpersteine.`,
      `Das wirkt wie eine gezielte Nachricht — <strong>${kindLabel}</strong>. Wir sortieren Hinweise so, dass du sie schnell gegenlesen kannst.`,
      `Zwischen Einladung und Feed abgegrenzt: bei uns <strong>${kindLabel}</strong>. Die Liste darunter fasst Muster zusammen, nicht dein Thema.`,
    ],
    feed: [
      `Typischer LinkedIn-Fließtext — bei uns <strong>${kindLabel}</strong>. Schwerpunkt: erste Zeile vor dem Fold und scannbare Absätze.`,
      `Länge und Struktur passen bei uns am ehesten zu <strong>${kindLabel}</strong>. Darunter sammeln wir Auffälligkeiten und Ideen zum Gegencheck.`,
      `Wir lesen das als <strong>${kindLabel}</strong> und bewerten Hook, Absätze und typische No-Gos — alles nur im Browser, ohne Bewertung deines Inhalts.`,
    ],
    article: [
      `Längerer Beitrag — <strong>${kindLabel}</strong>. Wir achten besonders auf Absätze, Gesamtlänge und Stellen, an denen Leser:innen abspringen könnten.`,
      `Mehrteilige Struktur → für uns eher <strong>${kindLabel}</strong>. Die Hinweise darunter helfen beim Feinschliff, nicht beim inhaltlichen Urteil.`,
      `Viel Text, mehrere Blöcke: Heuristik <strong>${kindLabel}</strong>. Wir markieren Risiken und sanfte Warnungen, damit nichts untergeht.`,
    ],
  };

  const openPool = openByKind[sem.kindPrimary] || openByKind.feed;
  const opening = pick(seed, "open", openPool);

  const emphasisLines = {
    urls: [
      "Gerade springt uns eine <strong>http(s)-URL</strong> im Fließtext ins Auge — oft will LinkedIn den Link lieber in den ersten Kommentar.",
      "Mit <strong>Link im Hauptpost</strong> sind wir vorsichtig: das kann Reichweite und Klickverhalten beeinflussen — kurz prüfen.",
    ],
    bait: [
      "Auffällige <strong>Engagement-Formulierungen</strong> oder sehr viele Emojis hintereinander — wirkt schnell forciert; einmal bewusst gegenlesen.",
      "Wir sehen <strong>Bait-Muster</strong> im Sinne der Heuristik — nicht böse gemeint, aber für den Feed oft heikel.",
    ],
    heikel: [
      "Formulierungen nahe <strong>heiklen Versprechen</strong> (Finanz/Gesundheit) sind markiert — fachlich/rechtlich bitte selbst absichern.",
    ],
    long_tail: [
      "Der Text ist <strong>sehr lang</strong> für einen Hauptpost — erwäge, einen Teil in den ersten Kommentar zu legen (wenn das zu deiner Strategie passt).",
    ],
    structure: [
      "Ein Block sticht als <strong>sehr lang ohne Absatzpause</strong> hervor — mobil wird das schnell anstrengend.",
    ],
    hook: [
      "Die <strong>erste Zeile</strong> steht bei uns im Fokus — dort entscheidet sich viel für den Feed-Schnipsel vor „Mehr“.",
    ],
    neutral: [],
  };

  const bridgePool = emphasisLines[sem.emphasis] || [];
  const bridge = bridgePool.length ? pick(seed, "bridge", bridgePool) : "";

  const tail = {
    none: [
      "Kein Urteil über Thema oder Person — nur eine <strong>zweite, mechanische Lesart</strong>; keine Garantie.",
      "Das ist <strong>kein inhaltliches Feedback</strong>, sondern Mustererkennung im Browser — bitte immer mit gesundem Menschenverstand gegenprüfen.",
    ],
    soft: [
      "Ein paar <strong>Achtung</strong>-Signale — trotzdem kein Urteil über dich oder das Thema; nur Heuristik, <strong>ohne Garantie</strong>.",
      "Mehrere Warnpunkte: kurz durchgehen. <strong>Keine</strong> rechtliche oder CI-Freigabe — nur eine zweite Lesart.",
    ],
    firm: [
      "Mindestens ein <strong>Risiko</strong> nach unseren Regeln — bitte vor Veröffentlichung gegenprüfen. <strong>Kein</strong> Ersatz für juristische oder fachliche Review.",
      "Wir markieren ein <strong>harteres Signal</strong> — unbedingt kurz checken. Inhalt und Person bewerten wir nicht; das ist nur Technik-Heuristik.",
    ],
  };

  const closing = pick(seed, "tail", tail[sem.urgency] || tail.none);

  /** Sehr kurzer Entwurf ohne harte Signale: kompakter Einstieg. Bei Risiko/Warnungen lieber voller Kontext. */
  if (sem.lengthBand === "snippet" && sem.risks === 0 && sem.warns < 2) {
    const short = [
      `Noch kurz — wir ordnen das vorläufig als <strong>${kindLabel}</strong> ein. Sobald mehr Text da ist, werden die Hinweise konkreter.`,
      `Erster Eindruck: <strong>${kindLabel}</strong>. Die Liste füllt sich, sobald genug Kontext im Feld steht.`,
    ];
    const s = pick(seed, "snippet", short);
    return `${s} ${closing}`.replace(/\s+/g, " ").trim();
  }

  const parts = [opening];
  if (bridge) parts.push(bridge);
  parts.push(closing);
  return parts.join(" ");
}
