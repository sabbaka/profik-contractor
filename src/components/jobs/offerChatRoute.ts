import type { JobStatus, OfferStatus } from "@/src/api/types";

export interface OfferChatRouteInput {
  offerId: string;
  jobId?: string | null;
  jobTitle?: string | null;
  offerPrice?: number | null;
  offerStatus?: OfferStatus | null;
  /** Travels with `offerStatus`: an accepted offer alone cannot say whether
   *  the work is still running or already done. */
  jobStatus?: JobStatus | null;
}

/**
 * Builds the navigation descriptor for the offer chat.
 *
 * The chat is addressed by offer id, but the backend has no `GET /offers/{id}`
 * — so the job an offer belongs to cannot be resolved from that id alone.
 * Every caller already holds the job, so the context the chat header shows
 * travels with the navigation instead of costing a request.
 *
 * A deep link (a push notification) carries only `offerId`; the header drops
 * the context strip in that case rather than showing a half-filled one.
 */
export function buildOfferChatRoute({
  offerId,
  jobId,
  jobTitle,
  offerPrice,
  offerStatus,
  jobStatus,
}: OfferChatRouteInput) {
  return {
    pathname: "/(contractor)/offer-chat/[offerId]",
    params: {
      offerId,
      ...(jobId ? { jobId } : {}),
      ...(jobTitle ? { jobTitle } : {}),
      ...(offerPrice != null ? { offerPrice: String(offerPrice) } : {}),
      ...(offerStatus ? { offerStatus } : {}),
      ...(jobStatus ? { jobStatus } : {}),
    },
  };
}
