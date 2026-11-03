import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";

export interface InstallProbe {
  os: string;
  /** `Paths.document.uri` — the data container's Documents, with a trailing slash. */
  documentUri: string;
  /** `Paths.bundle.uri` — the `.app` directory, with a trailing slash. */
  bundleUri: string;
  exists: (uri: string) => boolean;
}

const deviceProbe = (): InstallProbe => ({
  os: Platform.OS,
  documentUri: Paths.document.uri,
  bundleUri: Paths.bundle.uri,
  exists: (uri) => new File(uri).exists,
});

/** The directory a `…/name/` uri sits in, with a trailing slash. */
function parentOf(uri: string): string {
  return uri.replace(/[^/]+\/?$/, "");
}

/**
 * Whether this iPhone runs a TestFlight install, so it can be asked to move to
 * the App Store build once there is one (`AppStoreMoveBanner`).
 *
 * The binary is the same one the App Store ships, so nothing compiled in can
 * tell them apart; what differs is the receipt iOS writes at install —
 * `StoreKit/sandboxReceipt` for TestFlight, `StoreKit/receipt` for the store.
 * It is read here through expo-file-system rather than a native module because
 * 1.1.16 was already in TestFlight when this was needed, and only JS reaches
 * it. expo-file-system leaves paths outside its own folders to the OS, and an
 * app may read its own receipt. iOS keeps the receipt beside the data
 * container's Documents, as far as can be told without a device at hand, so
 * both containers are looked in.
 *
 * A build installed from Xcode has a sandbox receipt too, once something has
 * been bought in it, and also an embedded provisioning profile that TestFlight
 * and App Store builds do not — the same rule as the `expo-is-testflight`
 * package. Any doubt — a missing receipt, a file system that will not answer —
 * comes out false, so an App Store user is never told to go to the App Store.
 */
export function isTestFlightInstall(probe?: InstallProbe): boolean {
  if ((probe?.os ?? Platform.OS) !== "ios") return false;
  try {
    probe ??= deviceProbe();
    if (probe.exists(`${probe.bundleUri}embedded.mobileprovision`)) {
      return false;
    }
    const { exists } = probe;
    const storeKitDirs = [probe.documentUri, probe.bundleUri].map(
      (dir) => `${parentOf(dir)}StoreKit/`,
    );
    // Installing the App Store build over a TestFlight one keeps the data
    // container, and nothing promises the old sandbox receipt goes with it.
    // A store receipt beside it is the newer fact: that is the store build.
    if (storeKitDirs.some((dir) => exists(`${dir}receipt`))) return false;
    return storeKitDirs.some((dir) => exists(`${dir}sandboxReceipt`));
  } catch {
    return false;
  }
}
