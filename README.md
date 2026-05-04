# LinkedIn-Texthelfer

Neuaufbau auf dem **Grundstock**: lokale Mini-App ohne Server-Logik (Thema war im PoC tragfähig).

## Schnellstart

```bash
./start.sh
```

Dann die angezeigte URL im Browser öffnen (ES-Module brauchen in der Regel `http://`, nicht `file://`).

## Archiv

Die vorherige monolithische Variante (Module, Fixtures, Snippet-Tests, Dump) liegt unter **`archive/`** unverändert als Referenz.

## Tests

```bash
node scripts/verify.mjs segmenter
node scripts/verify.mjs fallback
node scripts/verify.mjs feed-snippet
```

oder `npm test` (alle Dateien unter `tests/unit/`).

## Nächste Schritte

Siehe [`todo.md`](todo.md) und [`linkedin_texthelfer_architektur_zielbild.md`](linkedin_texthelfer_architektur_zielbild.md) (AP2 Surface Features).
