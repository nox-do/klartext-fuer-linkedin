import assert from "node:assert/strict";
import test from "node:test";
import { extractSignalScores } from "../../src/core/extract-signal-scores.js";
import { extractSurfaceFeatures } from "../../src/core/extract-surface-features.js";

function assertAllIn01(s) {
  for (const k of Object.keys(s)) {
    assert.ok(s[k] >= 0 && s[k] <= 1, `${k}=${s[k]}`);
  }
}

test("Zielbild: Kontrast nicht/sondern", () => {
  const t = "Nicht der Algorithmus ist das Problem, sondern der Einstieg.";
  const surf = extractSurfaceFeatures(t);
  const s = extractSignalScores(surf, t, "de");
  assert.ok(s.contrast > 0.7, `contrast=${s.contrast}`);
  assertAllIn01(s);
});

test("Zielbild: Pain Aufwand", () => {
  const t = "Der Aufwand ist oft zu hoch.";
  const surf = extractSurfaceFeatures(t);
  const s = extractSignalScores(surf, t, "de");
  assert.ok(s.pain > 0.6, `pain=${s.pain}`);
  assertAllIn01(s);
});

test("Zielbild: CTA Frage + ihr", () => {
  const t = "Was denkt ihr?";
  const surf = extractSurfaceFeatures(t);
  const s = extractSignalScores(surf, t, "de");
  assert.ok(s.cta > 0.8, `cta=${s.cta}`);
  assertAllIn01(s);
});

test("Nur Link mit Query: kein CTA (P0)", () => {
  const t = "Hier der Artikel https://news.example.com/post?utm=1";
  const surf = extractSurfaceFeatures(t);
  assert.equal(surf.hasQuestion, false);
  const s = extractSignalScores(surf, t, "de");
  assert.equal(s.cta, 0);
});

test("Leer → alle Signale 0", () => {
  const surf = extractSurfaceFeatures("");
  const s = extractSignalScores(surf, "", "de");
  assert.deepEqual(s, {
    contrast: 0,
    pain: 0,
    benefit: 0,
    personal: 0,
    specificity: 0,
    risk: 0,
    cta: 0,
    proof: 0,
    example: 0,
    buzzword: 0,
  });
});

test("Buzzword erkannt", () => {
  const t = "Das ist ein echter Game Changer für unsere Synergie.";
  const surf = extractSurfaceFeatures(t);
  const s = extractSignalScores(surf, t, "de");
  assert.ok(s.buzzword > 0.5);
});

test("Beispiel-Marker", () => {
  const t = "z. B. so etwas passiert oft.";
  const surf = extractSurfaceFeatures(t);
  const s = extractSignalScores(surf, t, "de");
  assert.ok(s.example > 0.5);
});
