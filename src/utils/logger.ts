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
  const normalized = normalizeError(error);

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

  // 3. TODO: forward to Sentry / Bugsnag here. Single integration point.
  // Sentry?.captureException(error, { tags: { context }, extra });
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

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
