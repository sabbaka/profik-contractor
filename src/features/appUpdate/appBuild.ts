import * as Application from "expo-application";
import { Platform } from "react-native";

import {
  appBuildHeader,
  type AppName,
  isBelowMinimum,
} from "@/src/utils/appVersion";
import { runningUpdateId } from "@/src/utils/updateLabel";

import type { AppConfig } from "@/src/api/types";

/** Which of the two apps this is, as the backend names them. */
export const APP_NAME: AppName = "contractor";

/** Where "Update" leads: this app's own page in the phone's store. */
export const STORE_URL =
  Platform.OS === "android"
    ? "https://play.google.com/store/apps/details?id=com.profik.contractor"
    : "https://apps.apple.com/app/id6787445540";

/**
 * The version of the binary, which is also the runtime version an update is
 * published for — so it names the store build even when newer JavaScript is
 * running on top of it. Null on the web.
 */
export function installedVersion(): string | null {
  return Application.nativeApplicationVersion;
}

/** `X-Profik-App` for every request, or null when the version is unknown. */
export function appBuildHeaderValue(): string | null {
  return appBuildHeader({
    app: APP_NAME,
    version: installedVersion(),
    platform: Platform.OS,
    updateId: runningUpdateId(),
  });
}

/**
 * Whether the backend has stopped supporting this install. A config from a
 * backend older than the field, or no config at all, never says so.
 */
export function updateRequired(config: AppConfig | undefined): boolean {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return false;
  const minimum = config?.minSupportedVersion?.[APP_NAME]?.[Platform.OS];
  return isBelowMinimum(installedVersion(), minimum);
}
