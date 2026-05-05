import assert from "node:assert/strict";
import test from "node:test";
import { analyzePost } from "../../src/core/analyze-post.js";
import { runRulePacks } from "../../src/rules/run-rule-packs.js";
import {
  composeRecommendations,
  composeRecommendationsFromRaw,
} from "../../src/recommendations/compose-recommendations.js";
import { mergeRecommendations } from "../../src/recommendations/merge-recommendations.js";
import { prioritizeRecommendations } from "../../src/recommendations/prioritize-recommendations.js";

test("AP8: CTA fehlt bei langem Feed erscheint in Empfehlungen", () => {
  const raw =
    "Das Problem in vielen Teams ist nicht Motivation, sondern fehlende Klarheit. " +
    "Wir verlieren Zeit in Übergaben und Meetings und verzetteln uns in Detailfragen ohne echten Fortschritt. " +
    "Dadurch bleibt weniger Fokus für Kunden und Produkt, obwohl alle Beteiligten eigentlich das Richtige wollen. " +
    "Die Folge sind langsame Entscheidungen, Frust im Alltag und unnötige Schleifen in Abstimmungen. " +
    "Ein klarer Prozess spart Aufwand und verbessert die Zusammenarbeit, wenn Verantwortlichkeiten sauber benannt sind. " +
    "Zusätzlich hilft ein gemeinsames Zielbild, damit Prioritäten nicht bei jeder Diskussion neu verhandelt werden.";
  const post = analyzePost(raw, { kind: "feed", localeHint: "de" });
  const ruleResults = runRulePacks(post, ["feed"]);
  const out = composeRecommendations(post, ruleResults);
  assert.ok(out.details.some((r) => r.id === "feed.cta_missing"));
  assert.ok(out.top.length <= 3);
  assert.equal(out.emptyState, false);
});

test("AP8: leerer Text -> Empty State und keine Top-3", () => {
  const out = composeRecommendationsFromRaw("", {
    selectedPacks: ["baseline", "feed", "risk"],
  });
  assert.equal(out.emptyState, true);
  assert.equal(out.top.length, 0);
  // Details dürfen technische Hinweise enthalten, UI zeigt aber Empty State.
  assert.ok(out.details.some((r) => r.id === "baseline.empty_text"));
});

test("AP8: URL-Hinweis erscheint bei Link im Text", () => {
  const out = composeRecommendationsFromRaw(
    "Kontextsatz. Details im Link: https://example.com/a?b=1 und weiter geht es.",
    { selectedPacks: ["baseline"] },
  );
  assert.ok(out.details.some((r) => r.id === "baseline.url_in_main_text"));
});

test("Prioritizer: topicBucket verhindert Doppelung in Top-3", () => {
  const items = [
    {
      id: "a",
      packId: "feed",
      ruleId: "x",
      level: "hint",
      priority: 50,
      title: "A",
      message: "A",
      tags: [],
      topicBucket: "structure",
    },
    {
      id: "b",
      packId: "article",
      ruleId: "y",
      level: "warn",
      priority: 60,
      title: "B",
      message: "B",
      tags: [],
      topicBucket: "structure",
    },
    {
      id: "c",
      packId: "risk",
      ruleId: "z",
      level: "risk",
      priority: 40,
      title: "C",
      message: "C",
      tags: [],
      topicBucket: "risk",
    },
  ];
  const top = prioritizeRecommendations(items, { maxItems: 2 });
  assert.ok(top.some((r) => r.id === "b"));
  assert.ok(!top.some((r) => r.id === "a"));
});

test("Merge: gleiche packId/ruleId wird zusammengeführt", () => {
  const merged = mergeRecommendations([
    {
      id: "feed.cta_missing",
      packId: "feed",
      ruleId: "cta_missing",
      level: "hint",
      priority: 60,
      title: "t1",
      message: "m1",
      tags: ["x"],
      evidence: [{ text: "A", charStart: 0, charEnd: 1 }],
    },
    {
      id: "feed.cta_missing",
      packId: "feed",
      ruleId: "cta_missing",
      level: "hint",
      priority: 58,
      title: "t2",
      message: "m2",
      tags: ["y"],
      evidence: [{ text: "A", charStart: 0, charEnd: 1 }],
    },
  ]);
  assert.equal(merged.length, 1);
  assert.ok(merged[0].tags.includes("x") && merged[0].tags.includes("y"));
});

