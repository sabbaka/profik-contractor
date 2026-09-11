import {
  useMeQuery,
  useRefreshVerificationMutation,
  useStartVerificationMutation,
} from "@/src/api/profikApi";
import { extractErrorMessage } from "@/src/features/auth/types";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AppState, Linking } from "react-native";
import type { VerificationStatus, VerificationSummary } from "../types";

/** Times the server is asked to reconcile after the browser hands control back. */
export const RECONCILE_ATTEMPTS = 3;

/** Gap between those attempts. */
export const RECONCILE_INTERVAL_MS = 2000;

/** Statuses the provider will not move away from on its own. */
const SETTLED: ReadonlySet<string> = new Set<VerificationStatus>([
  "approved",
  "declined",
  "abandoned",
  "expired",
]);

export interface UseIdentityVerificationReturn {
  verification?: VerificationSummary;
  /** Opens the hosted flow. Resolves once the browser has been handed the URL. */
  start: () => Promise<boolean>;
  /** Asks the server to check with the provider now. */
  reconcile: () => Promise<VerificationSummary | null>;
  isStarting: boolean;
  isReconciling: boolean;
}

/**
 * Drives the identity verification flow.
 *
 * **The browser choice is load-bearing, and deliberately unlike
 * `src/features/balance/hooks/useTopup.ts`.** That hook opens Stripe with
 * `WebBrowser.openAuthSessionAsync`, which on iOS is an
 * `ASWebAuthenticationSession` backed by `SFSafariViewController`. Camera
 * access there is not reliably granted — the permission prompt is reported
 * missing on some iOS versions and some devices, and the request is then
 * silently denied. A document-and-selfie flow needs the camera, so a flow that
 * works on one phone and quietly dies on a contractor's is not a flow.
 *
 * `Linking.openURL` hands the page to the real browser, where the camera works
 * the way the web does. The cost is that the app cannot watch the session, so
 * the result is reconciled on returning rather than read from a browser result.
 * Do not "fix" this back to `openAuthSessionAsync`.
 *
 * The decision reaches the server by webhook, and the provider retries it only
 * twice before giving up — which is why returning triggers an explicit
 * reconcile rather than a plain refetch.
 */
export function useIdentityVerification(): UseIdentityVerificationReturn {
  const { t } = useTranslation();
  const { data: user } = useMeQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [startMutation, { isLoading: isStarting }] =
    useStartVerificationMutation();
  const [refreshMutation, { isLoading: isReconciling }] =
    useRefreshVerificationMutation();

  /**
   * Whether we are waiting for someone to come back from the browser. A ref,
   * not state: it is read inside an AppState listener that must not be torn
   * down and rebuilt on every render.
   */
  const awaitingReturn = useRef(false);

  const reconcile =
    useCallback(async (): Promise<VerificationSummary | null> => {
      let latest: VerificationSummary | null = null;

      // Polling rather than a single call, because the webhook may not have
      // landed at the moment the browser handed control back. Each attempt makes
      // the server ask the provider directly, so this converges as soon as the
      // provider has an answer — it is not waiting on our own webhook.
      for (let attempt = 0; attempt < RECONCILE_ATTEMPTS; attempt++) {
        try {
          latest = await refreshMutation().unwrap();
        } catch {
          // A provider or network hiccup. The profile keeps showing the last
          // known state and the next resume tries again.
          return latest;
        }

        if (SETTLED.has(latest.status)) return latest;

        if (attempt < RECONCILE_ATTEMPTS - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, RECONCILE_INTERVAL_MS),
          );
        }
      }

      return latest;
    }, [refreshMutation]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" || !awaitingReturn.current) return;
      awaitingReturn.current = false;
      void reconcile();
    });

    return () => subscription.remove();
  }, [reconcile]);

  const start = useCallback(async (): Promise<boolean> => {
    try {
      const session = await startMutation().unwrap();

      const opened = await Linking.canOpenURL(session.url);
      if (!opened) {
        Alert.alert(t("common.error"), t("verification.browserFailed"));
        return false;
      }

      // Set before opening: on Android the app can be backgrounded before this
      // promise settles, and a listener that has not been armed yet would miss
      // the return.
      awaitingReturn.current = true;
      await Linking.openURL(session.url);
      return true;
    } catch (error) {
      awaitingReturn.current = false;
      // extractErrorMessage resolves the backend's code out of `errors.*`, so
      // "already verified", "too many attempts" and "not configured" each read
      // as themselves rather than as one generic failure. It always returns
      // something — the server's own English message when there is no key.
      Alert.alert(t("common.error"), extractErrorMessage(error, t));
      return false;
    }
  }, [startMutation, t]);

  return {
    verification: user?.identityVerification,
    start,
    reconcile,
    isStarting,
    isReconciling,
  };
}
