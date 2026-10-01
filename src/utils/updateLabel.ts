import * as Updates from "expo-updates";

/*
 * Both apps carry this module at this same path, byte for byte, and
 * `shared-modules.json` in each records it. A change here fails
 * `npm run shared:check` until it has been carried to the other app.
 */

type RunningUpdate = Pick<
  typeof Updates,
  "isEnabled" | "isEmbeddedLaunch" | "updateId"
>;

/**
 * Short id of the over-the-air update this launch is running, for the profile
 * footer: until it was shown there, the only way to tell whether an update had
 * reached a phone was to spot a changed word after a restart.
 *
 * Null for a launch from the bundle inside the binary — the store version
 * already identifies that one — and for dev builds and Expo Go, where updates
 * are switched off. Eight characters of the update's own id, which is per
 * platform: it is not the group id `eas update:list` prints, so look it up on
 * the update's page, not by group.
 *
 * Only reads what is running. It never checks for, fetches or reloads an
 * update: that behaviour is the release setup's, not the profile's.
 */
export function runningUpdateId(
  updates: RunningUpdate = Updates,
): string | null {
  if (!updates.isEnabled || updates.isEmbeddedLaunch || !updates.updateId) {
    return null;
  }
  return updates.updateId.slice(0, 8);
}
