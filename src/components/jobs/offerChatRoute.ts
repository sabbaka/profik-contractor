import type {
  JobStatus,
  OfferStatus,
  PropertyType,
  ServiceType,
} from "@/src/api/types";

export interface OfferChatRouteInput {
  offerId: string;
  jobId?: string | null;
  jobTitle?: string | null;
  /** What the chat header names the work from, so the strip follows the
   *  reader's language rather than freezing the one picked at navigation. */
  serviceType?: ServiceType | null;
  propertyType?: PropertyType | null;
  offerPrice?: number | null;
  offerStatus?: OfferStatus | null;
  /** Travels with `offerStatus`: an accepted offer alone cannot say whether
   *  the work is still running or already done. */
  jobStatus?: JobStatus | null;
  /**
   * The chat's own header is the client's name, not a static label — see
   * `app/(contractor)/offer-chat/[offerId].tsx`. Only the Messages list
   * actually has this (`ConversationDto.counterparty.name`); neither
   * `GET /jobs/:id` nor `GET /jobs/me/offered` return a client name, so a
   * caller reached from either of those omits it and the screen falls back
   * to a generic "Client" label instead of guessing.
   */
  clientName?: string | null;
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
  serviceType,
  propertyType,
  offerPrice,
  offerStatus,
  jobStatus,
  clientName,
}: OfferChatRouteInput) {
  return {
    pathname: "/(contractor)/offer-chat/[offerId]",
    params: {
      offerId,
      ...(jobId ? { jobId } : {}),
      ...(jobTitle ? { jobTitle } : {}),
      ...(serviceType ? { serviceType } : {}),
      ...(propertyType ? { propertyType } : {}),
      ...(offerPrice != null ? { offerPrice: String(offerPrice) } : {}),
      ...(offerStatus ? { offerStatus } : {}),
      ...(jobStatus ? { jobStatus } : {}),
      ...(clientName ? { clientName } : {}),
    },
  };
}
