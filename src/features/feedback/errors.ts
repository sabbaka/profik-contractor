import type { AppFeedbackErrorKind } from "./types";

/**
 * Maps an RTK Query error onto the reasons `/feedback/app` can reject a
 * submission. `status` is a number for HTTP responses and a string tag
 * ("FETCH_ERROR", "TIMEOUT_ERROR", "PARSING_ERROR") for transport failures —
 * same pattern as `classifyPhoneAuthError` in `src/features/auth/errors.ts`.
 */
export function classifyAppFeedbackError(error: unknown): AppFeedbackErrorKind {
  if (!error || typeof error !== "object" || !("status" in error)) {
    return "unknown";
  }

  const status = (error as { status: unknown }).status;

  if (typeof status === "number") {
    if (status === 429) return "rateLimited";
    if (status === 401 || status === 403) return "unauthorized";
    if (status === 400 || status === 422) return "validation";
    return "unknown";
  }

  if (status === "FETCH_ERROR" || status === "TIMEOUT_ERROR") return "network";

  return "unknown";
}

/** i18n key carrying the message for each failure reason. */
export function appFeedbackErrorKey(kind: AppFeedbackErrorKind): string {
  return `appFeedback.errors.${kind}`;
}
