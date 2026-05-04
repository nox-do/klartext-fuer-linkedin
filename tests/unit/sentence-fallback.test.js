import assert from "node:assert/strict";
import test from "node:test";
import { rangesFallbackSentences } from "../../src/core/sentence-fallback.js";

function assertContiguousRanges(text, ranges) {
  for (const r of ranges) {
    assert.equal(text.slice(r.localStart, r.localEnd).trim(), text.slice(r.localStart, r.localEnd));
    assert.ok(r.localStart < r.localEnd);
  }
}

test("Fallback: zwei deutsche Sätze", () => {
  const text = "Erster Satz. Zweiter Satz.";
  const r = rangesFallbackSentences(text);
  assert.equal(r.length, 2);
  assert.equal(text.slice(r[0].localStart, r[0].localEnd), "Erster Satz.");
  assert.equal(text.slice(r[1].localStart, r[1].localEnd), "Zweiter Satz.");
  assertContiguousRanges(text, r);
});

test("Fallback: ein Block ohne Satzzeichen", () => {
  const text = "nur ein Gedanke";
  const r = rangesFallbackSentences(text);
  assert.equal(r.length, 1);
  assert.equal(text.slice(r[0].localStart, r[0].localEnd), "nur ein Gedanke");
});

test("Fallback: Ellipse als Satzende", () => {
  const text = "Achtung… Nächster";
  const r = rangesFallbackSentences(text);
  assert.ok(r.length >= 1);
  assert.ok(r[0].localEnd <= text.length);
});

test("Fallback: Zeilenumbruch im Absatz bleibt im ersten Range", () => {
  const text = "Zeile eins\nZeile zwei.";
  const r = rangesFallbackSentences(text);
  assert.equal(r.length, 1);
  assert.ok(r[0].localEnd - r[0].localStart >= text.trim().length - 2);
});
