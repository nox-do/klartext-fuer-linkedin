# LinkedIn-Texthelfer

Lokale, **serverseitig leere** Mini-App: ein Textfeld, daraus Heuristiken für **LinkedIn-Kontext** (Eignung Schlagzeile / Nachricht / Feed / Artikel), Lesbarkeit, Checklisten, NLP-Hinweise (optional per CDN) und eine **Feed-Schnipsel**-Schätzung (~200 Zeichen, erster Absatz). Kein Login, keine Developer-App.

## Voraussetzungen

- **Browser** mit ES-Modulen und `Intl.Segmenter` (übliche aktuelle Desktop- und Mobile-Browser).
- Für lokales Öffnen per HTTP: **Python 3** (für `start.sh`). Ohne Server funktioniert `file://` je nach Browser/CORS für Modul-Imports oft nicht zuverlässig.

## Schnellstart

```bash
./start.sh
```

Die Ausgabe nennt eine URL (Standard: `http://127.0.0.1:8765/`). Diese im Browser öffnen.

## Feed-Snippet-Engine (Regression)

Die Logik für den sichtbaren Text vor „Mehr anzeigen“ steckt in `feed-snippet-ranker.js` und wird von `text-utils.js` (`linkedInFeedTeaser`) genutzt.

```bash
node scripts/verify-feed-snippet.mjs
```

Testfälle und Beispieltexte: `fixtures/feed-snippet-cases.mjs`.

## Projektstruktur (Kurz)

| Pfad | Rolle |
|------|--------|
| `index.html` | Markup, Styles, Shell |
| `app.js` | Orchestrierung, DOM |
| `constants.js` | Limits (z. B. `FEED_FOLD_CHARS`, `DRAFT_MAX`) |
| `text-utils.js` | Text-Hilfen, Feed-Teaser |
| `feed-snippet-ranker.js` | Kandidaten, Scoring, Fold |
| `kind.js` | Eignung / Kanal-Empfehlung |
| `signal-stream.js` | Priorisierte Hinweise („Was uns auffällt“) |
| `checklist-engine.js` | Checklisten + Highlights |
| `stolper.js` | Stil-/Stolperfallen |
| `nlp-panel.js` | compromise + sentiment (lazy) |
| `preview-render.js` | Live-Vorschau |
| `insights-narrator.js` | dynamischer Insights-Lead |
| `fixtures/` | Testdaten, Subagent-Prompt-Vorlage |
| `scripts/` | Node-Verifier ohne Browser |
| `todo.md` | Kurz-Changelog / interne Notizen |

## Subagent / externes LLM

Kriterien-Vorlage für eine **inhaltliche LinkedIn-Review** (ohne Tool-Anbindung im Repo): `fixtures/linkedin-post-review-for-subagent.md`.

## Hinweis

Alle Bewertungen sind **heuristisch** und ersetzen kein Lektorat und keine Rechts- oder Steuerberatung. Die Seite ist mit `noindex` markiert.

## Changelog

Kurz gehalten in [`todo.md`](todo.md).
