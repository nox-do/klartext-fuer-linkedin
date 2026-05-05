import assert from "node:assert/strict";
import test from "node:test";
import { analyzePost, buildPostModel, POST_MODEL_VERSION } from "../../src/core/analyze-post.js";

function assertStructure01(st) {
  const keys = [
    "hookStrength",
    "thesisStrength",
    "problemStrength",
    "benefitStrength",
    "ctaStrength",
    "scanability",
    "substance",
    "risk",
  ];
  for (const k of keys) {
    assert.ok(st[k] >= 0 && st[k] <= 1, `${k}=${st[k]}`);
  }
  assert.ok(["low", "medium", "high", "unknown"].includes(st.topicDrift));
}

function assertKindConfidence01(post) {
  assert.ok(post.kindConfidence >= 0 && post.kindConfidence <= 1);
}

test("Integration: Feed-Post — Segmente, Struktur, kind feed", () => {
  const raw =
    "Erster Satz mit Spannung.\n\nZweiter Absatz mit mehr Inhalt und einem Link https://example.com für Tiefe.";
  const post = analyzePost(raw, { localeHint: "de" });
  assert.equal(post.version, POST_MODEL_VERSION);
  assert.equal(post.kind, "feed");
  assert.ok(post.segments.length > 0);
  assert.ok(post.metrics.charCount > 0);
  assertStructure01(post.structure);
  assert.ok(typeof post.fold.bestSnippetText === "string");
  assert.ok(post.fold.approximateVisibleChars > 0);
  assert.equal(post.language, "de");
  assertKindConfidence01(post);
});

test("kind override headline", () => {
  const post = analyzePost("Kurzer Titel", { kind: "headline" });
  assert.equal(post.kind, "headline");
  assert.equal(post.kindConfidence, 1);
});

test("kind override article bleibt immer maßgeblich", () => {
  const post = analyzePost("Kurzer Text.", { kind: "article" });
  assert.equal(post.kind, "article");
  assert.equal(post.kindConfidence, 1);
});

test("leerer Text — unknown, keine Exception", () => {
  const post = analyzePost("   ");
  assert.equal(post.kind, "unknown");
  assert.equal(post.kindConfidence, 0);
  assert.equal(post.segments.length, 0);
  assertStructure01(post.structure);
  assert.ok(post.risks.some((r) => r.code === "empty_text"));
});

test("Langer Feed mit vier Absätzen bleibt feed", () => {
  const paras = Array.from({ length: 4 }, (_, i) => `Absatz ${i + 1}. `.repeat(45)).join("\n\n");
  const post = buildPostModel(paras, { localeHint: "de" });
  assert.ok(post.metrics.charCount > 1200);
  assert.equal(post.kind, "feed");
});

test("Sehr langer Text wird als article erkannt", () => {
  const paras = Array.from({ length: 6 }, (_, i) => `Absatz ${i + 1} ` + "Wort ".repeat(120)).join("\n\n");
  const post = buildPostModel(paras, { localeHint: "de" });
  assert.ok(post.metrics.paragraphCount >= 6);
  assert.ok(post.metrics.charCount > 3500);
  assert.ok(post.metrics.wordCount >= 550);
  assert.equal(post.kind, "article");
});

test("includeDebug optional", () => {
  const post = analyzePost("Hallo.", { includeDebug: true });
  assert.ok(post.debug);
  assert.equal(typeof post.debug.sentenceSegmentCount, "number");
  assert.ok(String(post.debug.topicDriftNote).includes("topicDrift"));
});

test("kindConfidence: kurzer Default-Feed unsicherer als langer", () => {
  const short = analyzePost(
    "Dies sind fünfzehn Wörter in einem Absatz für den Feed und die Konfidenz Prüfung hier.",
    { localeHint: "de" },
  );
  const longWords =
    "Wort ".repeat(45) +
    "am Ende: typischer Feed-Post mit genug Länge für höhere Zuordnungssicherheit ohne Einladungs-Muster.";
  const long = analyzePost(longWords.trim(), { localeHint: "de" });
  assert.equal(short.kind, "feed");
  assert.equal(long.kind, "feed");
  assert.ok(short.kindConfidence < long.kindConfidence);
});

test("Invite-Heuristik und mittlere kindConfidence", () => {
  const post = analyzePost(
    "Hallo, ich möchte mich gerne vernetzen und dein Netzwerk kennenlernen.",
    { localeHint: "de" },
  );
  assert.equal(post.kind, "invite");
  assert.ok(post.kindConfidence >= 0.55 && post.kindConfidence < 1);
});

test("includeSentencePairs: Structure nutzt nur Satz-Segmente", () => {
  const raw = "Erster Satz. Zweiter Satz.";
  const withPairs = analyzePost(raw, { includeSentencePairs: true, localeHint: "de" });
  const noPairs = analyzePost(raw, { includeSentencePairs: false, localeHint: "de" });
  assert.ok(withPairs.segments.length > noPairs.segments.length);
  assert.equal(withPairs.structure.hookStrength, noPairs.structure.hookStrength);
  assert.equal(withPairs.structure.thesisStrength, noPairs.structure.thesisStrength);
});

test("thesisPosition null oder 0–1", () => {
  const post = analyzePost("Nur ein kurzer Satz.");
  if (post.structure.thesisPosition !== null) {
    assert.ok(post.structure.thesisPosition >= 0 && post.structure.thesisPosition <= 1);
  }
});

test("strongestThesisSegmentId ist null bei leerem Text", () => {
  const post = analyzePost("   ");
  assert.equal(post.structure.strongestThesisSegmentId, null);
});

test("strongestThesisSegmentId verweist auf existierendes Segment", () => {
  const raw =
    "Ich starte mit Kontext und weiteren Beobachtungen aus mehreren Entwürfen. " +
    "Viele Texte erklären zuerst zu viel und verlieren dadurch Aufmerksamkeit. " +
    "Nicht mehr Kontext, sondern eine frühe Kernthese macht den Unterschied.";

  const post = analyzePost(raw, { kind: "feed", localeHint: "de" });
  const id = post.structure.strongestThesisSegmentId;

  assert.ok(id);
  assert.ok(post.segments.some((s) => s.id === id));
});
