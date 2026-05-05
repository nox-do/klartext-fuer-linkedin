#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const cmd = process.argv[2];

if (cmd === "segmenter") {
  const r = spawnSync(
    "node",
    ["--test", join(root, "tests/unit/segment-document.test.js")],
    { stdio: "inherit", cwd: root }
  );
  process.exit(r.status === 0 ? 0 : r.status ?? 1);
}

if (cmd === "fallback") {
  const r = spawnSync(
    "node",
    ["--test", join(root, "tests/unit/sentence-fallback.test.js")],
    { stdio: "inherit", cwd: root }
  );
  process.exit(r.status === 0 ? 0 : r.status ?? 1);
}

if (cmd === "feed-snippet") {
  const r = spawnSync("node", [join(root, "scripts/verify-feed-snippet.mjs")], {
    stdio: "inherit",
    cwd: root,
  });
  process.exit(r.status === 0 ? 0 : r.status ?? 1);
}

if (cmd === "surface") {
  const r = spawnSync(
    "node",
    ["--test", join(root, "tests/unit/extract-surface-features.test.js")],
    { stdio: "inherit", cwd: root }
  );
  process.exit(r.status === 0 ? 0 : r.status ?? 1);
}

if (cmd === "signals") {
  const r = spawnSync(
    "node",
    ["--test", join(root, "tests/unit/extract-signal-scores.test.js")],
    { stdio: "inherit", cwd: root }
  );
  process.exit(r.status === 0 ? 0 : r.status ?? 1);
}

if (cmd === "roles") {
  const r = spawnSync(
    "node",
    ["--test", join(root, "tests/unit/classify-roles.test.js")],
    { stdio: "inherit", cwd: root }
  );
  process.exit(r.status === 0 ? 0 : r.status ?? 1);
}

if (cmd === "post-model") {
  const r = spawnSync(
    "node",
    ["--test", join(root, "tests/unit/analyze-post.test.js")],
    { stdio: "inherit", cwd: root }
  );
  process.exit(r.status === 0 ? 0 : r.status ?? 1);
}

if (cmd === "rules") {
  const r = spawnSync(
    "node",
    ["--test", join(root, "tests/unit/run-rule-packs.test.js")],
    { stdio: "inherit", cwd: root }
  );
  process.exit(r.status === 0 ? 0 : r.status ?? 1);
}

if (cmd === "recommendations") {
  const r = spawnSync(
    "node",
    ["--test", join(root, "tests/unit/compose-recommendations.test.js")],
    { stdio: "inherit", cwd: root }
  );
  process.exit(r.status === 0 ? 0 : r.status ?? 1);
}

if (cmd === "feed-snippet-model") {
  const r = spawnSync(
    "node",
    ["--test", join(root, "tests/unit/feed-snippet-postmodel.test.js")],
    { stdio: "inherit", cwd: root }
  );
  process.exit(r.status === 0 ? 0 : r.status ?? 1);
}

console.error(`Unbekannter Befehl: ${cmd || "(leer)"}`);
console.error(
  "Nutzung: node scripts/verify.mjs segmenter | fallback | feed-snippet | feed-snippet-model | surface | signals | roles | post-model | rules | recommendations"
);
process.exit(1);
