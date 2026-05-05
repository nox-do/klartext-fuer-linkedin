# LinkedIn-Texthelfer — Architektur- und Zieldokument

## 1. Ausgangslage

Der bisherige Prototyp hat gezeigt, dass ein lokaler LinkedIn-Texthelfer ohne Login, ohne LinkedIn-Developer-App und ohne serverseitige Verarbeitung sinnvoll machbar ist. Die bisherigen Projektdateien werden archiviert. Das neue Projekt startet bewusst mit einem klaren Zielbild, einer sauberen Architektur und testbaren Arbeitspaketen.

Die alte Version hatte bereits wertvolle Bausteine:

- lokale Mini-App mit einem Eingabefeld
- Eignungsschätzung für Headline, Kontaktanfrage, Feed-Post und Artikel
- Lesbarkeitsmetriken
- Feed-Snippet-Schätzung vor „Mehr anzeigen“
- Checklisten für Best Practices und No-Gos
- Stolperfallen- und Stilhinweise
- optionales NLP-Panel
- Regressionstests für die Feed-Snippet-Engine

Der neue Ansatz soll diese Erfahrungen systematisch in eine robuste Engine überführen.

---

## 2. Zielbild

Der LinkedIn-Texthelfer soll Nutzerinnen und Nutzern helfen, aus einem eingegebenen Entwurf bessere LinkedIn-Texte zu machen. Der Fokus liegt nicht auf generischer Textkorrektur, sondern auf LinkedIn-relevanter Kommunikationswirkung.

Die Engine soll nicht primär sagen:

> „Dein Text erfüllt 73 % der Best Practices.“

Sondern:

> „Hier sind die drei wichtigsten Änderungen, die deinen Beitrag wahrscheinlich stärker machen — mit Belegstelle im Text.“

### 2.1 Produktversprechen

Ein lokaler Redaktionsassistent, der LinkedIn-Entwürfe analysiert und konkrete, nachvollziehbare Hinweise zu Hook, Struktur, These, Nutzen, Lesbarkeit, CTA und Risiken gibt.

### 2.2 Kernnutzen für User

Der User soll nach der Analyse wissen:

1. Was ist der größte Hebel im Text?
2. Welche Textstelle ist betroffen?
3. Warum ist das relevant?
4. Was sollte er konkret ändern?
5. Welche Risiken oder Missverständnisse sollte er prüfen?

### 2.3 Leitprinzipien

1. **Local first**  
   Der Text bleibt im Browser. Keine serverseitige Verarbeitung im Kernprodukt.

2. **Explainable by design**  
   Jede Empfehlung braucht eine Belegstelle, eine Regel-ID und eine nachvollziehbare Begründung.

3. **Heuristik zuerst, KI optional später**  
   Die erste Version basiert auf Regeln, Scores und semantischen Rollen. ML oder TensorFlow können später zusätzliche Signale liefern, dürfen aber nicht Voraussetzung für den Produktnutzen sein.

4. **Top-3 statt Hinweisflut**  
   Die Engine priorisiert. Details bleiben sichtbar, aber nicht dominant.

5. **Kontextabhängig statt generisch**  
   Feed-Post, Artikel, Kontaktanfrage und Headline brauchen unterschiedliche Regeln.

6. **Testbar statt geschmacklich**  
   Die Engine wird mit Fixtures, Golden Cases und Regressionstests entwickelt.

### 2.4 Nutzerwert: „echte“ Unterstützung statt Feature-Liste

Umsetzbar heißt: Jede sichtbare Ausgabe muss dem Autor **einen nächsten Schritt** geben (was prüfen, was verschieben, was ergänzen) — nicht nur ein Label. Die Messlatte für Version 1:

- **Handlungsleitend:** Jede der Top-Empfehlungen hat eine **konkrete Mini-Aktion** (ein Satz reicht), keine leeren Appelle („Hook stärken“ ohne Ort).
- **Nachvollziehbar:** Belegstelle oder klarer Bezug (Absatz/Segment), damit der Nutzer nicht raten muss.
- **LinkedIn-tauglich:** Hinweise beziehen sich auf Feed-Fold, Diskussionsrahmen, Einladung — nicht auf allgemeine Rechtschreibung.
- **Ehrlich bei Grenzen:** Heuristische Formulierungen („wirkt“, „könnte“, „prüfe“), keine Reichweiten-Garantien.

Technische Architektur (PostModel, Regelpakete, Tests) dient **diesem** Nutzerergebnis; sie steht nicht als Selbstzweck da.

---

## 3. Nicht-Ziele

Die erste ernsthafte Version soll bewusst begrenzt bleiben.

Nicht-Ziele für Version 1:

- keine automatische Neufassung ganzer Beiträge
- kein Posten auf LinkedIn
- kein LinkedIn-Login
- keine LinkedIn-API
- keine Performance-Vorhersage im Sinne von „dieser Post erreicht X Impressionen“
- keine Rechts-, Steuer-, Finanz- oder Gesundheitsberatung
- keine vollständige semantische Inhaltsprüfung
- keine serverseitige Speicherung von Texten
- keine KI-Abhängigkeit

Optional später möglich:

- lokale Embeddings
- eigenes Klassifikationsmodell
- Import historischer eigener Beiträge
- Stilprofile
- Performance-Kalibrierung mit manuell eingegebenen LinkedIn-Kennzahlen

---

## 4. Zielarchitektur

Die neue Architektur trennt Analyse, Semantik, Regeln, Empfehlung und Darstellung.

```text
Raw Text
  ↓
Normalizer
  ↓
Document Segmenter
  ↓
Feature Extractor
  ↓
Role Classifier
  ↓
Post Model Builder
  ↓
Rule Packs
  ↓
Recommendation Composer
  ↓
Prioritizer
  ↓
UI Renderer
```

Der zentrale Architekturwechsel ist:

```text
Alt:
Text → einzelne Heuristikmodule → UI-Hinweise

Neu:
Text → semantisches Beitragsmodell → Regelpakete → priorisierte Empfehlungen → UI
```

### 4.1 Analyse in zwei Ebenen (Segment vs. Dokument)

Das Schaubild oben ist eine **logische** Reihenfolge, keine starre „alles fertig nach einem Durchlauf“-Pflicht. Praktisch gibt es zwei Ebenen:

1. **Segmentebene:** Absätze, Sätze/Zeilen, Kandidatenpaare; Oberflächenmerkmale; Signal-Scores; Rollen-Scores **pro Segment**.
2. **Dokumentebene:** Aggregation zu `StructureModel`, Dokument-Metriken, Topic-Drift, „These zu spät“, CTA-Stärke **über den ganzen Text**, Fold/Snippet-Kandidaten über mehrere Segmente.

`PostModel` entsteht erst, wenn **beide** Ebenen zusammengeführt sind (`build-post-model` / `analyze-post`). Regeln wie „These zu spät“ oder „zu viele Themen“ arbeiten bewusst auf **Dokument**-Feldern, nicht auf einem einzelnen Satz-Score allein.

