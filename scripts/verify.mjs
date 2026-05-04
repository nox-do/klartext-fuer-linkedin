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

console.error(`Unbekannter Befehl: ${cmd || "(leer)"}`);
console.error("Nutzung: node scripts/verify.mjs segmenter | fallback | feed-snippet");
process.exit(1);
