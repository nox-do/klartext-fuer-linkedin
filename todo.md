# LinkedIn-Texthelfer — Neuaufbau

## Zweck

LinkedIn-Text als Eingabe, lokale Heuristiken & Hilfen — saubere Architektur neu strukturieren (nach PoC im Archiv).

## Backlog (priorisiert)

Kanone für Details: **`linkedin_texthelfer_architektur_zielbild.md` §5.6 — Nacharbeit SignalScores** (Tabelle P0–P2).

| Prio | Kurz |
|------|------|
| ~~**P0**~~ | ~~URL-`?`~~ — **erledigt:** `hasQuestionMarkOutsideHttpUrls` in `regex.js`, Surface + `cta` |
| **P1** | `language` nur durchgereicht; DE-first-Muster — EN/RU dokumentieren oder später lokalisieren |
| **P1** | AP4: `sentence_pair` vs. `sentence` für feine Evidence |
| **P2** | Gewichte bündeln (ähnlich `thresholds.js`); mehr Tests (URL+`?`, Paare, specificity, Risiko-Stapelung) |

## Änderungen

- **2026-05-05:** **Article-Pack Ausbau (technisch):** `src/rules/article.rules.js` um `article.too_many_threads`, `article.core_claim_needs_summary`, `article.closing_takeaway_missing` inkl. Guardrails erweitert; Golden Cases auf **42** (`gc37`–`gc42`) in `tests/fixtures/golden-recommendation-cases.mjs`; `verify.mjs golden` + `npm test` grün.
- **2026-05-05:** **Lektor-Nachzug AP10**: Regel-Copy in `src/rules/{baseline,feed,risk,invite,headline,article}.rules.js` auf respektvollere, handlungsleitende Sprache geschärft; `baseline.url_in_main_text` nur noch für frühe Links (Satz 1/2); Risk-Guardrail für distanzierte Negativbeispiele (`isDistancedContext`).
- **2026-05-05:** **AP10 Ausbau** Golden Cases: `tests/fixtures/golden-recommendation-cases.mjs` (**36 Fälle** inkl. DE/EN-Mix, Anti-FP/FN + Non-Default-Packs `invite/headline/article`), `tests/unit/golden-recommendations.test.js` (includes/excludes/top3 + Prefix-Checks inkl. Prefix-Excludes), `verify.mjs golden`, README-Testbefehl ergänzt.
- **2026-05-05:** **AP9** UI v1: `index.html` (Layout: Textarea, Top-3, Feed-Vorschau, einklappbare Details/Debug, Copy/Clear), `app.js` ruft `composeRecommendationsFromRaw` auf und rendert Modellfelder (`fold.bestSnippetText` etc.); Smoke `./start.sh`; Zielbild §10.0 / §14 / AP9.
- **2026-05-04:** **AP6** Feed-Snippet 2.0: `src/preview/feed-snippet.js` (segment-/signalbasiert), Integration über `resolve-fold-teaser.js` in `build-post-model.js`, `POST_MODEL_VERSION` 0.1.2, Tests `feed-snippet-postmodel.test.js`, Verify `feed-snippet-model`; Zielbild AP6/§10.0/§14 + README.
- **2026-05-04:** **AP8** Composer/Prioritizer: `src/recommendations/{compose,merge,prioritize,copy.de}.js`, `topicBucket`/`conflictsWith` in RuleResults, Empty-State bei leerem Text, `verify.mjs recommendations`, `tests/unit/compose-recommendations.test.js`; Zielbild AP8/§10.0/§14 + README.
- **2026-05-04:** **AP8 Guardrails (Review-Nachzug):** Priorizer-Auffüllrunde mit symmetrischem `conflictsWith` + Bucket-Prüfung (lieber `<3` als widersprüchlich), zusätzliche Regressionstests für Konflikte/Bucket-Policy.
- **2026-05-04:** **AP7** Rule Engine: `src/domain/recommendation-types.js`, `src/rules/run-rule-packs.js`, Packs `baseline/feed/risk` + Skeleton `invite/headline/article`, `verify.mjs rules`, `tests/unit/run-rule-packs.test.js`; Zielbild AP7/§10.0/§14 + README.
- **2026-05-04:** **Review AP4+AP5 abgearbeitet:** `kindConfidence` + Heuristik-Reihenfolge (invite vor headline); `topicDrift`/§5.9/§5.11/AP7-Beispiel im Zielbild; `role-and-structure-constants.js`, `resolve-fold-teaser.js`; lange Sätze in `risks` = `thresholds.js`; Tests erweitert; `POST_MODEL_VERSION` 0.1.1.
- **2026-05-04:** **Subagent-Review AP4+AP5** (Read-only): AP7-Grundlage ok; **P0** `kind` ohne Confidence (§5.9), `topicDrift` eher Längen-Proxy; **P1** Konstanten bündeln, AP6-Fold-Schnittstelle klar trennen; **P2** core→preview-Kopplung; Testlücken invite/fold/pairs/kurz/EN. Details in Chat.
- **2026-05-04:** **AP5** PostModel: `build-post-model.js`, `analyze-post.js`, Typen §5.8–5.11 in `types.js`, `verify.mjs post-model`, `tests/unit/analyze-post.test.js`; Zielbild §10.0 / §14 / AP5 / Ist-Liste; README.
- **2026-05-04:** **AP4** Rollen: `src/core/classify-roles.js`, Einbau `segment-document.js` (Positions-Kontext je Satz/Satzpaar), `verify.mjs roles`, `tests/unit/classify-roles.test.js`; Zielbild §10.0 / §14 / AP4 / Ist-Liste; README Verify.
- **2026-05-04:** **P0 Fix:** `hasQuestion` = `?` außerhalb `http(s):`-URLs (`hasQuestionMarkOutsideHttpUrls`), AP2 Surface + AP3 `cta`; Tests; Zielbild §5.5/§5.6/AP2/AP4; `types.js`-JSDoc.
- **2026-05-04:** Zielbild: §5.6 Review-Backlog-Tabelle + Verweise AP3/AP4/§10.0; `todo.md` Backlog-Sektion (Kanone §5.6).
- **2026-05-04:** **AP3 Subagent-Review** (Read-only): §5.6 Feldabdeckung + clamp ok; **P0** CTA/`hasQuestion` vs. URL-`?`; **P1** `language` ungenutzt, `sentence_pair`-Heuristik für AP4-Konsumenten; **P2** Magic Numbers, mehr Tests (URL, Paare, specificity); Web-Recherche für AP4-Übergang nicht nötig.
- **2026-05-04:** **AP3** Signal Scores: `src/utils/signal-patterns.js`, `extract-signal-scores.js`, Einbau in `segment-document.js`, Tests, `verify.mjs signals`.
- **2026-05-04:** AP2 Review-Nachzug: §5.5 + AP2 Hinweise (`hasQuestion`, `startsWeak` DE, `sentence_pair`-Spanne); `hasQuestionMark` in `regex.js`.
- **2026-05-04:** **AP2** Surface Features: `src/utils/regex.js`, `text-metrics.js`, `src/core/extract-surface-features.js`, `src/domain/thresholds.js`; Einbau in `segment-document.js`; `segment-stubs` → `emptySignalsAndRoles`; Tests `extract-surface-features.test.js`, `verify.mjs surface`.
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
