/*
 * Both apps carry this module at this same path, byte for byte, and
 * `shared-modules.json` in each records it. A change here fails
 * `npm run shared:check` until it has been carried to the other app.
 */

export type AppName = "client" | "contractor";

const VERSION = /^\d+\.\d+\.\d+$/;

function parts(version: string): number[] | null {
  return VERSION.test(version) ? version.split(".").map(Number) : null;
}

/**
 * Whether this install is older than the oldest version the backend still
 * lets run (`minSupportedVersion` in `GET /app-config`).
 *
 * Every doubt resolves to "no": a missing minimum, a version this cannot
 * read on either side, a build that does not know its own version. The
 * answer "yes" replaces the whole app with one screen, so it is only given
 * when both numbers are plain `1.2.3` and one is smaller — a typo in an
 * environment variable must not be able to lock everyone out.
 *
 * Compared number by number, not as text: as text "1.1.9" sorts after
 * "1.1.10".
 */
export function isBelowMinimum(
  current: string | null | undefined,
  minimum: string | null | undefined,
): boolean {
  if (!current || !minimum) return false;
  const have = parts(current);
  const need = parts(minimum);
  if (!have || !need) return false;
  for (let i = 0; i < 3; i++) {
    if (have[i] !== need[i]) return have[i] < need[i];
  }
  return false;
}

/**
 * The value of the `X-Profik-App` header: `client/1.1.33/ios`, with the
 * over-the-air update's short id appended when one is running. The backend
 * writes it into its request log, which is the only place that says which
 * builds are still out there. Null when the build cannot name its version —
 * the backend reads a missing header as "unknown".
 */
export function appBuildHeader(build: {
  app: AppName;
  version: string | null | undefined;
  platform: string;
  updateId?: string | null;
}): string | null {
  if (!build.version || !VERSION.test(build.version)) return null;
  const base = `${build.app}/${build.version}/${build.platform}`;
  return build.updateId ? `${base}/${build.updateId}` : base;
}
