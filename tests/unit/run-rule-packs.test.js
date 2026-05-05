import assert from "node:assert/strict";
import test from "node:test";
import { analyzePost } from "../../src/core/analyze-post.js";
import { runRulePacks, runRulePacksOnRaw } from "../../src/rules/run-rule-packs.js";

test("leerer Text: keine Exception, baseline empty_text", () => {
  const post = analyzePost("");
  const recs = runRulePacks(post, ["baseline", "feed", "risk"]);
  assert.ok(recs.some((r) => r.id === "baseline.empty_text"));
});

test("Feed-Regel: cta_missing bei langem Feed ohne CTA", () => {
  const raw =
    "Das Problem in vielen Teams ist nicht Motivation, sondern fehlende Klarheit. " +
    "Wir verlieren Zeit in Übergaben und Meetings und verzetteln uns in Detailfragen ohne echten Fortschritt. " +
    "Dadurch bleibt weniger Fokus für Kunden und Produkt, obwohl alle Beteiligten eigentlich das Richtige wollen. " +
    "Die Folge sind langsame Entscheidungen, Frust im Alltag und unnötige Schleifen in Abstimmungen. " +
    "Ein klarer Prozess spart Aufwand und verbessert die Zusammenarbeit, wenn Verantwortlichkeiten sauber benannt sind. " +
    "Zusätzlich hilft ein gemeinsames Zielbild, damit Prioritäten nicht bei jeder Diskussion neu verhandelt werden.";
  const post = analyzePost(raw, { kind: "feed", localeHint: "de" });
  const recs = runRulePacks(post, ["feed"]);
  assert.ok(recs.some((r) => r.id === "feed.cta_missing"));
});

test("Feed-Pack bei niedriger kindConfidence: nur kind_uncertain", () => {
  const post = analyzePost(
    "Dieser Text hat etwas mehr als eine Headline, bleibt aber kurz und ohne klaren Formatkontext für sichere Zuordnung.",
  );
  const recs = runRulePacks(post, ["feed"]);
  assert.ok(recs.some((r) => r.id === "feed.kind_uncertain"));
  assert.ok(!recs.some((r) => r.id === "feed.cta_missing"));
});

test("Risk-Pack mappt sensitive risks", () => {
  const raw = "Schwarzarbeit ist ein Risiko und das ist kein guter Weg.";
  const post = analyzePost(raw, { localeHint: "de" });
  const recs = runRulePacks(post, ["risk"]);
  assert.ok(recs.some((r) => r.ruleId === "sensitive_keyword"));
});

test("runRulePacksOnRaw kombiniert Analyse und Regeln", () => {
  const recs = runRulePacksOnRaw("Hallo", {
    selectedPacks: ["baseline"],
    analyzeOptions: { localeHint: "de" },
  });
  assert.ok(Array.isArray(recs));
  assert.ok(recs.length >= 0);
});
