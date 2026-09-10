#!/usr/bin/env node
/**
 * Fails when a module that is mirrored in the sibling app changes without the
 * mirror being dealt with.
 *
 * A handful of modules carry the same logic in `profik-contractor` and `profik`
 * — several are byte-identical, and the rest differ only where a doc comment
 * names that app's own endpoints. Their comments ask that the copies be kept in
 * step by hand. That request is invisible: nothing fails when only one side is
 * edited, and the two drift silently until a bug appears in one app and not the
 * other.
 *
 * The two repositories are separate checkouts, so CI cannot compare them
 * directly — there is no sibling on disk there. Instead each repository records
 * the hash of its own copies in `shared-modules.json`. Changing a mirrored file
 * fails this check until the hash is refreshed, and refreshing it is the moment
 * to carry the change across. That is a reminder, not a proof: it cannot know
 * whether the other app was actually updated. Being reminded at the right time
 * is the part that was missing.
 *
 *   npm run shared:check   verify
 *   npm run shared:sync    accept the current contents as the new baseline
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MANIFEST = join(ROOT, "shared-modules.json");
const SIBLING = "profik";

const hash = (path) =>
  createHash("sha256")
    .update(readFileSync(join(ROOT, path)))
    .digest("hex");

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const files = Object.keys(manifest.files).sort();
const sync = process.argv.includes("--sync");

if (sync) {
  const files_ = Object.fromEntries(files.map((file) => [file, hash(file)]));
  writeFileSync(
    MANIFEST,
    `${JSON.stringify({ ...manifest, files: files_ }, null, 2)}\n`,
  );
  console.log(`shared-modules.json updated (${files.length} files).`);
  process.exit(0);
}

const drifted = files.filter((file) => hash(file) !== manifest.files[file]);

if (drifted.length === 0) {
  console.log(`✓ ${files.length} mirrored modules match their recorded state.`);
  process.exit(0);
}

console.error(
  `\n${drifted.length} mirrored module(s) changed. Each of these also exists in ${SIBLING}:\n`,
);
for (const file of drifted) console.error(`  ${file}`);
console.error(
  `\nCarry the change across to ${SIBLING} (or confirm it does not apply there),` +
    `\nthen record the new state:\n\n  npm run shared:sync\n`,
);
process.exit(1);