---

## 5. Ziel-Datenmodell

### 5.1 RawPost

```ts
type RawPost = {
  raw: string;
  createdAt?: string;
  localeHint?: 'de' | 'en' | 'ru' | 'auto';
};
```

### 5.2 NormalizedDocument

```ts
type NormalizedDocument = {
  raw: string;
  normalized: string;
  language: 'de' | 'en' | 'ru' | 'unknown';
  paragraphs: Paragraph[];
  metrics: DocumentMetrics;
};
```

### 5.3 Paragraph

```ts
type Paragraph = {
  id: string;
  index: number;
  text: string;
  charStart: number;
  charEnd: number;
  sentences: Segment[];
};
```

### 5.4 Segment

Ein Segment ist die kleinste fachlich bewertete Einheit. In der Regel ist es ein Satz, kann aber auch eine erste Zeile, ein Satzpaar oder eine Listenzeile sein.

```ts
type Segment = {
  id: string;
  type: 'sentence' | 'line' | 'sentence_pair' | 'list_item';
  text: string;
  paragraphIndex: number;
  sentenceIndex?: number;
  charStart: number;
  charEnd: number;
  surface: SurfaceFeatures;
  signals: SignalScores;
  roles: RoleScores;
};
```

### 5.5 SurfaceFeatures

```ts
type SurfaceFeatures = {
  length: number;
  wordCount: number;
  commaCount: number;
  hasQuestion: boolean;
  hasNumber: boolean;
  hasUrl: boolean;
  hasHashtag: boolean;
  hasEmojiRun: boolean;
  startsWeak: boolean;
  isAllCaps: boolean;
};
```

**Lesen von `SurfaceFeatures` (Präzisierung):**

- **`hasQuestion`:** „mindestens ein `?` **außerhalb** von **`http:`/`https:`-URL-Spannen**“ (wie `RE_URL` in `regex.js`); reine **Querystrings in Links** zählen **nicht**. Scheme-lose Links (`www.…`) werden nicht gestrippt — seltener; bei Bedarf später erweitern.
- **`startsWeak`:** **deutschsprachige** Opener-Liste; bei `language !== 'de'` kann das Feld irreführend oder leer wirken, bis lokalisierte Listen ergänzt sind.
- **`sentence_pair`-Segmente:** alle Felder beziehen sich auf die **kombinierte Textspanne** (zwei Sätze zusammen), nicht auf einen der beiden Sätze einzeln — satzgenaue Evidence nutzt Typ `sentence`.

### 5.6 SignalScores

Signale sind beobachtbare Oberflächen- oder Mustermerkmale. Sie sind noch keine Empfehlung.

```ts
type SignalScores = {
  contrast: number;
  pain: number;
  benefit: number;
  personal: number;
  specificity: number;
  risk: number;
  cta: number;
  proof: number;
  example: number;
  buzzword: number;
};
```

**Nacharbeit SignalScores (Review-Backlog, Stand 2026-05-04):** AP3 ist umgesetzt; die Punkte unten sind **festgehalten**, damit spätere Kalibrierung nichts Wesentliches „vergisst“. ~~P0 URL/`cta`~~ ist per `hasQuestionMarkOutsideHttpUrls` erledigt (§5.5).

| Prio | Thema | Kurz |
|------|--------|------|
| ~~**P0**~~ | ~~`cta` vs. URL-`?`~~ | **Erledigt:** `hasQuestion` nutzt `hasQuestionMarkOutsideHttpUrls` (`regex.js`); **`cta`** startet nicht mehr durch URL-Query allein. |
| **P1** | `language` | `extractSignalScores(..., language)` ist Platzhalter; Muster **DE-first**. Bei EN/RU: dokumentierte Einschränkung oder spätere Lokalisierung, sonst driftende Rollen. |
| **P1** | `sentence_pair` | Alle Surface-/Signal-Felder auf **kombinierte Spanne** (§5.5). Für satzgenaue Evidence **`sentence`** bevorzugen; AP4 typ-sensitiv bleiben. |
| **P2** | Kalibrierung | Gewichte/Schwellen verteilt in `extract-signal-scores.js` — bei Tunen ggf. Richtung **`thresholds.js`** oder eigene Konstantendatei bündeln. |
| **P2** | Tests | Ergänzen u. a.: Text mit URL + `?`, **`sentence_pair`** vs. zwei Einzelsätze, **`specificity`** mit/ohne URL/Zahl, Stapelung Risiko-Keywords. |

### 5.7 RoleScores

Rollen beschreiben die rhetorische Funktion eines Segments.

```ts
type RoleScores = {
  hook: number;
  context: number;
  thesis: number;
  problem: number;
  benefit: number;
  example: number;
  proof: number;
  transition: number;
  cta: number;
  risk: number;
  filler: number;
};
```

### Signale vs. Rollen — Konvention (eine fachliche Wahrheit)

`SignalScores` und `RoleScores` nutzen teils ähnliche Begriffe (z. B. Nutzen, CTA, Risiko). Um **Doppellogik und driftende Schwellen** zu vermeiden:

- **Signale** = direkt aus Oberfläche/Muster ableitbare Scores (0–1), erklärbar, segmentbezogen.
- **Rollen** = rhetorische Deutung, **abgeleitet** aus Signalen, Position, Segmenttyp und ggf. sehr lokalem Kontext (Nachbarsegment).
- **Regelpakete (V1)** lesen vorzugsweise **`StructureModel`**, **`FoldModel`**, dokumentweite Metriken und **Rollen** — nicht frei einzelne Roh-Signale. Ausnahmen nur in Baseline/Risk mit kurzer Begründung im Code.

So bleiben Regeln konsistent testbar; Signal-Debugging bleibt optional (z. B. Debug-Panel).

### 5.8 PostModel

```ts
type PostModel = {
  id: string;
  kind: PostKind;
  /** 0–1: Zuverlässigkeit der `kind`-Zuordnung; niedrig bei kurzen/mehrdeutigen Texten ohne Nutzer-Kontext (§5.9). */
  kindConfidence: number;
  language: string;
  raw: string;
  normalized: string;
  metrics: DocumentMetrics;
  paragraphs: Paragraph[];
  segments: Segment[];
  fold: FoldModel;
  structure: StructureModel;
  risks: RiskFinding[];
  version: string;
};
```

### 5.9 PostKind

```ts
type PostKind =
  | 'headline'
  | 'invite'
  | 'feed'
  | 'article'
  | 'unknown';
```

**PostKind — Unschärfe:** Kurze Texte sind oft **mehrdeutig** (Headline vs. Einladung vs. Kurz-Feed). Für echte Nutzerunterstützung gilt mindestens eines:

