import assert from "node:assert/strict";
import test from "node:test";
import {
  extractSurfaceFeatures,
  isLongSegmentSurface,
} from "../../src/core/extract-surface-features.js";
import { LONG_SENTENCE_WORDS } from "../../src/domain/thresholds.js";

test("Zielbild: Frage → hasQuestion", () => {
  const s = extractSurfaceFeatures("Warum scheitern gute Posts?");
  assert.equal(s.hasQuestion, true);
});

test("Zielbild: Prozent/Zahl → hasNumber", () => {
  const s = extractSurfaceFeatures("100 % garantiert");
  assert.equal(s.hasNumber, true);
});

test("Zielbild: URL → hasUrl", () => {
  const s = extractSurfaceFeatures("Siehe https://example.com für mehr.");
  assert.equal(s.hasUrl, true);
});

test("URL-Query allein: kein hasQuestion (P0)", () => {
  const s = extractSurfaceFeatures("Mehr Infos: https://example.com/page?id=1&ref=x");
  assert.equal(s.hasUrl, true);
  assert.equal(s.hasQuestion, false);
});

test("URL mit Query + echte Frage: hasQuestion true", () => {
  const s = extractSurfaceFeatures(
    "Was meint ihr? Link https://example.com/a?b=1",
  );
  assert.equal(s.hasUrl, true);
  assert.equal(s.hasQuestion, true);
});

test("Zielbild: ALL CAPS → isAllCaps", () => {
  const s = extractSurfaceFeatures("DAS IST WICHTIG");
  assert.equal(s.isAllCaps, true);
});

test("Hashtag erkannt", () => {
  const s = extractSurfaceFeatures("Mehr #LinkedIn und #Wachstum");
  assert.equal(s.hasHashtag, true);
});

test("Emoji-Kette (mind. drei)", () => {
  const s = extractSurfaceFeatures("Los 🔥🔥🔥 geht's");
  assert.equal(s.hasEmojiRun, true);
});

test("Schwacher Satzanfang", () => {
  const s = extractSurfaceFeatures("Deshalb ist das so.");
  assert.equal(s.startsWeak, true);
});

test("Langer Satz über Wortzahl-Schwelle", () => {
  const words = Array.from({ length: LONG_SENTENCE_WORDS + 2 }, () => "wort").join(" ");
  const s = extractSurfaceFeatures(words + ".");
  assert.equal(isLongSegmentSurface(s), true);
});

test("Leerstring: neutrale Oberfläche", () => {
  const s = extractSurfaceFeatures("");
  assert.equal(s.length, 0);
  assert.equal(s.wordCount, 0);
  assert.equal(s.hasQuestion, false);
  assert.equal(s.isAllCaps, false);
});

test("Kommata zählen", () => {
  const s = extractSurfaceFeatures("a,b,c");
  assert.equal(s.commaCount, 2);
});
