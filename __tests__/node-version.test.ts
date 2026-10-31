import { readFileSync } from "fs";
import { join } from "path";

/**
 * Node is pinned twice: `.nvmrc` for CI and local installs, `eas.json` for
 * EAS builds. They drifted apart silently before anyone looked, so both are
 * read here.
 *
 * The floor is the October 2026 security release (CVE-2026-111497, Brotli in
 * node:zlib, and six more on the 22.x line). Raise it with the next one; never
 * lower it to make a pin pass.
 */
const SECURITY_FLOOR = [22, 23, 4];

const root = join(__dirname, "..");

function parse(version: string): number[] {
  return version.trim().replace(/^v/, "").split(".").map(Number);
}

function atLeast(version: number[], floor: number[]): boolean {
  for (let i = 0; i < floor.length; i++) {
    if (version[i] !== floor[i]) return version[i] > floor[i];
  }
  return true;
}

const nvmrc = readFileSync(join(root, ".nvmrc"), "utf8");
const eas = JSON.parse(readFileSync(join(root, "eas.json"), "utf8")) as {
  build: { base: { node: string } };
};

describe("the pinned Node version", () => {
  it("is the same in .nvmrc and eas.json", () => {
    expect(parse(eas.build.base.node)).toEqual(parse(nvmrc));
  });

  it("is not older than the last Node security release", () => {
    expect(atLeast(parse(nvmrc), SECURITY_FLOOR)).toBe(true);
  });
});