- **Variante A:** Nutzer wählt Kontext (Tabs oder Dropdown: Feed / Artikel / Einladung / Headline) — Engine nutzt das als Primär-`kind`.
- **Variante B:** Modell liefert `kind` + `kindConfidence` und optional `kindAlternatives`; bei niedriger Sicherheit laufen **Baseline + Risk** immer, format-spezifische Packs nur bei klarer Zuordnung oder konservativ mit abgeschwächter Priorität.

Ohne eine dieser Varianten werden Feed-spezifische Regeln auf falschen Texttypen feuern — das untergräbt Vertrauen.

**Ist-Implementierung AP5:** Heuristik für `kind` + **`options.kind`** (Variante A). Reihenfolge der Regeln: `article` → **`invite`** (Keyword, kurz) → **`headline`** → **`feed`**, damit typische **Einladungen** nicht fälschlich als Headline landen. Zusätzlich **`kindConfidence`** (0–1): bei **niedriger** Sicherheit (typisch kurze Texte im generischen `feed`-Eimer) sollen **AP7** und UI **format-spezifische** Hinweise **zurückhaltend** oder gar nicht zeigen — Baseline/Risk genügt, um nichts zu „verschlimmbessern“. Bei **`options.kind`** vom Nutzer = 1.

### 5.10 FoldModel

```ts
type FoldModel = {
  approximateVisibleChars: number;
  firstLine: string;
  firstLineLength: number;
  firstParagraphLength: number;
  bestSnippetSegmentIds: string[];
  bestSnippetText: string;
  snippetSource: 'first_line' | 'ranked_segment' | 'fallback';
};
```

**API-Vertrag Fold / Snippet:** In frühen Arbeitspaketen dürfen `bestSnippetText` / `bestSnippetSegmentIds` **stub** sein (z. B. erste Zeile oder erster Absatz bis Fold-Länge). **AP6 (Feed-Snippet 2.0)** ersetzt oder füllt diese Felder deterministisch aus dem PostModel — ohne Rohtext parallel mitzuführen. Optional: explizite Hilfsfunktion `enrichFoldFromSegments(post)` statt implizitem „halbfertigem“ Modell.

**Ist-Stand Nahtstelle:** `src/core/resolve-fold-teaser.js` re-exportiert den Ranker-Stub; `build-post-model.js` importiert nur diese Datei — AP6 kann die Implementierung zentral austauschen.

Die sichtbare Zeichenzahl vor „Mehr“ bleibt **Annäherung** (Client, Schrift); Regeln dürfen nicht pixelgenau vom Fold abhängen.

### 5.11 StructureModel

```ts
type StructureModel = {
  hookStrength: number;
  thesisStrength: number;
  thesisPosition: number | null;
  problemStrength: number;
  benefitStrength: number;
  ctaStrength: number;
  scanability: number;
  substance: number;
  risk: number;
  topicDrift: 'low' | 'medium' | 'high' | 'unknown';
};
```

**`topicDrift` (Präzisierung):** Der Wert bildet in **AP5** eine **Satzanzahl-/Längen-Heuristik** (viele Sätze → höher), **keine** semantische „Themen-Zerstreuung“. Spätere echte Topic-Modelle könnten ein anderes Feld ergänzen; Regeln sollten dieses Feld nicht als inhaltlichen Drift interpretieren.

### 5.12 Recommendation

```ts
type Recommendation = {
  id: string;
  packId: string;
  ruleId: string;
  level: 'info' | 'hint' | 'warn' | 'risk';
  priority: number;
  title: string;
  message: string;
  action?: string;
  evidence?: EvidenceSpan[];
  tags: string[];
};
```

### 5.13 EvidenceSpan

```ts
type EvidenceSpan = {
  segmentId?: string;
  text: string;
  charStart: number;
  charEnd: number;
};
```

---

## 6. Semantische Rollen

Die Engine verwendet für Version 1 bewusst eine kleine Rollenmenge.

| Rolle | Bedeutung | Typische Signale |
|---|---|---|
| hook | Stoppt im Feed, öffnet Spannung | Frage, Kontrast, starke These, Schmerzpunkt |
| context | Liefert Hintergrund | „In den letzten Monaten…“, „Ausgangslage…“ |
| thesis | Hauptaussage / Standpunkt | „Das Problem ist…“, „Nicht X, sondern Y“ |
| problem | Schmerz oder Reibung | Aufwand, Risiko, Scheitern, Kontrollverlust |
| benefit | Nutzenversprechen | Überblick, weniger Aufwand, bessere Entscheidung |
| example | Beispiel / Mini-Case | „Zum Beispiel“, „bei mir“, konkrete Situation |
| proof | Beleg / Substanz | Zahl, Erfahrung, Ergebnis, Beobachtung |
| transition | Übergang | „Deshalb“, „Daraus folgt“ |
| cta | Anschluss für Leser | Frage, Kommentaraufforderung, Einladung |
| risk | missverständliche/heikle Stelle | Finanz-/Rechts-/Gesundheitsclaim, Drittdaten |
| filler | geringe Nutzlast | Floskel, Dopplung, vage Aussage |

---

## 7. Regelpakete

Regelpakete nutzen das PostModel. Sie greifen nicht direkt auf Rohtext zu, außer über definierte Evidence-Spans.

### 7.1 Baseline Pack

Gilt für alle Textarten.

Regeln:

- Text leer / zu kurz
- ungewöhnlich lange Sätze
- sehr lange Absätze
- URLs im Haupttext
- viele Hashtags
- Emoji-Ketten
- All-Caps-Eröffnung
- heikle Versprechen
- mögliche Drittdaten

### 7.2 Feed Pack

Gilt für LinkedIn-Feed-Posts.

Regeln:

- Hook sichtbar vor Fold
- stärkste These zu spät
- Nutzen erst zu spät sichtbar
- erster Absatz liefert nur Kontext
- Beitrag hat zu viele Themen
- CTA fehlt bei längeren Posts
- Produktnutzen ohne Problembezug
- provokanter Hook zieht falsche Diskussion an
- Feed-Snippet bildet Kern unfair ab

### 7.3 Article Pack

Gilt für LinkedIn-Artikel.

Regeln:

- Titel/erste Zeile unklar
- These fehlt im Einstieg
- Struktur ohne Zwischenüberschriften
- zu wenig roter Faden
- kein klarer Lesergewinn
- zu viel Produktlogik vor Problemklärung

### 7.4 Invite Pack

Gilt für Kontaktanfragen.

Regeln:

- zu lang
- kein persönlicher Bezug
- zu werblich
- unklarer Kontaktgrund
- CTA zu fordernd
- keine höfliche Anschlusslogik

### 7.5 Headline Pack

Gilt für Profil-Headlines.

Regeln:

- Rolle unklar
- Nutzen unklar
- zu viele Buzzwords
- keine Suchbegriffe
- zu generisch
- zu viele Claims ohne Fokus

### 7.6 Risk Pack

Querschnittlich.

Regeln:

- Finanzversprechen
- Gesundheitsversprechen
- Rechts-/Steuerkontext
- Kunden-/Kollegendaten
- aggressive Engagement-Baits
- missverständliche Provokation

