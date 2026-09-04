import {
  profikApi,
  useRequestOtpCodeMutation,
  useVerifyOtpCodeMutation,
} from "@/src/api/profikApi";
import { setToken } from "@/src/store/authSlice";
import { logError } from "@/src/utils/logger";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { classifyPhoneAuthError, phoneAuthErrorKey } from "../errors";
import { normalizePhone } from "../phone";

export type PhoneAuthStep = "phone" | "code";

/**
 * The server allows 3 code requests per 5 minutes. A minute between resends
 * keeps the user well clear of that ceiling while still feeling responsive.
 */
const RESEND_COOLDOWN_SECONDS = 60;

export interface UsePhoneAuthReturn {
  step: PhoneAuthStep;
  /** The normalized E.164 number the code was sent to, for the "we texted…" line. */
  phone: string | null;
  requestCode: (rawPhone: string) => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  resend: () => Promise<void>;
  changeNumber: () => void;
  isLoading: boolean;
  /** Message for the phone field, already translated. */
  phoneError?: string;
  /** Message for the code boxes, already translated. */
  codeError?: string;
  secondsUntilResend: number;
}

/**
 * Drives the whole phone sign-in screen: request a code, verify it, land in the
 * app. There is no separate registration — an unknown number gets an account
 * with nothing but a phone on it, and the name is asked for later, when the
 * contractor first makes an offer and a client needs to see who it's from.
 */
export function usePhoneAuth(returnTo?: string): UsePhoneAuthReturn {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [requestOtpCode, { isLoading: requesting }] =
    useRequestOtpCodeMutation();
  const [verifyOtpCode, { isLoading: verifying }] = useVerifyOtpCodeMutation();

  const [step, setStep] = useState<PhoneAuthStep>("phone");
  const [phone, setPhone] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [codeError, setCodeError] = useState<string | undefined>();
  const [secondsUntilResend, setSecondsUntilResend] = useState(0);

  // Verification is fired automatically once six digits are in, so it can be
  // reached twice for one code if a render slips between the two.
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (secondsUntilResend <= 0) return;
    const timer = setTimeout(
      () => setSecondsUntilResend((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [secondsUntilResend]);

  const sendCode = useCallback(
    async (e164: string) => {
      await requestOtpCode({ phone: e164 }).unwrap();
      setSecondsUntilResend(RESEND_COOLDOWN_SECONDS);
    },
    [requestOtpCode],
  );

  const requestCode = useCallback(
    async (rawPhone: string) => {
      const e164 = normalizePhone(rawPhone);
      if (!e164) {
        setPhoneError(t("auth.errors.phoneInvalid"));
        return;
      }

      setPhoneError(undefined);
      try {
        await sendCode(e164);
        setPhone(e164);
        setCodeError(undefined);
        setStep("code");
      } catch (error: unknown) {
        const kind = classifyPhoneAuthError(error);
        if (kind === "unknown") logError(error, "phoneAuth:requestCode");
        setPhoneError(t(phoneAuthErrorKey(kind)));
      }
    },
    [sendCode, t],
  );

  const resend = useCallback(async () => {
    if (!phone || secondsUntilResend > 0) return;
    setCodeError(undefined);
    try {
      await sendCode(phone);
    } catch (error: unknown) {
      const kind = classifyPhoneAuthError(error);
      if (kind === "unknown") logError(error, "phoneAuth:resend");
      setCodeError(t(phoneAuthErrorKey(kind)));
    }
  }, [phone, secondsUntilResend, sendCode, t]);

  const verifyCode = useCallback(
    async (code: string) => {
      if (!phone || verifyingRef.current) return;
      verifyingRef.current = true;
      setCodeError(undefined);

      try {
        const res = await verifyOtpCode({
          phone,
          code,
          role: "contractor",
        }).unwrap();

        dispatch(setToken(res.token));
        // Clear the cache so user-specific queries refetch with the new token —
        // otherwise the next user sees the previous one's data.
        // @ts-ignore - util is available on the api instance
        dispatch(profikApi.util.resetApiState());

        router.replace((returnTo ?? "/(contractor)/(tabs)/open") as any);
      } catch (error: unknown) {
        const kind = classifyPhoneAuthError(error);
        if (kind === "unknown") logError(error, "phoneAuth:verifyCode");
        setCodeError(t(phoneAuthErrorKey(kind)));
      } finally {
        verifyingRef.current = false;
      }
    },
    [dispatch, phone, returnTo, t, verifyOtpCode],
  );

  const changeNumber = useCallback(() => {
    setStep("phone");
    setCodeError(undefined);
    setPhoneError(undefined);
  }, []);

  return {
    step,
    phone,
    requestCode,
    verifyCode,
    resend,
    changeNumber,
    isLoading: requesting || verifying,
    phoneError,
    codeError,
    secondsUntilResend,
  };
}
