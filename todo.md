# LinkedIn-Texthelfer — Neuaufbau

## Zweck

LinkedIn-Text als Eingabe, lokale Heuristiken & Hilfen — saubere Architektur neu strukturieren (nach PoC im Archiv).

## Änderungen

- **2026-05-04:** Git-Commit `76056ae` — Neuaufbau AP0–AP1, Snippet unter `src/`, Zielbild (Stand vor AP2).
- **2026-05-04:** Zielbild: AP6/AP10-Testbefehle an Ist-Skripte angepasst; §9 Modulbaum repariert (ein Block) + Hinweise Skripte/`preview`.
- **2026-05-04:** Snippet-Ranker nach `src/preview/feed-snippet-ranker.js`, `FEED_FOLD_CHARS` → `src/domain/fold-constants.js`; Verify nur noch `src/`. `archive/feed-snippet-ranker.js` = Re-Export. Zielbild AP6 + §9/§10.0 angepasst.
- **2026-05-04:** Feed-Snippet-Referenz: `tests/fixtures/feed-snippet-cases.mjs`, `scripts/verify-feed-snippet.mjs`, `verify.mjs feed-snippet`.
- **2026-05-04:** Zielbild §9 / §10.0 / §14 / §17: Umsetzungsstand, Checkboxen AP0–AP1, nächster Schritt AP2, Tech-Stack festgehalten.
- **2026-05-04:** **AP1 Review-Findings:** `src/core/sentence-fallback.js` (testbarer Intl-Fallback), Intl-Pfad `startsWith(piece, cursor)` vor `indexOf`, Tests (`""`, Evidence für Satzpaare + Multiline), `tests/unit/sentence-fallback.test.js`, `verify.mjs fallback`, Zielbild AP1 „Zeilen“ präzisiert.
- **2026-05-04:** **AP1** umgesetzt: `src/core/normalize-text.js`, `src/core/segment-document.js` (`buildNormalizedDocument`), Domain-Stubs/Typen-JSDoc, `tests/unit/segment-document.test.js`, `scripts/verify.mjs segmenter`, `package.json` (`type: module`), `tests/fixtures/` angelegt.
- **2026-05-04:** `linkedin_texthelfer_architektur_zielbild.md` ergänzt: Nutzerwert (2.4), Zwei-Ebenen-Analyse (4.1), Signale vs. Rollen, PostKind-Unschärfe, Fold-Stub-Vertrag, Priorität/topicBucket, Fixtures nur unter `tests/fixtures/`, AP0/1/8/14/16/17 angepasst.
- **2026-05-04:** PoC nach `archive/` verschoben; Root = Grundstock (`start.sh`, `.gitignore`, `index.html`, `app.js`, README/todo). Neuaufbau offen.

## Lokal

```bash
./start.sh
```
