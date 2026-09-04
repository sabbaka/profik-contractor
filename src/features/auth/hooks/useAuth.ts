import { profikApi } from "@/src/api/profikApi";
import { useUnregisterPushToken } from "@/src/hooks/usePushNotifications";
import { logout as logoutAction } from "@/src/store/authSlice";
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

    // Clear auth state (token, user)
    dispatch(logoutAction());

    // Reset API state to clear cached data
    // @ts-ignore - util is available on the api instance
    dispatch(profikApi.util.resetApiState());

    // No need to navigate manually, AuthGate in _layout.tsx will handle redirection
    // when it detects token is null
  };

  return { logout };
}
