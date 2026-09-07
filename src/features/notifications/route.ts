import { buildOfferChatRoute } from "@/src/components/jobs/offerChatRoute";
import type { NotificationRoute } from "./types";

/**
 * Reads an id out of a push payload, tolerating the casing the server happens
 * to use. The payload crosses a service boundary that no shared schema covers,
 * so accepting both spellings is cheaper than a production-only bug.
 */
function readId(data: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return undefined;
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
export function resolveNotificationRoute(data: unknown): NotificationRoute | null {
  if (!data || typeof data !== "object") return null;
  const payload = data as Record<string, unknown>;

  const offerId = readId(payload, "offerId", "offer_id");
  if (offerId) {
    return buildOfferChatRoute({ offerId });
  }

  const jobId = readId(payload, "jobId", "job_id");
  if (jobId) {
    return {
      pathname: "/(contractor)/jobs/[id]",
      params: { id: jobId },
    };
  }

  return null;
}
