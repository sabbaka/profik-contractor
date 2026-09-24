import {
  profikApi,
  useRegisterPushTokenMutation,
  useUnregisterPushTokenMutation,
} from "@/src/api/profikApi";
import {
  isChatOnScreen,
  readNotificationIds,
  resolveNotificationRoute,
} from "@/src/features/notifications";
import { track } from "@/src/utils/analytics";
import { logError } from "@/src/utils/logger";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router, useRootNavigationState, useSegments } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import { useDispatch } from "react-redux";

const PROJECT_ID =
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

/**
 * Decides what an arriving notification does while the app is open.
 *
 * Everything announces itself except news the reader is already looking at:
 * a message for the offer chat on screen is delivered silently, because
 * `useNotificationInvalidation` below is about to put it in the thread (that
 * screen still polls too — see its own comment). Announcing it would banner,
 * sound and badge a message the reader can already see arrive.
 *
 * Suppression is per offer, not per screen — a message from a different chat
 * still deserves a banner while this one is open.
 */
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const { offerId } = readNotificationIds(notification.request.content.data);
    const announce = !isChatOnScreen(offerId);
    return {
      shouldShowAlert: announce,
      shouldPlaySound: announce,
      shouldSetBadge: announce,
      shouldShowBanner: announce,
      shouldShowList: announce,
    };
  },
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
  useNotificationInvalidation(token);
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
  const segments = useSegments() as unknown as string[];
  // A mounted navigator is not yet a settled one: on a cold start it sits on
  // `app/index.tsx` first, whose `<Redirect>` to the Open tab runs after this
  // effect would already have pushed the chat — and replaces it, so the tap
  // lands on Open Jobs instead. Empty segments mean that redirect has not
  // happened yet.
  const isNavigationReady =
    Boolean(navigationState?.key) && segments.length > 0;

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
 * Treats an arriving notification as what it already is: the server telling
 * us its data changed.
 *
 * The server knows an offer was accepted, or a message was sent — that is
 * why it sent the push. Polling on a timer to discover the same fact is work
 * both sides can skip, so the notification invalidates the cache entries it
 * is about and RTK Query refetches only what a screen is actually subscribed
 * to. Nothing is fetched when nothing on screen cares.
 *
 * This is arrival, not the tap `useNotificationRouting` handles above: it
 * fires while the user may already be looking at the screen the news
 * belongs to, which is the case a timer served worst. Ported from
 * `profik_client`'s `usePushNotifications.ts`, which dropped its own polling
 * in favour of this for the same reason.
 *
 * Delivery is only guaranteed in the foreground, which is the case that
 * matters here — a notification that arrives in the background is followed
 * by the user opening the app, and `refetchOnFocus` (wired on the queries
 * these tags reach) covers that instead.
 */
function useNotificationInvalidation(token: string | null) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!token) return;

    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data;
        const { jobId, offerId } = readNotificationIds(data);
        const pushType = (data as { type?: string } | null)?.type;

        // Only `type: "message_received"` is a chat message — `offerId`
        // alone also carries "offer_created"/"job_completed" pushes about
        // the same conversation, and counting those would overstate how
        // often a client actually wrote something.
        if (offerId && pushType === "message_received") {
          track("chat_message_received");
        }
        // Fires on the actual status transition, not on every time the
        // contractor happens to look at an already-completed job — the
        // job detail screen used to report this on view, which both
        // double-counted a job revisited later and never fired at all for
        // one nobody reopened. `offer_price_kc` isn't in the push payload,
        // so it goes out without one; see `AnalyticsEventMap`.
        if (jobId && pushType === "job_completed") {
          track("job_completed", { job_id: jobId });
        }

        const tags: any[] = [];
        if (offerId) {
          // Mirrors sendOfferMessage's own invalidation in profikApi.ts —
          // this chat's thread plus the two blunt tags that keep the
          // Messages list and its unread badge in step.
          tags.push(
            { type: "OfferMessages", id: offerId },
            "Conversations",
            "Unread",
          );
        }
        if (jobId) {
          // Mirrors createOffer's own invalidation — the job itself, its
          // offer, and both list-level tags so My Jobs and Open Jobs pick
          // up a status change without needing their own poll.
          tags.push(
            { type: "Jobs", id: jobId },
            { type: "Jobs", id: "LIST" },
            { type: "Offers", id: jobId },
            { type: "Offers", id: "LIST" },
            "Jobs",
          );
        }

        if (tags.length === 0) return;
        dispatch(profikApi.util.invalidateTags(tags));
      },
    );

    return () => subscription.remove();
  }, [dispatch, token]);
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