---

## 8. Empfehlungsausgabe

Die UI soll nicht alle Rohsignale gleichwertig anzeigen. Der Hauptbereich zeigt die priorisierten Empfehlungen.

### 8.1 Hauptausgabe

Struktur:

```text
Die 3 größten Hebel

1. [Titel]
   Warum: [kurze Begründung]
   Beleg: „...“
   Aktion: [konkrete Mini-Idee]

2. ...
3. ...
```

### 8.2 Sekundärausgabe

Darunter optional:

- Feed-Vorschau
- Checklistenstatus
- Lesbarkeit
- Risiko-Hinweise
- technische Details
- Debug-Modell

### 8.3 Priorisierungslogik

Empfehlungen werden nach Priorität sortiert.

Prioritätsfaktoren:

- Einfluss auf Feed-Wirkung
- frühe Position im Text
- hohe Rollensicherheit
- Risiko-Level
- betroffene Textlänge
- Formatkontext
- Duplikatvermeidung

Beispiel:

```ts
priority =
  ruleBasePriority
  + evidenceConfidence
  + positionWeight
  + riskWeight
  + kindRelevance
  - duplicatePenalty;
```

**Operationalisierung:** Jede Regel deklariert in Metadaten mindestens `basePriority`, optional `topicBucket` (z. B. `hook`, `structure`, `cta`, `risk`, `readability`) und optional `conflictsWith: ruleId[]`. Der Prioritizer wählt pro Bucket höchstens eine Top-Empfehlung, bevor globale Tie-Breaker greifen — sonst ist „keine Widersprüche“ nicht implementierbar. `evidenceConfidence` ist in V1 meist **regelintern fest** (z. B. 1.0 bei zugeordnetem Segment, 0.5 bei nur Absatzbezug), nicht ein freischwebender ML-Wert.

---

## 9. Modulstruktur Zielprojekt

Vorschlag für eine klare Dateistruktur:

```text
src/
  app/
    main.js
    state.js

  core/
    normalize-text.js
    segment-document.js
    extract-surface-features.js
    extract-signal-scores.js
    classify-roles.js
    resolve-fold-teaser.js
    build-post-model.js
    analyze-post.js

  domain/
    fold-constants.js
    role-and-structure-constants.js
    thresholds.js
    kinds.js
    roles.js
    recommendation-types.js
    thresholds.js

  rules/
    baseline.rules.js
    feed.rules.js
    article.rules.js
    invite.rules.js
    headline.rules.js
    risk.rules.js
    run-rule-packs.js

  recommendations/
    compose-recommendations.js
    prioritize-recommendations.js
    merge-recommendations.js
    copy.de.js

  preview/
    feed-snippet-ranker.js
    feed-snippet.js
    highlight-spans.js

  ui/
    render-summary.js
    render-recommendations.js
    render-preview.js
    render-debug.js

  utils/
    escape-html.js
    regex.js
    signal-patterns.js
    text-metrics.js

tests/
  fixtures/
    feed-snippet-cases.mjs
    feed-posts.js
    articles.js
    invites.js
    headlines.js
    risk-cases.js
  unit/
  integration/
  regression/

scripts/
  verify.mjs
  verify-feed-snippet.mjs
  verify-recommendations.mjs
  dump-analysis.mjs
```

*Hinweis `preview/`:* `feed-snippet-ranker.js` bleibt als Regression/Raw-Fallback; **`feed-snippet.js`** ist mit AP6 aktiv für segment-/signalbasiertes Fold-Snippet aus dem PostModel.

*Hinweis `utils/`:* `regex.js`, `text-metrics.js` (AP2) und `signal-patterns.js` (AP3) sind umgesetzt; **`escape-html.js`** optional später (härtet `innerHTML` in der UI — aktuell lokales Tool, Engine liefert kontrollierte Strings).

*Hinweis Skripte:* Im Repo existieren derzeit **`verify.mjs`** und **`verify-feed-snippet.mjs`**. `verify-recommendations.mjs` und `dump-analysis.mjs` sind Zielnamen (u. a. AP8/AP10) und können später ergänzt werden.

**Fixtures:** Golden Cases und Beispieltexte ausschließlich unter **`tests/fixtures/`** (kein zweites `fixtures/`-Verzeichnis im Projektroot — vermeidet Dubletten und falsche Importpfade).

**Ist-Stand Dateien (Stand 2026-05-05):** wie zuvor plus **UI v1:** Root-`index.html`, `app.js` (Import aus `src/recommendations/compose-recommendations.js`, kein Build-Step). `src/app/`, separates `ui/` aus der Zielstruktur bleiben optional.

---

## 10. Arbeitspakete

### 10.0 Umsetzungsstand (fortlaufend)

| AP | Status | Kurz |
|----|--------|------|
| **AP0** | **erledigt** | Archiv, README, Struktur; **Feed-Snippet-Referenz:** `tests/fixtures/feed-snippet-cases.mjs`, Runner `scripts/verify-feed-snippet.mjs` / `verify.mjs feed-snippet`; **Ranker-Kanon:** `src/preview/feed-snippet-ranker.js`, Fold-Länge `src/domain/fold-constants.js` (`archive/feed-snippet-ranker.js` nur noch Re-Export für alte Pfade). |
| **AP1** | **erledigt** | `normalizeText`, `buildNormalizedDocument`, Intl + Fallback, Zeichenoffsets, Tests (`verify.mjs segmenter` / `fallback`, `npm test`). |
| **AP2** | **erledigt** | `extract-surface-features.js`, `src/utils/regex.js` + `text-metrics.js`, `thresholds.js`, Surface je Segment in `buildNormalizedDocument`, `verify.mjs surface`; „lange Sätze“ über `isLongSegmentSurface(surface)` + Schwellen (kein extra §5.5-Feld). |
| **AP3** | **erledigt** | `extract-signal-scores.js`, `src/utils/signal-patterns.js` (DE-first), Signale 0–1 je Segment, `verify.mjs signals`; optional Debug-Treffer später. Surface `hasQuestion` ohne URL-Query-`?` (§5.5). **Nacharbeit:** §5.6 (P1/P2). |
| **AP4** | **erledigt** | `classify-roles.js`: `RoleScores` aus Signalen + Positions-Kontext (`docSentenceIndex`/`Count`, Absatzende → **`cta`**); Hook auch Kontrast/Claim-Hint/`hasQuestion`/CAPS; Kontext via Personal + Zeit-/Erzähl-Marker; **`sentence_pair`** leicht gedämpft; `verify.mjs roles`; Einbau in `segment-document.js`. |
| **AP5** | **erledigt** | `build-post-model.js` / `analyze-post.js`: `PostModel` mit `kind` + **`kindConfidence`**, `StructureModel`, `role-and-structure-constants.js`, lange Sätze = `thresholds.js`; `verify.mjs post-model`. |
| **AP6** | **erledigt** | Feed-Snippet 2.0: `src/preview/feed-snippet.js` (segment-/signalbasiert), angebunden über `resolve-fold-teaser.js` in `build-post-model.js`; `FoldModel` mit `snippetSource='ranked_segment'` und Segment-IDs; `verify.mjs feed-snippet-model` + bestehende `verify.mjs feed-snippet` Regression. |
| **AP7** | **erledigt** | Rule Engine: `recommendation-types.js`, `run-rule-packs.js`, Packs `baseline`/`feed`/`risk` + Skeleton `invite`/`headline`/`article`; bei niedriger `kindConfidence` konservative Feed-Hinweise; `verify.mjs rules`. |
| **AP8** | **erledigt** | Composer/Prioritizer: `merge-recommendations.js`, `prioritize-recommendations.js`, `compose-recommendations.js`, `copy.de.js`; max. 3 Top-Hebel, Konflikt-/`topicBucket`-Handling, Empty-State bei leerem Text; `verify.mjs recommendations`. |
| **AP9** | **erledigt** | UI v1: `index.html` + `app.js` — Live-Analyse, Top-3, Feed-Vorschau (`fold`), Details/Debug einklappbar, Copy/Clear; `composeRecommendationsFromRaw`; Smoke `./start.sh`. |
| **AP10** | **in Arbeit** | Golden Cases: `tests/fixtures/golden-recommendation-cases.mjs` + `tests/unit/golden-recommendations.test.js`; aktuell **30 Fälle** (Feed/Baseline/Risk + `invite/headline/article`, inkl. DE/EN-Mix), Includes/Excludes/Top-3 + Anti-FP/FN (u. a. URL-Query-`?`, kurzer Frage-Text, Prefix-Excludes bei Risk); `verify.mjs golden`. |

