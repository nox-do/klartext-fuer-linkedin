import assert from "node:assert/strict";
import test from "node:test";
import { buildNormalizedDocument } from "../../src/core/segment-document.js";
import { normalizeText } from "../../src/core/normalize-text.js";

function assertEvidenceInNormalized(doc) {
  const { normalized } = doc;
  for (const p of doc.paragraphs) {
    assert.equal(normalized.slice(p.charStart, p.charEnd), p.text);
    for (const s of p.sentences) {
      assert.equal(
        normalized.slice(s.charStart, s.charEnd),
        s.text,
        `Segment ${s.id} muss exakt in normalized vorkommen`
      );
    }
  }
}

test("Erster Satz. Zweiter Satz. → 1 Absatz, 2 Sätze", () => {
  const doc = buildNormalizedDocument("Erster Satz. Zweiter Satz.", {
    includeSentencePairs: false,
  });
  assert.equal(doc.paragraphs.length, 1);
  const onlySentences = doc.paragraphs[0].sentences.filter((s) => s.type === "sentence");
  assert.equal(onlySentences.length, 2);
  assertEvidenceInNormalized(doc);
});

test("Hook\\n\\nAbsatz zwei. → 2 Absätze, charStart/charEnd konsistent", () => {
  const doc = buildNormalizedDocument("Hook\n\nAbsatz zwei.");
  assert.equal(doc.paragraphs.length, 2);
  assert.equal(doc.paragraphs[0].text, "Hook");
  assert.equal(doc.paragraphs[1].text, "Absatz zwei.");
  assert.ok(doc.paragraphs[1].charStart > doc.paragraphs[0].charEnd);
  assertEvidenceInNormalized(doc);
});

test("nur Leerzeichen → 0 Absätze, keine Exception", () => {
  const doc = buildNormalizedDocument("   ");
  assert.equal(doc.normalized, "");
  assert.equal(doc.paragraphs.length, 0);
  assert.equal(doc.metrics.paragraphCount, 0);
});

test("leerer String \"\" → valides leeres Modell", () => {
  const doc = buildNormalizedDocument("");
  assert.equal(doc.normalized, "");
  assert.equal(doc.paragraphs.length, 0);
  assert.equal(doc.metrics.charCount, 0);
  assert.equal(doc.metrics.wordCount, 0);
  assert.equal(doc.metrics.sentenceCount, 0);
  assertEvidenceInNormalized(doc);
});

test("normalizeText: CRLF und trim", () => {
  const r = normalizeText("  a\r\n\r\nb  ");
  assert.equal(r.normalized, "a\n\nb");
});

test("Satzpaare optional vorhanden", () => {
  const doc = buildNormalizedDocument("A. B.", { includeSentencePairs: true });
  const pairs = doc.paragraphs[0].sentences.filter((s) => s.type === "sentence_pair");
  assert.ok(pairs.length >= 1);
  assert.ok(pairs[0].text.includes("A"));
  assert.ok(pairs[0].text.includes("B"));
  assertEvidenceInNormalized(doc);
});

test("deutsche Zeilenumbrüche im Absatz bleiben ein Absatz", () => {
  const doc = buildNormalizedDocument("Zeile eins\nZeile zwei.");
  assert.equal(doc.paragraphs.length, 1);
  assert.ok(doc.paragraphs[0].text.includes("\n"));
  assertEvidenceInNormalized(doc);
});
