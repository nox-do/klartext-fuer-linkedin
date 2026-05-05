import assert from "node:assert/strict";
import test from "node:test";
import { classifyRoles } from "../../src/core/classify-roles.js";
import { extractSignalScores } from "../../src/core/extract-signal-scores.js";
import { extractSurfaceFeatures } from "../../src/core/extract-surface-features.js";
import { buildNormalizedDocument } from "../../src/core/segment-document.js";

function assertRoles01(roles) {
  for (const [k, v] of Object.entries(roles)) {
    assert.ok(v >= 0 && v <= 1, `${k}=${v}`);
  }
}

/**
 * @param {Record<string, number>} roles
 */
function sortedRoleKeys(roles) {
  return Object.entries(roles)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);
}

function ctxSentence(text, overrides = {}) {
  return {
    segmentType: /** @type {const} */ ("sentence"),
    docSentenceIndex: 0,
    docSentenceCount: 1,
    paragraphSentenceIndex: 0,
    paragraphSentenceCount: 1,
    text,
    ...overrides,
  };
}

test("Zielbild: CTA-Frage — cta-Rolle dominiert gegenüber filler", () => {
  const t = "Wie seht ihr das?";
  const surf = extractSurfaceFeatures(t);
  const sig = extractSignalScores(surf, t, "de");
  const roles = classifyRoles(surf, sig, ctxSentence(t));
  assertRoles01(roles);
  const order = sortedRoleKeys(roles);
  assert.equal(order[0], "cta");
  assert.ok(roles.cta > roles.filler + 0.25);
});

test("Zielbild: PWA-Kontext — context und proof vor filler / transition", () => {
  const t = "In den letzten Monaten habe ich eine PWA gebaut.";
  const surf = extractSurfaceFeatures(t);
  const sig = extractSignalScores(surf, t, "de");
  const roles = classifyRoles(surf, sig, ctxSentence(t));
  assertRoles01(roles);
  assert.ok(roles.context >= 0.45);
  assert.ok(roles.proof >= 0.28);
  assert.ok(roles.context > roles.filler);
  assert.ok(roles.proof > roles.filler);
});

test("Budgetplanung: thesis vor filler; problem stark genug", () => {
  const t = "Budgetplanung scheitert nicht an Mathematik.";
  const surf = extractSurfaceFeatures(t);
  const sig = extractSignalScores(surf, t, "de");
  const roles = classifyRoles(surf, sig, ctxSentence(t));
  assertRoles01(roles);
  assert.ok(roles.thesis > roles.filler + 0.12);
  assert.ok(roles.problem >= 0.38);
  const order = sortedRoleKeys(roles);
  assert.ok(order.indexOf("thesis") < order.indexOf("filler"));
});

test("buildNormalizedDocument setzt Rollen je Segment", () => {
  const doc = buildNormalizedDocument("A. B.", { includeSentencePairs: false });
  const segs = doc.paragraphs[0].sentences.filter((s) => s.type === "sentence");
  assert.equal(segs.length, 2);
  for (const s of segs) {
    assert.ok(typeof s.roles.cta === "number");
    assert.ok(typeof s.roles.thesis === "number");
    assertRoles01(s.roles);
  }
});
