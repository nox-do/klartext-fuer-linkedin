# One-Pager: LinkedIn-Texthelfer

## Zweck

Nützliche Hilfe für LinkedIn-Nutzer **ohne** Developer-App, Login oder Server: **ein** Eingabefeld, daraus abgeleitete Eignung (Schlagzeile / Nachricht / Feed / Artikel), Lesbarkeit, NLP (compromise + sentiment), Checklisten. Zeigt, was statische Seiten lokal können.

## Änderungen

- **2026-05-04:** Refactoring: `text-utils.js` (gemeinsame Text-Hilfen), `constants.js`, `kind.js`, `stolper.js`, `signal-stream.js`, `preview-render.js`, `nlp-panel.js`; `checklist-engine` nutzt `text-utils` (kein Duplikat firstLine/firstParagraph mehr); `app.js` nur Orchestrierung.
- **2026-05-04:** Git-Repository initialisiert, Branch `main`, erster Commit (lokale Analyse-App).
- **2026-05-04:** Initiales Gerüst (OAuth-PoC) — verworfen.
- **2026-05-04:** `start.sh` — lokaler HTTP-Server.
- **2026-05-04:** Pivot: `index.html` + `app.js` = LinkedIn-Texthelfer + „One-Pager-Macht“-`<details>`.
- **2026-05-04:** Feed erste Zeile (Vorschau + Länge), Stolperfallen/Stil-Heuristiken (Buzzwords, CTA, Hashtags, Satzrhythmus, Einladung).
- **2026-05-04:** Checklisten nur noch automatisch (kein Tap, kein `sessionStorage`); Balken aus Heuristik-Scores; Banner bei Auto-`risk`.
- **2026-05-04:** Fortschrittsbalken bei leerem Text 0 % (vorher fälschlich ~35 % durch gewichtetes `na`).
- **2026-05-04:** Sektion „Struktur & Stimmung“: dynamischer Import von `compromise` + `sentiment` (esm.sh); Content-Density, AFINN-Tonality, Hook-Score (heuristisch + Snippet), Pattern (?, Emoji, Hashtags).
- **2026-05-04:** UI vereinfacht: nur `draft`-Textarea; Empfehlung aus Länge + Struktur + Einladungs-Signalen (`deriveKind`); drei Felder entfernt.
- **2026-05-04:** Feed-Vorschau nur bei Eignung Feed/Artikel; `linkedInFeedTeaser` (~200 Zeichen, 1. Absatz); Stil-Hinweis erste Zeile bezieht sich auf 1. Absatz.
- **2026-05-04:** `checklist-engine.js` — Checklisten-Heuristiken; UI: Karten mit Signal-Band + Unterstützungsgrad.
- **2026-05-04:** UI: Footer „One-Pager-Macht“ entfernt; ruhiger Einstieg (nur Textfeld). Bei Inhalt: Sektion „Was uns auffällt“ mit priorisierter `signalStream` (Eignung, No-Gos, Best-practice-Warnungen, Feed-Schnipsel, Stil). Volle Checklisten, NLP, Lesbarkeit, Eignungs-Chips und Feed-Box in `<details>` „Technische Details“.
- **2026-05-04:** Copy „Was uns auffällt“: Annahme LinkedIn-Kontext (Kontakt, Post, Artikel …), Ergebnis als Auffälligkeiten + Ideen, Abgrenzung „kein Urteil / mechanische Lesart“.
- **2026-05-04:** Vorschau unter „Was uns auffällt“: farbige Highlights (Checklist-Signale + Buzzwords als Hinweis), `collectChecklistHighlightSpans` in `checklist-engine.js`. LinkedIn-Beispiel: erste Zeile `**fett**`, Absätze; readonly-Feld + Kopieren.

## Lokal testen

```bash
./start.sh
```

Dann URL aus der Ausgabe öffnen. (Auch ohne Server: später alles in eine HTML-Datei inlinen.)

## Später

- Optional: gesamtes JS/CSS inline für Single-File-Hosting.
- Zeichenlimits an aktuelle LinkedIn-Hilfe anbinden, wenn ihr eine verlässliche Quelle habt.