test("Prioritizer: symmetrische conflictsWith-Prüfung auch in Auffüllrunde", () => {
  const items = [
    {
      id: "r1",
      packId: "risk",
      ruleId: "overall_high",
      level: "risk",
      priority: 90,
      title: "R1",
      message: "R1",
      tags: [],
    },
    {
      id: "r2",
      packId: "feed",
      ruleId: "thesis_late",
      level: "hint",
      priority: 45,
      title: "R2",
      message: "R2",
      tags: [],
      conflictsWith: ["r1"],
    },
    {
      id: "r3",
      packId: "baseline",
      ruleId: "url",
      level: "info",
      priority: 10,
      title: "R3",
      message: "R3",
      tags: [],
    },
  ];
  const top = prioritizeRecommendations(items, { maxItems: 3 });
  assert.ok(top.some((r) => r.id === "r1"));
  assert.ok(top.some((r) => r.id === "r3"));
  assert.ok(!top.some((r) => r.id === "r2"));
});

test("Prioritizer: akzeptiert < maxItems bei strikten Bucket-Regeln", () => {
  const items = [
    {
      id: "s1",
      packId: "feed",
      ruleId: "a",
      level: "warn",
      priority: 60,
      title: "S1",
      message: "S1",
      tags: [],
      topicBucket: "structure",
    },
    {
      id: "s2",
      packId: "article",
      ruleId: "b",
      level: "hint",
      priority: 55,
      title: "S2",
      message: "S2",
      tags: [],
      topicBucket: "structure",
    },
  ];
  const top = prioritizeRecommendations(items, { maxItems: 3 });
  assert.equal(top.length, 1);
  assert.equal(top[0].id, "s1");
});

test("Prioritizer: Gegenrichtungs-Konflikt blockt Kandidat auch ohne eigenes conflictsWith", () => {
  const items = [
    {
      id: "g1",
      packId: "risk",
      ruleId: "overall_high",
      level: "risk",
      priority: 90,
      title: "G1",
      message: "G1",
      tags: [],
      conflictsWith: ["g2"],
    },
    {
      id: "g2",
      packId: "feed",
      ruleId: "cta_missing",
      level: "hint",
      priority: 50,
      title: "G2",
      message: "G2",
      tags: [],
      // bewusst kein conflictsWith hier: Test der Gegenrichtung
    },
    {
      id: "g3",
      packId: "baseline",
      ruleId: "url",
      level: "info",
      priority: 12,
      title: "G3",
      message: "G3",
      tags: [],
    },
  ];
  const top = prioritizeRecommendations(items, { maxItems: 3 });
  assert.ok(top.some((r) => r.id === "g1"));
  assert.ok(top.some((r) => r.id === "g3"));
  assert.ok(!top.some((r) => r.id === "g2"));
});

test("thesis_after_fold: Evidence-Segment liegt hinter Fold", () => {
  const out = composeRecommendationsFromRaw(
    "Ich habe lange über LinkedIn-Texte nachgedacht und in vielen Entwürfen gesehen, wie schnell die Aufmerksamkeit im Feed abfällt. Viele Posts wirken ordentlich, aber bleiben wirkungslos, weil sie zuerst Kontext schichten, Beispiele aneinanderreihen und den eigentlichen Hebel erst ganz am Ende benennen. Sie erklären viel, sortieren sauber, liefern Beobachtungen aus Projekten und wollen verständlich sein, verlieren dabei aber den früh sichtbaren Kern. Nicht die Menge an Kontext überzeugt im Feed, sondern eine früh sichtbare Kernthese.",
    { analyzeOptions: { kind: "feed", localeHint: "de" } },
  );

  const rec = out.details.find((r) => r.id === "feed.thesis_after_fold");
  assert.ok(rec);
  assert.ok((rec.evidence?.[0]?.charStart ?? -1) > 200);
});

test("Prioritizer: thesis_after_fold verdrängt thesis_too_late", () => {
  const out = composeRecommendationsFromRaw(
    "Ich habe lange über LinkedIn-Texte nachgedacht und in vielen Entwürfen gesehen, wie schnell die Aufmerksamkeit im Feed abfällt. Viele Posts wirken ordentlich, aber bleiben wirkungslos, weil sie zuerst Kontext schichten, Beispiele aneinanderreihen und den eigentlichen Hebel erst ganz am Ende benennen. Sie erklären viel, sortieren sauber, liefern Beobachtungen aus Projekten und wollen verständlich sein, verlieren dabei aber den früh sichtbaren Kern. Nicht die Menge an Kontext überzeugt im Feed, sondern eine früh sichtbare Kernthese.",
    { analyzeOptions: { kind: "feed", localeHint: "de" } },
  );

  const topIds = out.top.map((r) => r.id);
  assert.ok(topIds.includes("feed.thesis_after_fold"));
  assert.ok(!topIds.includes("feed.thesis_too_late"));
});
