/**
 * Whether a failed push registration is the network's fault and worth trying
 * again, rather than something to report.
 *
 * Registration runs at launch and on every return to the app — moments when a
 * phone is often between networks. A dropped connection or Expo's push service
 * being briefly overloaded fixes itself on the next try, so reporting it filled
 * Sentry with issues nobody could act on (PROFIK-E, PROFIK-CONTRACTOR-B, -D, -E).
 *
 * Transient:
 *   • `ERR_NOTIFICATIONS_NETWORK_ERROR` — the request for an Expo token never
 *     got an answer;
 *   • `ERR_NOTIFICATIONS_SERVER_ERROR` for a 502/503/504, or one whose body
 *     Expo marked `"isTransient": true`;
 *   • an RTK Query `FETCH_ERROR` or `TIMEOUT_ERROR` — saving the token to our
 *     own server never got an answer.
 *
 * Everything else — a refusal with a status, a permission failure, "Aborted" —
 * is not, and is still reported.
 *
 * Both apps carry this file byte for byte; `shared-modules.json` holds them
 * to it.
 */
export function isTransientPushError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const { code, message, status } = error as {
    code?: unknown;
    message?: unknown;
    status?: unknown;
  };

  if (code === "ERR_NOTIFICATIONS_NETWORK_ERROR") return true;
  if (code === "ERR_NOTIFICATIONS_SERVER_ERROR") {
    return (
      typeof message === "string" &&
      (/received: 50[234]\b/.test(message) ||
        /"isTransient":\s*true/.test(message))
    );
  }

  return status === "FETCH_ERROR" || status === "TIMEOUT_ERROR";
}
