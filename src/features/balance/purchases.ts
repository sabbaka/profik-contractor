import { logError } from "@/src/utils/logger";
import { Platform } from "react-native";
import type PurchasesSdk from "react-native-purchases";
import type { PURCHASES_ERROR_CODE as PurchasesErrorCode } from "react-native-purchases";

type Sdk = {
  default: typeof PurchasesSdk;
  PURCHASES_ERROR_CODE: typeof PurchasesErrorCode;
};

/**
 * The public RevenueCat SDK key for the App Store app.
 *
 * `EXPO_PUBLIC_*` is inlined at build time, so on EAS it has to be set as an
 * environment variable of the same name. Without one, buying credits is
 * unavailable and the Balance screen says so — iOS never falls back to Stripe,
 * which App Review guideline 3.1.1 does not allow for credits.
 *
 * Read on every call rather than once at module load, so a test can set it.
 */
export function revenueCatKey(): string {
  return (process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? "").trim();
}

/** iOS buys credits through the App Store; every other platform through Stripe. */
export const sellsThroughAppStore = Platform.OS === "ios";

/** True when this build can sell credits through the App Store at all. */
export function inAppPurchasesAvailable(): boolean {
  return sellsThroughAppStore && revenueCatKey() !== "";
}

let configured = false;

/**
 * The SDK, loaded on first use rather than imported.
 *
 * Android never sells through it, so its bundle never evaluates the module;
 * and the package ships untranspiled ESM that jest cannot parse, so every test
 * whose import graph reaches sign-in or sign-out would otherwise need a mock
 * of a store it never touches. Tests of the purchase flow mock the package.
 */
export function purchasesSdk(): Sdk {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("react-native-purchases") as Sdk;
}

/**
 * Configures RevenueCat once, at launch. A no-op off iOS and without a key.
 * Anonymous until `identifyPurchaser` runs — and purchases are only offered
 * to a signed-in contractor, so none is ever made under an anonymous id.
 */
export function configurePurchases(): void {
  if (configured || !inAppPurchasesAvailable()) return;
  try {
    purchasesSdk().default.configure({ apiKey: revenueCatKey() });
    configured = true;
  } catch (error) {
    logError(error, "purchases:configure");
  }
}

/** True once `configurePurchases` has succeeded. */
export function purchasesConfigured(): boolean {
  return configured;
}

/**
 * Ties RevenueCat's customer to the Profik user id, which is what the
 * webhook hands the backend to know whose balance to credit. Safe to call
 * repeatedly with the same id — the SDK does nothing when it already matches.
 *
 * Throws, unlike the other two: a purchase must not go ahead under an
 * identity that failed to switch. Identity changes outside a purchase go
 * through `identifyPurchaser`, which logs instead.
 */
export async function logInPurchaser(userId: string): Promise<void> {
  if (!configured) return;
  await purchasesSdk().default.logIn(userId);
}

/** `logInPurchaser` for sign-in and launch, where a failure is only logged. */
export function identifyPurchaser(userId: string): void {
  logInPurchaser(userId).catch((error: unknown) => {
    logError(error, "purchases:logIn");
  });
}

/**
 * Drops the identity on sign-out, beside `resetAnalytics`. Logging out an
 * already anonymous customer is an error in the SDK and nothing to report.
 */
export async function resetPurchaser(): Promise<void> {
  if (!configured) return;
  const sdk = purchasesSdk();
  try {
    await sdk.default.logOut();
  } catch (error) {
    if (
      (error as { code?: unknown } | null)?.code ===
      sdk.PURCHASES_ERROR_CODE.LOG_OUT_ANONYMOUS_USER_ERROR
    ) {
      return;
    }
    logError(error, "purchases:logOut");
  }
}
