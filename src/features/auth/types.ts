import type { SerializedError } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

import i18n from "@/src/i18n";
import * as Sentry from "@sentry/react-native";
import type { TermsState } from "./terms";

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
  /**
   * Terms-of-use state. Optional in the type, not on the wire: the server
   * always sends it, and the app reads its absence as "nothing to accept" so
   * that a rollback cannot lock every install behind an undismissable screen.
   * See `termsRequired`.
   */
  terms?: TermsState;
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

export interface AcceptTermsParams {
  /** Echoed back from `terms.currentVersion`; the server refuses anything else. */
  version: string;
  /** What the person was reading. The binding document is Czech. */
  locale?: string;
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
export function serverErrorCode(error: unknown): string | null {
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
 * An error carrying a code is read out of `errors.*` in the active locale.
 * Anything else — no code, a code with no key yet, a transport failure — gets
 * `fallbackKey`, never the server's own text: that is English, written for
 * developers ("price must not be less than 200"), and a server case worth
 * wording for people gets a code of its own. The raw text goes to the Sentry
 * breadcrumbs, so it still rides along with whatever event follows.
 */
export function extractErrorMessage(
  error: unknown,
  t: (key: string) => string,
  fallbackKey = "errors.unknown",
): string {
  const code = serverErrorCode(error);
  if (code && i18n.exists(`errors.${code}`)) {
    return t(`errors.${code}`);
  }
  const raw = rawErrorMessage(error);
  if (raw) {
    Sentry.addBreadcrumb({
      category: "api.error",
      level: "warning",
      message: raw,
      data: {
        ...(errorStatus(error) != null && { status: errorStatus(error) }),
        ...(code && { code }),
      },
    });
  }
  return t(fallbackKey);
}

function errorStatus(error: unknown): number | string | undefined {
  if (error && typeof error === "object" && "status" in error) {
    const { status } = error as { status: unknown };
    if (typeof status === "number" || typeof status === "string") return status;
  }
  return undefined;
}

function rawErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("data" in error && error.data && typeof error.data === "object") {
    if ("message" in error.data) {
      const { message } = error.data as { message: unknown };
      if (typeof message === "string") return message;
      // Nest's ValidationPipe answers with one message per failed field.
      if (Array.isArray(message)) return message.join("; ");
    }
  }
  if ("error" in error && typeof error.error === "string") return error.error;
  if ("message" in error && typeof error.message === "string") {
    return error.message;
  }
  return undefined;
}
