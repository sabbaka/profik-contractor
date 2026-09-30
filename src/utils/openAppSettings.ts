import { Alert, Linking } from "react-native";

import { logError } from "./logger";

/**
 * Opens this app's page in the phone's Settings — the only place notification
 * permission can be turned back on once it has been refused.
 *
 * `Linking.openSettings()` can reject on iOS (PROFIK-1, seen on what looked
 * like App Review's device), and a bare `onPress={() => Linking.openSettings()}`
 * turned that into a tap that did nothing and an unhandled rejection. The
 * refusal is reported once, and the person is told where to go by hand.
 *
 * Mirrored in the other app (see `shared-modules.json`); the wording behind
 * `profile.settingsUnavailable` names each app.
 */
export async function openAppSettings(
  t: (key: string) => string,
): Promise<boolean> {
  try {
    await Linking.openSettings();
    return true;
  } catch (error) {
    logError(error, "settings:open");
    Alert.alert(t("common.error"), t("profile.settingsUnavailable"));
    return false;
  }
}