**Nächster empfohlener Schritt:** AP10 weiter qualitativ kalibrieren (weitere Edge-Cases pro Regel), danach ggf. ML-Schnittstelle (AP11).

---

## AP0 — Archivierung und Neustart

### Ziel

Alte Dateien sichern, Projekt neu strukturieren, alte Erkenntnisse nicht verlieren.

### Aufgaben

- [x] bestehenden Stand unter **`archive/`** ablegen (optional Unterordner pro Snapshot, z. B. `archive/prototype-2026-05-04/`, oder flach `archive/` — konsistent halten)
- [x] neues `README.md` mit Zielbild / Start anlegen
- [x] `src/`, `tests/` (inkl. `tests/fixtures/`), `scripts/` anlegen
- [x] bisherigen Feed-Snippet-Test aus dem Archiv als Referenzfall in `tests/fixtures/` vorsehen *(Kanone: `tests/fixtures/feed-snippet-cases.mjs`; Duplikat im Archiv unverändert als historische Referenz.)*
- [x] alte Module nur als Inspirationsquelle nutzen, nicht direkt weiterwachsen lassen

### Akzeptanzkriterien

- [x] App startet wieder minimal lokal
- [x] Archiv ist vorhanden
- [x] neue Projektstruktur ist sichtbar
- [x] keine alte DOM-Orchestrierungslogik im neuen Kern *(Root-`app.js` nur Platzhalter)*

### Tests

Manuell:

```bash
ls archive
ls src tests tests/fixtures scripts
```

---

## AP1 — Normalizer und Segmenter

### Ziel

Rohtext stabil in **Absätze** und **Sätze** zerlegen. Ein einzelner Zeilenumbruch (`\n`) **ohne** Leerzeile dazwischen ist **keine** Absatzgrenze — der Text bleibt ein Absatz; Absätze entstehen nur bei **Leerzeilen** (`\n` mit Leerraum dazwischen). Eigene `line`-/`list_item`-Segmente sind in V1 nicht nötig und können später ergänzt werden, falls Features (z. B. Listen-Fold) es verlangen.

### Aufgaben

- [x] `normalizeText(raw)` implementieren
- [x] Zeilenumbrüche normalisieren
- [x] führende/trailing Spaces behandeln
- [x] Absätze über Leerzeilen erkennen
- [x] Sätze via `Intl.Segmenter` mit Fallback splitten
- [x] Satzpaare als optionale Kandidaten erzeugen *(opt-in `includeSentencePairs: true`)*
- [x] Zeichenpositionen erhalten

### Akzeptanzkriterien

- [x] Segmentierung verliert keine Zeichenpositionen **relativ zum kanonischen Analyse-String** (`normalized`): `charStart`/`charEnd` und `EvidenceSpan` beziehen sich immer auf **dieselbe** Zeichenkette wie `NormalizedDocument.normalized` (und ggf. Mapping-Index zu `raw` nur, wenn explizit definiert — sonst Highlighting und Regeln auseinander).
- [x] deutsche Texte mit Zeilenumbrüchen funktionieren
- [x] Fallback ohne `Intl.Segmenter` funktioniert *(getrennt getestet in `sentence-fallback.js`)*
- [x] leere Texte erzeugen valides leeres Modell

### Unit-Tests

```text
Input: "Erster Satz. Zweiter Satz."
Erwartung: 1 Absatz, 2 Sätze

Input: "Hook\n\nAbsatz zwei."
Erwartung: 2 Absätze, korrekte charStart/charEnd

Input: "   "
Erwartung: 0 Absätze, keine Exception
```

### Testbefehl

```bash
node scripts/verify.mjs segmenter
node scripts/verify.mjs fallback
```

---

## AP2 — Surface Features

### Ziel

Messbare Textmerkmale je Segment extrahieren.

**Hinweis:** `startsWeak` ist **DE-geprägt**; `hasQuestion` ignoriert `?` innerhalb von `http(s):`-URLs (vgl. §5.5). Bei **`sentence_pair`** gelten die Merkmale für die **gesamte Paar-Spanne** — für satzweise Logik `sentence`-Segmente verwenden.

### Aufgaben

- [x] Länge, Wortzahl, Kommata, Satzzeichen
- [x] Fragezeichen
- [x] Zahlen, Prozent, Euro
- [x] URLs
- [x] Hashtags
- [x] Emoji-Ketten
- [x] All-Caps
- [x] schwache Satzanfänge
- [x] lange Sätze *(Heuristik `isLongSegmentSurface` + `thresholds.js`, nicht als zusätzliches Feld in §5.5)*

### Akzeptanzkriterien

- [x] Features sind deterministisch
- [x] Features haben keine UI-Abhängigkeit
- [x] Regexe sind zentral gepflegt
- [x] neue Features brechen alte Tests nicht

### Unit-Tests

```text
"Warum scheitern gute Posts?" → hasQuestion true
"Hier der Link https://x.com/p?id=1" → hasUrl true, hasQuestion false (nur Query im Link)
"100 % garantiert" → hasNumber true, risk später möglich
"https://example.com" → hasUrl true
"DAS IST WICHTIG" → isAllCaps true
```

### Testbefehl

```bash
node scripts/verify.mjs surface
npm test
```

