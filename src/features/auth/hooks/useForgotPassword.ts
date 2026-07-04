import {
  profikApi,
  useForgotPasswordRequestCodeMutation,
  useForgotPasswordVerifyMutation,
} from "@/src/api/profikApi";
import { router } from "expo-router";
import { useDispatch } from "react-redux";
import { setToken } from "@/src/store/authSlice";
import { AuthResult, extractErrorMessage } from "../types";

export interface UseForgotPasswordReturn {
  requestCode: (phone: string) => Promise<AuthResult>;
  verifyAndReset: (phone: string, code: string, newPassword: string) => Promise<AuthResult>;
  isLoading: boolean;
}

export function useForgotPassword(): UseForgotPasswordReturn {
  const dispatch = useDispatch();
  const [requestCodeMutation, { isLoading: requesting }] =
    useForgotPasswordRequestCodeMutation();
  const [verifyMutation, { isLoading: verifying }] =
    useForgotPasswordVerifyMutation();

  const requestCode = async (phone: string): Promise<AuthResult> => {
    try {
      await requestCodeMutation({ phone }).unwrap();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: extractErrorMessage(err) };
    }
  };

  const verifyAndReset = async (
    phone: string,
    code: string,
    newPassword: string,
  ): Promise<AuthResult> => {
    try {
      const res = await verifyMutation({ phone, code, newPassword }).unwrap();
      dispatch(setToken(res.token));
      // @ts-ignore
      dispatch(profikApi.util.resetApiState());
      router.replace("/(contractor)/open" as any);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: extractErrorMessage(err) };
    }
  };

  return {
    requestCode,
    verifyAndReset,
    isLoading: requesting || verifying,
  };
}
