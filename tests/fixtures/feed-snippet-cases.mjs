/**
 * Regression-/Charakter-Tests für `resolveFeedFoldTeaser` (Feed-Schnipsel vor „Mehr“).
 * Referenz aus dem Archiv-PoC; Runner: `node scripts/verify-feed-snippet.mjs` oder `node scripts/verify.mjs feed-snippet`.
 *
 * Implementierung: `src/preview/feed-snippet-ranker.js` (AP6 verfeinert später die Anbindung an PostModel/FoldModel).
 */

/** @typedef {{ source?: string|string[], teaserMaxLen?: number, mustNotStartWith?: string, mustStartWith?: string, mustMatch?: RegExp, mustNotMatch?: RegExp, minTeaserLen?: number }} FeedSnippetExpect */

/**
 * @typedef {{ id: string, title: string, raw: string, expect: FeedSnippetExpect, notes?: string }} FeedSnippetCase
 */

/** Erster Absatz des PWA-/Cloud-Beispiels (wie im Feed gewertet); Rest des Beitrags absichtlich weggelassen — reicht für den Ranker. */
const PWA_FIRST_PARA_DRAFT = `Viele digitale Produkte starten heute mit der gleichen Annahme:
Cloud first, Account first, Daten zentralisieren – alles andere kommt später.
Security wird oft nachträglich ergänzt.

Am Ende entsteht häufig ein SaaS-Modell mit Abo – bei dem Nutzerbindung nicht nur über Produktqualität entsteht, sondern auch über Accounts, Datenbindung und Lock-in.

Ich wollte wissen, wie sich das anfühlt, wenn man es konsequent umdreht.

In den letzten Monaten habe ich eine Progressive Web App (PWA) gebaut, bei der "Offline-First" nicht Feature, sondern Ausgangspunkt der Architektur ist.`;

export const FEED_SNIPPET_CASES = /** @type {FeedSnippetCase[]} */ ([
  {
    id: "pwa-cloud-hook-not-opening-line",
    title: "PWA/Cloud-Beispiel: Feed-Schnipsel soll nicht stumpf Zeile 1 des Fließtexts sein",
    raw: PWA_FIRST_PARA_DRAFT,
    notes:
      "Erste sichtbare Zeile im Absatz ist Kontext; stärkerer Schnipsel liegt oft in Zeile 2 (Kontrast/Listen-Stil).",
    expect: {
      source: ["ranked", "ranked-weak"],
      mustNotStartWith: "Viele digitale Produkte",
      teaserMaxLen: 205,
      minTeaserLen: 24,
    },
  },
  {
    id: "german-blob-hook-second",
    title: "Langer DE-Block: späterer Satz darf vor dem Fold gewinnen",
    raw: "Hier ist ein sachlicher Einstieg ohne Hook-Signal. Doch der eigentliche Punkt: Warum verlieren Posts Reichweite — nicht wegen Algorithmus-Hass, sondern weil der Hook fehlt? Das messen wir.",
    expect: {
      mustStartWith: "Doch der eigentliche Punkt",
      mustNotStartWith: "Hier ist ein sachlicher",
      teaserMaxLen: 205,
      source: ["ranked", "ranked-weak"],
    },
  },
  {
    id: "empty-draft",
    title: "Leerer Text",
    raw: "   \n\n  ",
    expect: {
      teaserMaxLen: 0,
      minTeaserLen: 0,
      source: "fallback",
    },
  },
  {
    id: "single-strong-question-only",
    title: "Nur ein Absatz mit klarer Frage — soll ranked bleiben",
    raw: "Warum landen die besten Ideen selten im ersten Satz — und was ändert das für deinen nächsten Post?",
    expect: {
      source: ["ranked", "ranked-weak", "fallback"],
      mustMatch: /Warum landen/i,
      teaserMaxLen: 205,
    },
  },
]);