---

## AP3 — Signal Scores

### Ziel

Aus Features und Mustern fachliche Signale ableiten.

### Aufgaben

Signale implementieren:

- [x] contrast
- [x] pain
- [x] benefit
- [x] personal
- [x] specificity
- [x] cta
- [x] proof
- [x] example
- [x] risk
- [x] buzzword

### Akzeptanzkriterien

- [x] Scores liegen zwischen 0 und 1
- [x] Scores sind erklärbar *(Muster in `signal-patterns.js`, Logik in `extract-signal-scores.js`)*
- [ ] Signale speichern auslösende Pattern optional für Debug *(API bei Bedarf nachziehen)*

**Nacharbeit:** die priorisierte Review-Liste (P0–P2, inkl. Testlücken) steht unter **§5.6 — Nacharbeit SignalScores**; bei AP4 und weiteren Iterationen dort nachziehen, nicht nur diese Checkbox.

### Beispieltests

```text
"Nicht der Algorithmus ist das Problem, sondern der Einstieg."
→ contrast > 0.7, thesis später wahrscheinlich

"Der Aufwand ist oft zu hoch."
→ pain > 0.6

"Was denkt ihr?"
→ cta > 0.8
```

### Testbefehl

```bash
node scripts/verify.mjs signals
npm test
```

---

## AP4 — Rollenklassifikation

### Ziel

Segmente nach LinkedIn-relevanter Funktion bewerten.

### Aufgaben

- [x] Rollen aus Signal-Scores und Position ableiten
- [x] Hook nicht nur über Fragezeichen bestimmen *(Kontrast, erster Satz, Claim-Hint, CAPS; URL-Query allein kein `hasQuestion`; §5.5)*
- [x] These über Kontrast, Claim-Marker (`nicht`/`scheitert`-Setup erster Satz) und Signale
- [x] CTA am Ende stärker gewichten *(letzter Satz im Absatz / im Dokument)*
- [x] Kontextsegmente erkennen *(Personal + Zeit-/Erzähl-Marker im Text)*
- [x] Filler nur vorsichtig vergeben

### Akzeptanzkriterien

- [x] jedes Segment hat RoleScores
- [x] mehrere Rollen pro Segment sind möglich
- [x] Position beeinflusst Rolle, aber dominiert sie nicht vollständig
- [x] Rollen sind ohne ML berechenbar
- [x] **Tests:** Reihenfolge / Schwellenbänder (`classify-roles.test.js`), keine fragilen Einzel-Float-Gleichheiten

### Beispieltests

```text
"Budgetplanung scheitert nicht an Mathematik. Sie scheitert an Reibung."
→ thesis > 0.7, hook > 0.5, problem > 0.4

"In den letzten Monaten habe ich eine PWA gebaut."
→ context > 0.5, proof/personal > 0.3

"Wie seht ihr das?"
→ cta > 0.8
```

### Testbefehl

```bash
node scripts/verify.mjs roles
npm test
```

---

## AP5 — PostModel Builder

### Ziel

Aus Segmenten ein vollständiges Beitragsmodell bauen.

### Aufgaben

- [x] `analyzePost(raw, options?)` als zentrale API (`src/core/analyze-post.js` → `build-post-model.js`)
- [x] `kind` ableiten *(Heuristik + optional `options.kind`, §5.9)*
- [x] `metrics` übernehmen (`buildNormalizedDocument`)
- [x] `fold` berechnen *(Stub: `resolveFeedFoldTeaser` + `bestSnippetSegmentIds`-Heuristik; AP6 verfeinert)*
- [x] `structure` berechnen *(Aggregation aus Rollen/Signalen je Satz)*
- [x] `risks` sammeln *(leer, Sensitivität, langer Satz — ohne Regelpakete)*
- [x] Debug optional (`includeDebug: true` → `post.debug`, u. a. Hinweis zu `topicDrift`)
- [x] **`kindConfidence`** (§5.9): zurückhaltende format-spezifische Regeln bei Unsicherheit
- [x] Kalibrierung AP4/AP5 in **`role-and-structure-constants.js`**; Fold-Naht **`resolve-fold-teaser.js`**

### Akzeptanzkriterien

- [x] eine Funktion erzeugt das komplette Modell
- [x] keine Regelpakete notwendig, um das Modell zu bauen
- [x] Modell ist serialisierbar
- [x] Modell enthält keine HTML-Ausgabe

### Integrationstest

```js
const post = analyzePost(sampleFeedPost);
assert.equal(post.kind, 'feed');
assert.ok(post.segments.length > 0);
assert.ok(post.structure.hookStrength >= 0);
```

### Testbefehl

```bash
node scripts/verify.mjs post-model
npm test
```

---

## AP6 — Feed-Snippet 2.0

### Ziel

Den sichtbaren Feed-Schnipsel nicht stumpf aus den ersten 200 Zeichen schneiden, sondern aus dem PostModel ableiten.

**Implementierung AP6:** `src/preview/feed-snippet.js` nutzt Kandidaten aus **Segmenten** (Satz + Satzpaar/Pseudo-Paar) und bewertet mit Rollen-/Signalstärken; angebunden über `src/core/resolve-fold-teaser.js` in `build-post-model.js`. Der alte Ranker `feed-snippet-ranker.js` bleibt als Raw-Fallback/Regression bestehen.

### Aufgaben

- [x] vorhandene Snippet-Heuristik als Referenz übernehmen *(liegt unter `src/preview/`, Regression `verify.mjs feed-snippet`)*
- [x] Kandidaten aus ersten Segmenten bauen *(Satz + Satzpaar/Pseudo-Paar, erster Absatz)*
- [x] Hook-/These-/Benefit-Signale einbeziehen
- [x] sensitive Begriffe markieren, nicht blind bevorzugen *(Risiko/Filler-Bremse im Scoring)*
- [x] Fallback auf ersten Absatz/erste Zeile erhalten

### Akzeptanzkriterien

- bestehende Regressionstests laufen weiter
- Snippet überschreitet Fold-Limit nicht
- Snippet darf stärkeren zweiten Satz bevorzugen
- Snippet muss fair zum Rest des Posts sein, soweit heuristisch möglich

### Regressionstests

```bash
node scripts/verify.mjs feed-snippet
# bzw. direkt: node scripts/verify-feed-snippet.mjs
node scripts/verify.mjs feed-snippet-model
```

*(Der Gesamt-Runner `verify-recommendations.mjs` kommt mit AP8/AP10; Snippet-Fälle liegen in `tests/fixtures/feed-snippet-cases.mjs`.)*

Beispielfälle:

- erster Satz nur Kontext, zweiter Satz hat These
- einzelne starke Frage
- leerer Text
- sensitiver Hook mit Risiko-Begriff

---

## AP7 — Rule Engine und Rule Packs

### Ziel

Regeln vom UI entkoppeln und gegen das PostModel laufen lassen.

### Aufgaben

