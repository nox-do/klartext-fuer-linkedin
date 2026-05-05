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
  assert.ok(s.cta >= 0.58, `cta=${s.cta}`);
  assertAllIn01(s);
});

test("Implizite CTA ohne Fragezeichen: Schreib mir eine DM", () => {
  const t = "Schreib mir eine DM, wenn du das Muster kennst.";
  const surf = extractSurfaceFeatures(t);
  const s = extractSignalScores(surf, t, "de");
  assert.ok(s.cta >= 0.62, `cta=${s.cta}`);
});

test("Implizite CTA ohne Fragezeichen: Link im ersten Kommentar", () => {
  const t = "Link im ersten Kommentar.";
  const surf = extractSurfaceFeatures(t);
  const s = extractSignalScores(surf, t, "de");
  assert.ok(s.cta >= 0.62, `cta=${s.cta}`);
});

test("Implizite CTA: Kommentar-Aufforderung", () => {
  const t = "Schreib es in die Kommentare.";
  const surf = extractSurfaceFeatures(t);
  const s = extractSignalScores(surf, t, "de");
  assert.ok(s.cta >= 0.62, `cta=${s.cta}`);
});

test("Implizite CTA: Follow", () => {
  const t = "Folge mir für mehr Notizen zu besseren LinkedIn-Texten.";
  const surf = extractSurfaceFeatures(t);
  const s = extractSignalScores(surf, t, "de");
  assert.ok(s.cta >= 0.62, `cta=${s.cta}`);
});

test("Implizite CTA: Resource", () => {
  const t = "Die Checkliste findest du im Kommentar.";
  const surf = extractSurfaceFeatures(t);
  const s = extractSignalScores(surf, t, "de");
  assert.ok(s.cta >= 0.62, `cta=${s.cta}`);
});

test("Implizite CTA: Reflection", () => {
  const t = "Prüf beim nächsten Post, ob deine These vor dem Fold sichtbar ist.";
  const surf = extractSurfaceFeatures(t);
  const s = extractSignalScores(surf, t, "de");
  assert.ok(s.cta >= 0.5, `cta=${s.cta}`);
});

test("Implizite CTA: Contact", () => {
  const t = "Melde dich, wenn du dafür eine kompakte Review-Checkliste brauchst.";
  const surf = extractSurfaceFeatures(t);
  const s = extractSignalScores(surf, t, "de");
  assert.ok(s.cta >= 0.62, `cta=${s.cta}`);
});

test("Kein CTA: bloße Newsletter-Erwähnung", () => {
  const t = "Der Newsletter war ein gutes Beispiel.";
  const surf = extractSurfaceFeatures(t);
  const s = extractSignalScores(surf, t, "de");
  assert.equal(s.cta, 0);
});

test("Kein CTA: Kommentar nur als Nennung", () => {
  const t = "Ich habe einen Kommentar dazu gelesen.";
  const surf = extractSurfaceFeatures(t);
  const s = extractSignalScores(surf, t, "de");
  assert.equal(s.cta, 0);
});

test("Kein CTA: DM nur als Nennung", () => {
  const t = "Die DM-Funktion bei LinkedIn nervt manchmal.";
  const surf = extractSurfaceFeatures(t);
  const s = extractSignalScores(surf, t, "de");
  assert.equal(s.cta, 0);
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
