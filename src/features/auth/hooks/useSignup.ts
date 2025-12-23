import {
  profikApi,
  useRequestSmsCodeMutation,
  useVerifySmsCodeMutation,
} from "@/src/api/profikApi";
import { setToken } from "@/src/store/authSlice";
import { router } from "expo-router";
import { Alert } from "react-native";
import { useDispatch } from "react-redux";
import {
  AuthResult,
  extractErrorMessage,
  RequestSmsCodeParams,
  VerifySmsCodeParams,
} from "../types";

export interface SignupData {
  phone: string;
  email?: string;
  password: string;
  name: string;
  code?: string;
}

export interface UseSignupReturn {
  signup: (data: SignupData) => Promise<AuthResult>;
  isLoading: boolean;
}

export function useSignup(): UseSignupReturn {
  const dispatch = useDispatch();
  const [requestSmsCode, { isLoading: requesting }] =
    useRequestSmsCodeMutation();
  const [verifySmsCode, { isLoading: verifying }] = useVerifySmsCodeMutation();

  const signup = async (data: SignupData): Promise<AuthResult> => {
    const { phone, email, password, name, code } = data;

    if (!phone) {
      const errorMessage = "Phone is required";
      Alert.alert("❌ Error", errorMessage);
      return { success: false, error: errorMessage };
    }

    try {
      // Step 1: no code yet -> request SMS code for registration
      if (!code) {
        const params: RequestSmsCodeParams = {
          phone,
          purpose: "register",
        };

        await requestSmsCode(params).unwrap();

        Alert.alert(
          "✅ Code sent",
          "We sent an SMS code to your phone. Enter it and tap Sign Up again."
        );

        return { success: true };
      }

      const verifyParams: VerifySmsCodeParams = {
        phone,
        code,
        email,
        password,
        name,
        role: "contractor",
      };

      const res = await verifySmsCode(verifyParams).unwrap();

      dispatch(setToken(res.token));
      // Clear RTK Query cache so user-specific queries refetch with the new token
      // @ts-ignore - util is available on the api instance
      dispatch(profikApi.util.resetApiState());

      router.replace("/(contractor)/open" as any);

      return { success: true };
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err) || "Signup failed";
      Alert.alert("❌ Error", errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  return { signup, isLoading: requesting || verifying };
}