- [x] `RuleContext` definieren (`src/domain/recommendation-types.js`)
- [x] `RuleResult` definieren (`src/domain/recommendation-types.js`)
- [x] `runRulePacks(post, selectedPacks)` implementieren (`src/rules/run-rule-packs.js`)
- [x] Baseline Pack (`src/rules/baseline.rules.js`)
- [x] Feed Pack (`src/rules/feed.rules.js`)
- [x] Risk Pack (`src/rules/risk.rules.js`)
- [x] erste Invite-/Headline-/Article-Regeln als Skeleton (`src/rules/*.rules.js`)

### Akzeptanzkriterien

- [x] Regeln geben Recommendation-ähnliche Ergebnisse zurück
- [x] jede Regel hat ID, Pack-ID, Level und Evidence
- [x] Regeln werfen bei leerem Text keine Exception
- [x] Rule Packs sind einzeln testbar

### Testbefehl

```bash
node scripts/verify.mjs rules
npm test
```

### Beispielregel

```ts
if (
  post.kind === 'feed' &&
  post.kindConfidence >= 0.55 &&
  post.structure.ctaStrength < 0.2 &&
  post.metrics.charCount > 400
) {
  return recommendation('feed.cta_missing', ...);
}
```

---

## AP8 — Recommendation Composer und Prioritizer

### Ziel

Aus vielen Regelresultaten wenige gute Nutzerhinweise machen.

### Aufgaben

- [x] Duplikate zusammenführen (`merge-recommendations.js`)
- [x] Empfehlungen priorisieren (`prioritize-recommendations.js`)
- [x] Top-3-Hebel erzeugen (`compose-recommendations.js`)
- [x] technische Details separat halten (`top` vs. `details`, `meta`)
- [x] Copy zentralisieren (`copy.de.js`)
- [x] Evidence-Spans anzeigen (über RuleResults)

### Akzeptanzkriterien

- [x] Hauptausgabe zeigt maximal 3 Empfehlungen
- [x] Risiken können Top-3 verdrängen, wenn schwerwiegend
- [x] **Konflikte beherrschbar:** keine zwei Top-Einträge aus demselben **`topicBucket`**, sofern deklariert; bei explizitem `conflictsWith` gewinnt die höher priorisierte Regel — dokumentiert in `merge-recommendations` / Prioritizer
- [x] Empfehlung hat konkrete Aktion
- [x] leerer Text liefert Empty State statt „Top-3 um jeden Preis“

### Tests

```text
Wenn CTA fehlt und Text > 400 Zeichen:
→ Empfehlung cta_missing erscheint.

Wenn Text leer:
→ keine Top-3, sondern Empty State.

Wenn URL vorhanden:
→ Risiko/Hinweis Link im Hauptpost erscheint.
```

### Testbefehl

```bash
node scripts/verify.mjs recommendations
npm test
```

---

## AP9 — UI v1

### Ziel

Eine einfache lokale UI für die neue Engine.

### Aufgaben

- [x] Textarea
- [x] Analyse bei Input
- [x] Hauptbox „Die 3 größten Hebel“
- [x] Feed-Vorschau
- [x] Checkliste/Details einklappbar
- [x] Debug-Modell optional einklappbar
- [x] Copy Buttons
- [x] keine externe Abhängigkeit im Kern (Browser lädt ESM aus `src/`)

### Akzeptanzkriterien

- App funktioniert lokal per HTTP
- kein Login
- keine Serverkommunikation
- keine externen Requests für Kernanalyse
- UI bleibt bei leerem Text stabil

### Manueller Smoke-Test

```bash
./start.sh
```

Dann im Browser prüfen:

- leerer Text
- kurzer Hook
- langer Feed-Post
- Text mit URL
- Text mit vielen Hashtags
- Text ohne CTA

---

## AP10 — Empfehlungstests / Golden Cases

### Ziel

Die Engine gegen realistische Texttypen absichern.

### Aufgaben

Fixtures anlegen:

- [x] Start-Set (30 Cases) mit realistischen Feed-/Risk-/Baseline-Szenarien
- [x] Anti-FP-Cases (u. a. URL-Query-`?`, kurzer echter Fragetext ohne erzwungenes `cta_missing`)
- [x] Ausbau auf mindestens 20 Cases inkl. Invite/Headline/Article-Packs
- [ ] Ergänzung von Varianten für DE/EN-Mix

### Fixture-Format

```js
export const CASES = [
  {
    id: 'feed-thesis-too-late',
    kind: 'feed',
    input: '...',
    expected: {
      includes: ['feed.thesis_too_late'],
      excludes: ['baseline.too_many_hashtags'],
      top3Includes: ['feed.thesis_too_late']
    }
  }
];
```

### Akzeptanzkriterien

- mindestens 20 Golden Cases
- jeder neue Regeltyp bekommt mindestens einen Testfall
- Regression läuft per einem Befehl

### Testbefehl

```bash
node scripts/verify.mjs golden
```

Zusätzlich weiterhin `npm test` für die Gesamtsuite.

---

## AP11 — Optionales NLP/ML-Signal vorbereiten

### Ziel

Später ML ergänzen können, ohne Architektur umzubauen.

### Aufgaben

- `mlSignals` optional im Segmentmodell vorsehen
- Adapter-Schnittstelle definieren
- keine ML-Abhängigkeit installieren
- Dokumentation: ML liefert Signale, keine Entscheidungen

### Akzeptanzkriterien

- Engine funktioniert vollständig ohne ML
- ML-Schnittstelle ist optional
- keine externen Requests im Defaultbetrieb

---

## 11. Teststrategie gesamt

### 11.1 Testpyramide

```text
Viele Unit-Tests
  ↓
Integrationstests für analyzePost
  ↓
Regressionstests für Empfehlungen
  ↓
Wenige UI-Smoke-Tests
```

### 11.2 Was nicht getestet wird

Nicht getestet wird, ob ein Beitrag tatsächlich mehr Reichweite bekommt. Das wäre eine spätere empirische Auswertung. Version 1 testet nur, ob die Engine die definierten redaktionellen Muster zuverlässig erkennt.

### 11.3 Testarten

#### Unit-Tests

- Normalizer
- Segmenter
- Surface Features
- Signal Scores
- Role Classifier
- einzelne Regeln

#### Integrationstests

- `analyzePost(raw)` erzeugt vollständiges Modell
- Rule Packs laufen auf Modell
- Recommendation Composer priorisiert korrekt

#### Regressionstests

- Golden Cases
- Feed-Snippet Cases
- Risiko-Cases
- Nicht-Regression bei alten Beispielen

#### Manuelle Tests

- Browserstart
- UI-Rendering
- mobile Darstellung
- Copy-Funktion
- Empty State

---

## 12. Qualitätskriterien

### 12.1 Empfehlung muss konkret sein

Schlecht:

> „Hook verbessern.“

Gut:

> „Dein stärkster Satz steht im Mittelteil. Ziehe ihn näher an den Anfang.“

