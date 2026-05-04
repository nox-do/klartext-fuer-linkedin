#!/usr/bin/env node
/**
 * Verprobt `resolveFeedFoldTeaser` gegen `tests/fixtures/feed-snippet-cases.mjs`.
 * Aus dem Projektroot: `node scripts/verify-feed-snippet.mjs`
 */

import { FEED_SNIPPET_CASES } from "../tests/fixtures/feed-snippet-cases.mjs";
import { FEED_FOLD_CHARS } from "../src/domain/fold-constants.js";
import { resolveFeedFoldTeaser } from "../src/preview/feed-snippet-ranker.js";

function fail(caseId, msg) {
  console.error(`FAIL [${caseId}] ${msg}`);
  process.exitCode = 1;
}

function ok(caseId, detail) {
  console.log(`ok   [${caseId}] ${detail}`);
}

for (const c of FEED_SNIPPET_CASES) {
  const { teaser, source, score } = resolveFeedFoldTeaser(c.raw, FEED_FOLD_CHARS);
  const ex = c.expect;

  if (ex.source !== undefined) {
    const allowed = Array.isArray(ex.source) ? ex.source : [ex.source];
    if (!allowed.includes(source)) {
      fail(c.id, `source: got ${JSON.stringify(source)}, want one of ${JSON.stringify(allowed)}`);
      continue;
    }
  }

  if (ex.teaserMaxLen !== undefined && teaser.length > ex.teaserMaxLen) {
    fail(c.id, `teaser length ${teaser.length} > ${ex.teaserMaxLen}`);
    continue;
  }

  if (ex.minTeaserLen !== undefined && teaser.length < ex.minTeaserLen) {
    fail(c.id, `teaser length ${teaser.length} < ${ex.minTeaserLen}`);
    continue;
  }

  if (ex.mustStartWith !== undefined && !teaser.startsWith(ex.mustStartWith)) {
    fail(
      c.id,
      `teaser must start with ${JSON.stringify(ex.mustStartWith)}, got ${JSON.stringify(teaser.slice(0, 80))}`
    );
    continue;
  }

  if (ex.mustNotStartWith !== undefined && teaser.startsWith(ex.mustNotStartWith)) {
    fail(
      c.id,
      `teaser must not start with ${JSON.stringify(ex.mustNotStartWith)}, got ${JSON.stringify(teaser.slice(0, 120))}`
    );
    continue;
  }

  if (ex.mustMatch !== undefined && !ex.mustMatch.test(teaser)) {
    fail(c.id, `teaser must match ${ex.mustMatch}, got ${JSON.stringify(teaser)}`);
    continue;
  }

  if (ex.mustNotMatch !== undefined && ex.mustNotMatch.test(teaser)) {
    fail(c.id, `teaser must not match ${ex.mustNotMatch}`);
    continue;
  }

  ok(
    c.id,
    `source=${source} score=${score ?? "n/a"} len=${teaser.length} ${JSON.stringify(teaser.slice(0, 72))}${teaser.length > 72 ? "…" : ""}`
  );
}

if (process.exitCode === 1) {
  console.error("\nEin oder mehrere Feed-Snippet-Tests fehlgeschlagen.");
} else {
  console.log(`\nAlle ${FEED_SNIPPET_CASES.length} Feed-Snippet-Tests bestanden.`);
}
