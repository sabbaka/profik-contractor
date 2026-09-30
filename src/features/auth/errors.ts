/** The ways `/auth/otp/*` can fail that the user should be able to tell apart. */
export type PhoneAuthErrorKind =
  | "invalidCode"
  | "expired"
  | "wrongApp"
  | "tooManyAttempts"
  | "undeliverable"
  | "invalidPhone"
  | "network"
  | "unavailable"
  | "unknown";

/**
 * Maps an RTK Query error onto a reason the phone sign-in flow can fail.
 * `status` is a number for HTTP responses and a string tag ("FETCH_ERROR",
 * "TIMEOUT_ERROR", "PARSING_ERROR") for transport failures.
 *
 * 404 is Twilio's "no pending verification" — the code expired or was already
 * used, which needs different advice from a code that was simply mistyped.
 * 403 is the backend refusing an account that belongs to the other app.
 * 422 is the backend saying the carrier side refused the number — Twilio would
 * not send to it (a blocked prefix, a region it does not cover), so retrying
 * the same number is pointless and the message has to say to use another one.
 * 400 means "check the number" only when asking for a code (`step`
 * "requestCode"): there Twilio or our phone validation refused what was
 * typed. After that the number has been accepted, so a 400 from resend or
 * verify is not the person's to fix and stays "unknown" — reported, not
 * dressed up as a typing mistake. 502/503/504 are a gateway between the phone
 * and us giving up (PROFIK-5:
 * Google Play's pre-launch robot sits behind a proxy that answers 504 in under
 * 100 ms); retrying later is the advice, and neither is our code failing, so
 * `usePhoneAuth` does not report them.
 */
export function classifyPhoneAuthError(
  error: unknown,
  step?: "requestCode",
): PhoneAuthErrorKind {
  if (!error || typeof error !== "object" || !("status" in error)) {
    return "unknown";
  }

  const status = (error as { status: unknown }).status;

  if (typeof status === "number") {
    if (status === 429) return "tooManyAttempts";
    if (status === 403) return "wrongApp";
    if (status === 422) return "undeliverable";
    if (status === 404) return "expired";
    if (status === 401) return "invalidCode";
    if (status === 400 && step === "requestCode") return "invalidPhone";
    if (status === 502 || status === 503 || status === 504) {
      return "unavailable";
    }
    return "unknown";
  }

  if (status === "FETCH_ERROR" || status === "TIMEOUT_ERROR") return "network";

  return "unknown";
}

/** i18n key carrying the message for each failure reason. */
export function phoneAuthErrorKey(kind: PhoneAuthErrorKind): string {
  return `auth.otp.errors.${kind}`;
}