### 12.2 Empfehlung muss belegt sein

Jede Empfehlung verweist auf mindestens eine Textstelle, sofern möglich.

### 12.3 Empfehlung darf nicht zu absolut klingen

Da die Engine heuristisch ist, nutzt die Copy Formulierungen wie:

- „wirkt wahrscheinlich“
- „prüfe“
- „könnte“
- „wenn dein Ziel Diskussion ist“
- „wenn dein Ziel Produktvertrauen ist“

### 12.4 Risiken werden klarer formuliert

Bei rechtlich, finanziell oder gesundheitlich heiklen Themen:

- keine inhaltliche Beratung
- nur Kommunikationshinweis
- Belegstelle zeigen
- manuelle Prüfung empfehlen

---

## 13. Beispiel: Zieloutput

Input enthält im Mittelteil:

> „Eine Finanz-App hilft am meisten denen, die sie am seltensten nutzen.“

Output:

```text
Die 3 größten Hebel

1. Stärkste These früher bringen
   Warum: Der Satz formuliert die zentrale Spannung deines Beitrags, steht aber nicht am Anfang.
   Beleg: „Eine Finanz-App hilft am meisten denen, die sie am seltensten nutzen.“
   Aktion: Prüfe, ob dieser Gedanke als erster oder zweiter Absatz funktioniert.

2. Einstieg auf gewünschten Diskussionsrahmen prüfen
   Warum: Der aktuelle Hook erzeugt Aufmerksamkeit, kann aber die Diskussion vom Produktnutzen wegziehen.
   Beleg: „Lohnt sich Schwarzarbeit noch?“
   Aktion: Wenn du Konsumverhalten diskutieren willst, drehe den Einstieg stärker auf Übersicht und Selbstreflexion.

3. Abschlussfrage ergänzen
   Warum: Der Beitrag endet erklärend. Eine echte Frage kann mehr Anschluss erzeugen.
   Aktion: Ergänze eine Frage, die nicht nach Zustimmung bettelt, sondern Erfahrung einlädt.
```

---

## 14. Reihenfolge für die Umsetzung

**Erledigt (siehe §10.0):** AP0–AP9.

Empfohlene Reihenfolge:

1. ~~AP0 — Archivierung und Neustart~~
2. ~~AP1 — Normalizer und Segmenter~~
3. ~~AP2 — Surface Features~~
4. ~~AP3 — Signal Scores~~
5. ~~AP4 — Rollenklassifikation~~
6. ~~AP5 — PostModel Builder~~
7. ~~AP7 — Rule Engine~~
8. ~~AP8 — Recommendation Composer~~
9. ~~AP6 — Feed-Snippet 2.0~~
10. ~~AP9 — UI v1~~
11. **AP10 — Golden Cases** ← *aktuell*
12. AP11 — ML-Schnittstelle vorbereiten

Begründung:

Das PostModel muss vor der UI stabil sein. Sonst wächst die Logik wieder in DOM- und Rendering-Funktionen hinein.

**AP6 abgeschlossen:** Fold-Snippet wird jetzt primär segment-/signalbasiert aus dem PostModel bestimmt; der Raw-Ranker bleibt als Fallback/Regression. Damit kann AP9 die Vorschau direkt auf stabilen Modellfeldern (`fold.bestSnippetText`, `fold.bestSnippetSegmentIds`) aufbauen.

---

## 15. Minimaler erster Meilenstein

Der erste echte Meilenstein ist erreicht, wenn folgender Ablauf funktioniert:

```js
const post = analyzePost(raw);
const results = runRulePacks(post, ['baseline', 'feed', 'risk']);
const recommendations = composeRecommendations(post, results);
```

Und die Ausgabe für mindestens fünf Testfälle plausibel ist:

1. leerer Text
2. guter kurzer Feed-Post
3. Feed-Post mit versteckter These
4. Feed-Post ohne CTA
5. Feed-Post mit riskanter Formulierung

---

## 16. Definition of Done für Version 1

Version 1 ist fertig, wenn:

- die App lokal läuft
- Nutzer in typischen Feed-Szenarien **mindestens eine** klar handlungsleitende Top-Empfehlung sehen (kein reines Dashboard aus Zahlen)
- keine serverseitige Verarbeitung stattfindet
- `analyzePost(raw)` zentrales Modell liefert
- mindestens Feed, Baseline und Risk Pack produktiv sind
- Top-3-Empfehlungen erzeugt werden
- jede Empfehlung eine Regel-ID hat
- jede belegbare Empfehlung Evidence-Spans hat
- mindestens 20 Golden Cases grün sind
- Feed-Snippet-Regression grün ist
- Empty State stabil ist
- README erklärt Zweck, Grenzen, Start und Testbefehle

---

## 17. Offene Designentscheidungen

**Festgelegt im Repo (2026-05-04):** Engine in **JavaScript + JSDoc** (`@typedef`), Tests mit **`node --test`** und `node scripts/verify.mjs`, **ohne** Bundler bis auf Weiteres — entspricht den Empfehlungen „notfalls JS mit JSDoc“ und „Node-Assertions“ (Punkte 1, 2, 6 unten). TypeScript/Vitest bleibt eine spätere Option.

Diese Punkte sollten beim Start bewusst entschieden werden:

1. JavaScript oder TypeScript?  
   Empfehlung: Für die Engine TypeScript, für schnellen Start notfalls JS mit JSDoc. Wenn es ernsthaft wachsen soll: TypeScript.

2. Testframework?  
   Empfehlung: Vitest, falls Build-Setup akzeptiert wird. Sonst Node-Assertions für maximale Einfachheit.

3. UI zuerst oder Engine zuerst?  
   Empfehlung: Engine zuerst. UI nur als dünne Schicht.

4. NLP-Libs jetzt oder später?  
   Empfehlung: später. Erst eigene Semantik stabilisieren.

5. Mehrsprachigkeit sofort?  
   Empfehlung: deutsche Regeln zuerst, aber Regex/Copy so kapseln, dass EN später ergänzt werden kann.

6. **TypeScript vs. Zero-Build im Browser**  
   TypeScript erhöht Typsicherheit für wachsende Regeln, braucht aber typischerweise **esbuild/tsc + Vitest** oder ähnliches. Reines ESM ohne Build bleibt möglich mit **JSDoc** (`@typedef`) und Node-Verifier — Entscheidung: entweder minimales Build-Setup akzeptieren oder Engine strikt in JS + JSDoc und Tests per `node --test` / Assertions.

---

## 18. Technische Grundsatzentscheidung

Die Engine ist keine allgemeine KI und kein Textgenerator. Sie ist ein lokaler, regelbasierter Redaktionsassistent mit semantischem Zwischenmodell.

Die wichtigste Architekturregel lautet:

> Regeln entscheiden nicht auf Rohtext, sondern auf einem erklärbaren PostModel.

Damit bleibt das System testbar, erweiterbar und nachvollziehbar.

