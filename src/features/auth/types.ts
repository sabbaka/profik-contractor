import type { SerializedError } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

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
  (FetchBaseQueryError & { data?: { message?: string } }) | SerializedError;

export function extractErrorMessage(error: unknown): string {
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
