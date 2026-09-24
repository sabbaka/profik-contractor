import { profikApi } from "@/src/api/profikApi";
import { useUnregisterPushToken } from "@/src/hooks/usePushNotifications";
import { logout as logoutAction } from "@/src/store/authSlice";
import { resetAnalytics } from "@/src/utils/analytics";
import * as Notifications from "expo-notifications";
import { useDispatch } from "react-redux";

export interface UseAuthReturn {
  logout: () => Promise<void>;
}

/**
 * Signing in lives in `usePhoneAuth` — this is only the way back out.
 */
export function useAuth(): UseAuthReturn {
  const dispatch = useDispatch();
  const unregisterPushToken = useUnregisterPushToken();

  const logout = async () => {
    // Drop this device's push token server-side first — it needs the auth
    // header, and without it the next contractor to sign in on this device
    // keeps receiving the previous one's job notifications.
    await unregisterPushToken();

    // useAppIconBadge (in the tabs layout) stops running the moment AuthGate
    // unmounts it below, so nothing else re-syncs the icon after this —
    // leaving the previous account's unread count sitting on it until
    // whoever signs in next happens to have a lower one.
    Notifications.setBadgeCountAsync(0).catch(() => {});

    // Clear auth state (token, user)
    dispatch(logoutAction());

    // Reset API state to clear cached data
    // @ts-ignore - util is available on the api instance
    dispatch(profikApi.util.resetApiState());

    // Same reason as the cache reset above, one layer over: an identity that
    // outlives the session files the next person's events under this one.
    resetAnalytics();

    // No need to navigate manually, AuthGate in _layout.tsx will handle redirection
    // when it detects token is null
  };

  return { logout };
}
