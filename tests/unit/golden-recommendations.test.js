import assert from "node:assert/strict";
import test from "node:test";
import { composeRecommendationsFromRaw } from "../../src/recommendations/compose-recommendations.js";
import { GOLDEN_RECOMMENDATION_CASES } from "../fixtures/golden-recommendation-cases.mjs";

/**
 * @param {string[]} ids
 * @param {string[]} prefixes
 */
function hasAnyPrefix(ids, prefixes) {
  return prefixes.some((prefix) => ids.some((id) => id.startsWith(prefix)));
}

/**
 * @param {string[]} ids
 * @param {string[]} prefixes
 */
function hasNoPrefix(ids, prefixes) {
  return prefixes.every((prefix) => ids.every((id) => !id.startsWith(prefix)));
}

for (const tc of GOLDEN_RECOMMENDATION_CASES) {
  test(`AP10 Golden: ${tc.id}`, () => {
    const out = composeRecommendationsFromRaw(tc.input, tc.options);
    const detailIds = out.details.map((r) => r.id);
    const topIds = out.top.map((r) => r.id);
    const exp = tc.expect;

    assert.ok(out.top.length <= 3, "Top-3 darf nie mehr als 3 Einträge haben");

    for (const id of exp.includes ?? []) {
      assert.ok(detailIds.includes(id), `Erwartete Detail-Regel fehlt: ${id}`);
    }
    for (const id of exp.excludes ?? []) {
      assert.ok(!detailIds.includes(id), `Regel sollte nicht feuern: ${id}`);
    }
    for (const id of exp.topIncludes ?? []) {
      assert.ok(topIds.includes(id), `Erwartete Top-Regel fehlt: ${id}`);
    }
    for (const id of exp.topExcludes ?? []) {
      assert.ok(!topIds.includes(id), `Top-Regel sollte fehlen: ${id}`);
    }
    for (const id of exp.includesOrPrefixes ?? []) {
      const isPrefix = id.endsWith(".");
      if (isPrefix) {
        assert.ok(
          hasAnyPrefix(detailIds, [id]),
          `Erwarteter Prefix fehlt in Details: ${id}`,
        );
      } else {
        assert.ok(detailIds.includes(id), `Erwartete Regel fehlt: ${id}`);
      }
    }

    if ((exp.includesPrefixes ?? []).length) {
      assert.ok(
        hasAnyPrefix(detailIds, exp.includesPrefixes ?? []),
        `Erwarteter ID-Prefix fehlt in Details: ${exp.includesPrefixes?.join(", ")}`,
      );
    }
    if ((exp.topIncludesPrefixes ?? []).length) {
      assert.ok(
        hasAnyPrefix(topIds, exp.topIncludesPrefixes ?? []),
        `Erwarteter ID-Prefix fehlt in Top-3: ${exp.topIncludesPrefixes?.join(", ")}`,
      );
    }
    if ((exp.excludesPrefixes ?? []).length) {
      assert.ok(
        hasNoPrefix(detailIds, exp.excludesPrefixes ?? []),
        `Ausgeschlossener ID-Prefix gefunden: ${exp.excludesPrefixes?.join(", ")}`,
      );
    }

    if (Array.isArray(exp.topExact)) {
      assert.deepEqual(topIds, exp.topExact, "Top-3 stimmt nicht exakt");
    }
    if (typeof exp.emptyState === "boolean") {
      assert.equal(out.emptyState, exp.emptyState, "emptyState stimmt nicht");
    }
  });
}
