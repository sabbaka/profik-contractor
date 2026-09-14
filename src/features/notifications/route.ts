import { buildOfferChatRoute } from "@/src/components/jobs/offerChatRoute";
import type { NotificationRoute } from "./types";

/**
 * Reads an id out of a push payload, tolerating the casing the server happens
 * to use. The payload crosses a service boundary that no shared schema covers,
 * so accepting both spellings is cheaper than a production-only bug.
 */
function readId(
  data: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

/**
 * The ids a push payload can carry, read once and shared by both routing
 * (`resolveNotificationRoute`, a tap) and cache invalidation
 * (`useNotificationInvalidation` in `usePushNotifications.ts`, an arrival) —
 * the two care about different things happening to the same payload, not
 * different payloads.
 */
export function readNotificationIds(data: unknown): {
  jobId?: string;
  offerId?: string;
} {
  if (!data || typeof data !== "object") return {};
  const payload = data as Record<string, unknown>;
  return {
    jobId: readId(payload, "jobId", "job_id"),
    offerId: readId(payload, "offerId", "offer_id"),
  };
}

/**
 * Turns a notification's `data` into the screen it is about, or null when it
 * carries nothing to navigate to.
 *
 * Resolution is by id rather than by event name on purpose: a notification
 * about an offer's chat carries an offerId whatever the server calls the
 * event, so renaming events on the backend cannot silently break routing.
 *
 * A chat wins over a job when both ids are present — the more specific
 * destination is the one the notification was about. The chat route goes
 * through `buildOfferChatRoute` so a deep link lands on the exact same route
 * shape as navigating there in-app (minus the job-context strip, which a
 * bare offerId can't supply).
 */
export function resolveNotificationRoute(
  data: unknown,
): NotificationRoute | null {
  const { jobId, offerId } = readNotificationIds(data);

  if (offerId) {
    return buildOfferChatRoute({ offerId });
  }

  if (jobId) {
    return {
      pathname: "/(contractor)/jobs/[id]",
      params: { id: jobId },
    };
  }

  return null;
}
