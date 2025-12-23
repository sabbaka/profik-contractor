import { profikApi, useLoginMutation } from "@/src/api/profikApi";
import { logout as logoutAction, setToken } from "@/src/store/authSlice";
import { router } from "expo-router";
import { Alert } from "react-native";
import { useDispatch } from "react-redux";
import { AuthResult, extractErrorMessage, LoginParams } from "../types";

export interface UseAuthReturn {
  login: (phone: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  isLoading: boolean;
}

export function useAuth(): UseAuthReturn {
  const dispatch = useDispatch();
  const [loginMutation, { isLoading }] = useLoginMutation();

  const login = async (
    phone: string,
    password: string
  ): Promise<AuthResult> => {
    try {
      const loginParams: LoginParams = { phone, password };
      const res = await loginMutation(loginParams).unwrap();
      dispatch(setToken(res.token));
      // Clear RTK Query cache so user-specific queries (e.g., /auth/me) refetch with the new token
      // This prevents showing previous user's cached data after switching accounts
      // @ts-ignore - util is available on the api instance
      dispatch(profikApi.util.resetApiState());

      // Navigate to Home immediately
      router.replace("/(contractor)/open" as any);
      return { success: true };
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err) || "Login failed";
      Alert.alert("Error", errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    // Clear auth state (token, user)
    dispatch(logoutAction());

    // Reset API state to clear cached data
    // @ts-ignore - util is available on the api instance
    dispatch(profikApi.util.resetApiState());

    // No need to navigate manually, AuthGate in _layout.tsx will handle redirection
    // when it detects token is null
  };

  return { login, logout, isLoading };
}
