import * as Sentry from "@sentry/react-native";
import { Alert } from "react-native";

/**
 * Centralised place where every caught error in the app eventually lands.
 *
 * For now it just logs to the JS console (visible in Metro / Flipper / Xcode
 * console / Logcat). In dev it also shows an `Alert` with the message+stack
 * so a crash that would normally take the app down is at least visible to the
 * developer instead of silently disappearing.
 *
 * The signature is intentionally minimal — when we wire up Sentry / Bugsnag
 * later, we just have to forward `error` and `context` from this single
 * function.
 */
export function logError(
  error: unknown,
  context?: string,
  extra?: Record<string, unknown>,
) {
  const tag = context ? `[${context}]` : "[error]";
  // An RTK Query rejection is a plain object; its JSON made a Sentry title of
  // "Error: {" for every failure alike. Name it by status, path and context
  // instead, and carry the object itself in `extra`.
  const apiTitle = apiErrorTitle(error, context);
  const normalized = apiTitle
    ? { message: apiTitle, stack: undefined }
    : normalizeError(error);
  if (apiTitle) extra = { ...extra, error: safeJsonStringify(error) };

  // 1. Always log so it shows up in Metro / Xcode / Logcat / RN Debugger.
  if (extra) {
    console.error(tag, normalized.message, normalized.stack, extra);
  } else {
    console.error(tag, normalized.message, normalized.stack);
  }

  // 2. In dev — surface the error in front of the developer so it isn't
  //    missed in noisy console output.
  if (__DEV__) {
    const body = [
      normalized.message,
      normalized.stack ? `\n\nStack:\n${normalized.stack}` : "",
      extra ? `\n\nExtra:\n${safeJsonStringify(extra)}` : "",
    ].join("");
    Alert.alert(`Caught error${context ? ` · ${context}` : ""}`, body);
  }

  // 3. Forward to Sentry. No-op when the SDK is disabled (no DSN, e.g. dev).
  Sentry.captureException(
    error instanceof Error ? error : new Error(normalized.message),
    { tags: context ? { context } : undefined, extra },
  );
}

interface NormalizedError {
  message: string;
  stack?: string;
}

function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  if (typeof error === "string") {
    return { message: error };
  }
  if (error && typeof error === "object") {
    const message =
      (error as { message?: unknown }).message?.toString() ??
      safeJsonStringify(error);
    return { message };
  }
  return { message: String(error ?? "Unknown error") };
}

/**
 * `HTTP 504 · /users/me · phoneAuth:requestCode` for an RTK Query error —
 * an object with a numeric HTTP `status` or a transport tag (`FETCH_ERROR`,
 * `TIMEOUT_ERROR`, …) and no `message` of its own. Only the status, the path
 * the server echoed back and the call site go in: the server's own text can
 * carry what the person typed, so it stays in `extra`. Anything else — an
 * `Error`, a serialized error with a message — returns null and is handled as
 * before.
 */
function apiErrorTitle(error: unknown, context?: string): string | null {
  if (!error || typeof error !== "object" || error instanceof Error) {
    return null;
  }
  if (typeof (error as { message?: unknown }).message === "string") {
    return null;
  }
  const { status, originalStatus } = error as {
    status?: unknown;
    originalStatus?: unknown;
  };
  if (typeof status !== "number" && typeof status !== "string") return null;

  const data = (error as { data?: unknown }).data;
  const path =
    data &&
    typeof data === "object" &&
    typeof (data as { path?: unknown }).path === "string"
      ? // The query string can carry coordinates or a cursor — neither
        // belongs in an issue title.
        (data as { path: string }).path.split("?")[0]
      : undefined;

  // A PARSING_ERROR is an HTTP reply that was not JSON — usually a proxy's
  // HTML error page — and the status worth naming is the one it came with.
  const label =
    typeof status === "number"
      ? `HTTP ${status}`
      : typeof originalStatus === "number"
        ? `HTTP ${originalStatus}`
        : status;

  return [label, path, context].filter(Boolean).join(" · ");
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
