/**
 * AP8: zentrale Fallback-Copy (DE). V1 minimal; Regeln liefern weiterhin ihre
 * eigenen Texte, können aber hier standardisiert überschrieben werden.
 */

/** @type {Record<string, Partial<import('../domain/recommendation-types.js').RuleResult>>} */
export const COPY_DE_OVERRIDES = {
  "baseline.empty_text": {
    title: "Text fehlt",
    message: "Ohne Text können keine sinnvollen Hebel ermittelt werden.",
    action: "Füge 2-3 Sätze ein und starte die Analyse erneut.",
  },
};
