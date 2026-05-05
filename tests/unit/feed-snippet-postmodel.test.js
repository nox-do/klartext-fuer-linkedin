import assert from "node:assert/strict";
import test from "node:test";
import { analyzePost } from "../../src/core/analyze-post.js";
import { resolveFeedSnippetFromPostModel } from "../../src/preview/feed-snippet.js";

test("AP6: Fold-Snippet bleibt innerhalb Fold-Limit", () => {
  const raw =
    "Viele digitale Produkte starten mit Kontext. " +
    "Doch der eigentliche Punkt ist nicht Tooling, sondern Klarheit in der These. " +
    "Danach folgen Details und Belege für die Umsetzung.";
  const post = analyzePost(raw, { localeHint: "de" });
  assert.ok(post.fold.bestSnippetText.length <= post.fold.approximateVisibleChars + 1);
});

test("AP6: Snippet darf stärkeren zweiten Satz bevorzugen", () => {
  const raw =
    "Hier ist ein sachlicher Einstieg ohne Hook-Signal. " +
    "Doch der eigentliche Punkt: Warum verlieren Posts Reichweite — nicht wegen Algorithmus-Hass, sondern weil der Hook fehlt? " +
    "Das messen wir anschließend mit Beispielen.";
  const post = analyzePost(raw, { localeHint: "de" });
  assert.ok(
    post.fold.bestSnippetText.startsWith("Doch der eigentliche Punkt"),
    `Snippet war: ${post.fold.bestSnippetText}`,
  );
  assert.equal(post.fold.snippetSource, "ranked_segment");
});

test("AP6: Segmentbasierter Snippet enthält Segment-IDs", () => {
  const raw =
    "Erster Satz als Kontext. " +
    "Zweiter Satz mit Nutzen und klarer Richtung für die Leser. " +
    "Dritter Satz als Ausblick.";
  const post = analyzePost(raw, { localeHint: "de" });
  assert.ok(Array.isArray(post.fold.bestSnippetSegmentIds));
  assert.ok(post.fold.bestSnippetSegmentIds.length >= 1);
});

test("AP6: Fairness-Guard bevorzugt nicht nur provokativen Kurz-Hook", () => {
  const raw =
    "Lohnt sich Schwarzarbeit noch? " +
    "Viele Teams verlieren Zeit, weil Übergaben unklar bleiben und niemand Verantwortung übernimmt. " +
    "Ein klares Übergabemuster spart Aufwand und verbessert Entscheidungen.";
  const post = analyzePost(raw, { localeHint: "de" });
  assert.ok(
    !post.fold.bestSnippetText.startsWith("Lohnt sich Schwarzarbeit noch?"),
    `Snippet war: ${post.fold.bestSnippetText}`,
  );
});

test("AP6: Dedupe verhindert doppelte Paar-Kandidaten", () => {
  const postLike = {
    paragraphs: [{ text: "A. B.", id: "p0", index: 0, charStart: 0, charEnd: 5, sentences: [] }],
    segments: [
      {
        id: "p0-s0",
        type: "sentence",
        text: "A.",
        paragraphIndex: 0,
        charStart: 0,
        charEnd: 2,
        roles: { hook: 0.1, context: 0, thesis: 0, problem: 0, benefit: 0, example: 0, proof: 0, transition: 0, cta: 0, risk: 0, filler: 0 },
        signals: { contrast: 0, pain: 0, benefit: 0, personal: 0, specificity: 0, risk: 0, cta: 0, proof: 0, example: 0, buzzword: 0 },
        surface: { wordCount: 1, startsWeak: false, hasQuestion: false, length: 2, commaCount: 0, hasNumber: false, hasUrl: false, hasHashtag: false, hasEmojiRun: false, isAllCaps: false },
      },
      {
        id: "p0-s1",
        type: "sentence",
        text: "B.",
        paragraphIndex: 0,
        charStart: 3,
        charEnd: 5,
        roles: { hook: 0.1, context: 0, thesis: 0, problem: 0, benefit: 0, example: 0, proof: 0, transition: 0, cta: 0, risk: 0, filler: 0 },
        signals: { contrast: 0, pain: 0, benefit: 0, personal: 0, specificity: 0, risk: 0, cta: 0, proof: 0, example: 0, buzzword: 0 },
        surface: { wordCount: 1, startsWeak: false, hasQuestion: false, length: 2, commaCount: 0, hasNumber: false, hasUrl: false, hasHashtag: false, hasEmojiRun: false, isAllCaps: false },
      },
      {
        id: "p0-sp0-1",
        type: "sentence_pair",
        text: "A. B.",
        paragraphIndex: 0,
        charStart: 0,
        charEnd: 5,
        roles: { hook: 0.2, context: 0, thesis: 0, problem: 0, benefit: 0, example: 0, proof: 0, transition: 0, cta: 0, risk: 0, filler: 0 },
        signals: { contrast: 0, pain: 0, benefit: 0, personal: 0, specificity: 0, risk: 0, cta: 0, proof: 0, example: 0, buzzword: 0 },
        surface: { wordCount: 2, startsWeak: false, hasQuestion: false, length: 5, commaCount: 0, hasNumber: false, hasUrl: false, hasHashtag: false, hasEmojiRun: false, isAllCaps: false },
      },
    ],
  };
  const out = resolveFeedSnippetFromPostModel(/** @type {any} */ (postLike), 200);
  assert.equal(out.source, "ranked_segment");
  assert.ok(out.segmentIds.length >= 1);
});

test("AP6: Viele Zeilenumbrüche mit kurzer erster Zeile bleiben stabil", () => {
  const raw =
    "Kurz.\n" +
    "Viele digitale Produkte starten mit der gleichen Annahme.\n" +
    "Doch der eigentliche Punkt ist ein klarer Nutzen statt bloßer Tool-Nennung.";
  const post = analyzePost(raw, { localeHint: "de" });
  assert.ok(post.fold.bestSnippetText.length > 0);
  assert.ok(!post.fold.bestSnippetText.startsWith("Kurz."));
});
