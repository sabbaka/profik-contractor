import { useGetAppConfigQuery } from "@/src/api/profikApi";
import { logError } from "@/src/utils/logger";
import { isTestFlightInstall } from "@/src/utils/testFlightInstall";
import Constants from "expo-constants";
import { useCallback, useState } from "react";
import { Linking } from "react-native";

/** Profik Pro's App Store page, opened in the App Store app itself. */
export const PRO_APP_STORE_URL = "itms-apps://apps.apple.com/app/id6787445540";
/** The same page on the web, for when the App Store app will not open. */
const PRO_APP_STORE_WEB_URL = "https://apps.apple.com/app/id6787445540";

/**
 * The versions testers have from TestFlight's public link — the only builds
 * that ever ask to move. App Review installs a build with a sandbox receipt
 * too, so without this the reviewer of the next version would see the "go to
 * the App Store" banner, and "TestFlight" in the profile footer. Add a version
 * here only if it is handed out through TestFlight again.
 */
const TESTFLIGHT_VERSIONS: readonly string[] = ["1.1.16"];

// Read once per launch: the receipt does not change while the app runs.
let testFlight: boolean | undefined;

/**
 * This launch is a TestFlight install. Cached for the launch; the profile
 * footer shows it so the detection can be checked on a real phone before the
 * banner is switched on.
 */
export function runsFromTestFlight(): boolean {
  testFlight ??=
    TESTFLIGHT_VERSIONS.includes(Constants.expoConfig?.version ?? "") &&
    isTestFlightInstall();
  return testFlight;
}

// Closing the banner hides it for this launch only — module state rather than
// storage, so the next cold start asks again. A TestFlight build expires; one
// tap on a close button must not be the last the person hears of it.
let dismissedThisLaunch = false;

/**
 * Whether to ask this install to move from TestFlight to the App Store build,
 * and what the banner's two buttons do.
 *
 * Shown only on a TestFlight install (see `isTestFlightInstall`) and only once
 * `GET /app-config` says Pro is live in the store. Nothing else ever asks the
 * server: an App Store or Android install sends no request at all, and a
 * failed one leaves the banner hidden.
 */
export function useAppStoreMoveBanner() {
  const eligible = runsFromTestFlight();
  const { data } = useGetAppConfigQuery(undefined, { skip: !eligible });
  const [dismissed, setDismissed] = useState(dismissedThisLaunch);

  const dismiss = useCallback(() => {
    dismissedThisLaunch = true;
    setDismissed(true);
  }, []);

  const openStore = useCallback(async () => {
    try {
      await Linking.openURL(PRO_APP_STORE_URL);
    } catch (err) {
      logError(err, "appStoreMove.openStore");
      await Linking.openURL(PRO_APP_STORE_WEB_URL).catch((webErr) =>
        logError(webErr, "appStoreMove.openStoreWeb"),
      );
    }
  }, []);

  return {
    visible: eligible && data?.proAppStoreLive === true && !dismissed,
    dismiss,
    openStore,
  };
}

/** Test seam: forget what this launch has read and closed. */
export function resetAppStoreMoveBannerForTests() {
  testFlight = undefined;
  dismissedThisLaunch = false;
}
