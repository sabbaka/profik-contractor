import {
  useRegisterPushTokenMutation,
  useUnregisterPushTokenMutation,
} from "@/src/api/profikApi";
import { logError } from "@/src/utils/logger";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef } from "react";
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
 */
export function usePushNotifications(token: string | null) {
  const [registerPushToken] = useRegisterPushTokenMutation();
  // Tracks which auth token we last registered under, so we retry after a
  // failure but don't re-register on every render.
  const registeredFor = useRef<string | null>(null);

  useEffect(() => {
    if (!token || registeredFor.current === token) return;

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
      await registerPushToken(pushToken.data).unwrap();
      if (!cancelled) {
        registeredFor.current = token;
      }
    }

    register().catch((err) => {
      // Leave registeredFor unset so the next mount retries.
      logError(err);
    });

    return () => {
      cancelled = true;
    };
  }, [token, registerPushToken]);

  useEffect(() => {
    if (!token) return;

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (_response) => {
        // Future: navigate to the relevant screen based on response.notification.request.content.data
      }
    );

    return () => subscription.remove();
  }, [token]);
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
