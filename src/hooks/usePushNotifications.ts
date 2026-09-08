import {
  useRegisterPushTokenMutation,
  useUnregisterPushTokenMutation,
} from "@/src/api/profikApi";
import { resolveNotificationRoute } from "@/src/features/notifications";
import { logError } from "@/src/utils/logger";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router, useRootNavigationState } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

const PROJECT_ID =
  Constants.expoConfig?.extra?.eas?.projectId ??
  Constants.easConfig?.projectId;

// Show notifications in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Registers this device's Expo push token against the signed-in user.
 *
 * `token` is the auth token, not the push token — it is what identifies the
 * account. Keying the effect on it means signing in as a different user
 * re-registers the device; otherwise the previous account keeps receiving this
 * device's notifications.
 *
 * The UI language rides along, because the server has to word a push before the
 * app is anywhere near the screen. It is part of the effect's key for the same
 * reason the auth token is: switching language on the Profile tab has to reach
 * the server, and this is the call that carries it.
 */
export function usePushNotifications(token: string | null) {
  const [registerPushToken] = useRegisterPushTokenMutation();
  const { i18n } = useTranslation();
  const language = i18n.language;
  // Tracks the auth token and language we last registered under, so we retry
  // after a failure but don't re-register on every render.
  const registeredFor = useRef<string | null>(null);

  useEffect(() => {
    const registrationKey = `${token}:${language}`;
    if (!token || registeredFor.current === registrationKey) return;

    let cancelled = false;

    async function register() {
      if (!Device.isDevice) return;
      if (!PROJECT_ID) {
        logError(new Error("Missing EAS projectId; cannot register for push"));
        return;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") return;

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId: PROJECT_ID,
      });

      // unwrap() so a rejected mutation actually throws here — without it the
      // failure is swallowed and we would mark the device as registered.
      await registerPushToken({
        pushToken: pushToken.data,
        language,
      }).unwrap();
      if (!cancelled) {
        registeredFor.current = registrationKey;
      }
    }

    register().catch((err) => {
      // Leave registeredFor unset so the next mount retries.
      logError(err);
    });

    return () => {
      cancelled = true;
    };
  }, [token, language, registerPushToken]);

  useNotificationRouting(token);
}

/**
 * Opens the screen a tapped notification is about.
 *
 * `useLastNotificationResponse` covers both cases in one value: a tap while
 * the app is running, and the tap that launched it from cold. That matters
 * because on a cold start the listener would fire before this hook is
 * mounted, and the notification would be lost.
 *
 * Two things have to be true before navigating, and both can arrive after the
 * response does — so this effect re-runs and retries rather than dropping it:
 *
 *   • the root navigator is mounted, otherwise `router.push` has nothing to
 *     push onto;
 *   • the user is signed in, since every destination is behind the auth gate
 *     and would only bounce back to home.
 */
function useNotificationRouting(token: string | null) {
  const response = Notifications.useLastNotificationResponse();
  const navigationState = useRootNavigationState();
  const isNavigationReady = Boolean(navigationState?.key);

  // Responses stay readable after handling, so remember the last one we acted
  // on. Without this, any re-render would navigate again.
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!response || !isNavigationReady || !token) return;

    const identifier = response.notification.request.identifier;
    if (handledRef.current === identifier) return;

    const target = resolveNotificationRoute(
      response.notification.request.content.data,
    );

    // Mark it handled either way: a payload we cannot route is not going to
    // become routable on the next render.
    handledRef.current = identifier;
    if (!target) return;

    router.push({ pathname: target.pathname, params: target.params } as any);
  }, [response, isNavigationReady, token]);
}

/**
 * Clears this device's push token server-side. Must be called while the auth
 * token is still present, i.e. before the logout action clears it.
 */
export function useUnregisterPushToken() {
  const [unregisterPushToken] = useUnregisterPushTokenMutation();

  return useCallback(async () => {
    try {
      await unregisterPushToken().unwrap();
    } catch (err) {
      // Best-effort: never block logout on this.
      logError(err);
    }
  }, [unregisterPushToken]);
}
