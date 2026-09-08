import type { SerializedError } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

import i18n from "@/src/i18n";

export interface User {
  id: string;
  /** Null until the user sets one — an OTP account starts without an email. */
  email: string | null;
  phone: string;
  /** Null until the user sets one. Render a fallback, never the raw value. */
  name: string | null;
  role: string;
  balance: number;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface UploadAvatarParams {
  uri: string;
  fileName?: string;
  mimeType?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RequestOtpParams {
  /** E.164 — run the raw field through `normalizePhone` first. */
  phone: string;
}

export interface VerifyOtpParams {
  phone: string;
  code: string;
  /**
   * Which app is asking. On an unknown phone this picks the role the new
   * account gets; on an existing one a mismatch is a 403.
   */
  role: "client" | "contractor";
  name?: string;
  email?: string;
}

export interface OtpRequestResponse {
  success: boolean;
}

export type AuthResult = { success: true } | { success: false; error: string };

export type ApiError =
  | (FetchBaseQueryError & { data?: { message?: string; code?: string } })
  | SerializedError;

/**
 * The `code` the API attaches to errors a person is meant to read. Absent on
 * validation failures and on anything the framework raises itself, which the
 * app still tells apart by HTTP status.
 */
function serverErrorCode(error: unknown): string | null {
  if (
    error &&
    typeof error === "object" &&
    "data" in error &&
    error.data &&
    typeof error.data === "object" &&
    "code" in error.data &&
    typeof error.data.code === "string"
  ) {
    return error.data.code;
  }
  return null;
}

/**
 * Message to show for an error from the API.
 *
 * Pass `t` and an error carrying a code is read out of `errors.*` in the active
 * locale. Without a key for it — or without `t` — the server's own English
 * message is used, which is what every caller got before codes existed, so a
 * missing translation degrades rather than breaks.
 */
export function extractErrorMessage(
  error: unknown,
  t?: (key: string) => string,
): string {
  const code = serverErrorCode(error);
  if (t && code && i18n.exists(`errors.${code}`)) {
    return t(`errors.${code}`);
  }
  if (error && typeof error === "object") {
    if ("data" in error && error.data && typeof error.data === "object") {
      if ("message" in error.data && typeof error.data.message === "string") {
        return error.data.message;
      }
    }
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
  }
  return "An unknown error occurred";
}
