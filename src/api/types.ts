export type OfferStatus = "pending" | "accepted" | "declined";
export type JobStatus = "open" | "in_progress" | "completed" | "canceled";

export type PropertyType = "apartment" | "house" | "commercial";
export type ServiceType = "standard" | "deep" | "renovation";
export type EquipmentProvision = "have" | "bring";
export type LadderOption = "available" | "needed" | "noneeded";
export type WindowCleaningOption = "yes" | "no";
export type TimeSlot = "morning" | "afternoon" | "evening" | "all_day";

/**
 * `JobResponseDto` — what `/jobs/open`, `/jobs/{id}` and the offered-jobs list
 * return. Every optional column comes back as `null`, never absent, because it
 * is a nullable database column serialised as-is.
 */
export interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  clientId: string;
  contractorId: string | null;
  status: JobStatus;
  // The backend hides the exact location from anyone but the client who owns
  // the job and the contractor whose offer was accepted: address, postal code
  // and placeId come back null, notes are stripped, and coordinates are
  // coarsened to roughly a kilometre so the map can still show the area.
  addressLine: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  placeId: string | null;
  propertyType: PropertyType | null;
  serviceType: ServiceType | null;
  roomsCount: string | null;
  bathroomsCount: string | null;
  area: number | null;
  vacuumCleaner: EquipmentProvision | null;
  cleaningSupplies: EquipmentProvision | null;
  ladder: LadderOption | null;
  windowCleaning: WindowCleaningOption | null;
  windowCount: number | null;
  scheduledDates: string[] | null;
  timeSlot: TimeSlot | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** `OfferSummaryDto` — the offer as it is embedded in `/jobs/offered`. */
export interface MyOffer {
  id: string;
  price: number;
  /** Free text the contractor may leave out — null, not absent, when they do. */
  message: string | null;
  status: OfferStatus;
  createdAt: string;
}

/**
 * `OfferResponseDto` — a whole offer, as `/offers/job/{jobId}/my` returns it.
 * The same fields as `MyOffer` plus the two ids the embedded form can omit.
 *
 * That endpoint answers with `null` when this contractor has not offered on the
 * job — an ordinary answer, not a 404, which is why nothing has to ask
 * `/has-offered` first any more.
 */
export interface Offer extends MyOffer {
  jobId: string;
  contractorId: string;
}

/** `OfferMessageResponseDto` — one message in the chat attached to an offer. */
export interface OfferMessage {
  id: string;
  offerId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface OfferedJobItem {
  job: Job;
  myOffer: MyOffer;
}

/**
 * The tabs on My Jobs — `OfferedJobsFilter` on the server.
 *
 * Not `OfferStatus`: an accepted offer stays accepted after the work is done,
 * so the offer alone cannot tell a job in progress from a finished one. The
 * server resolves each of these against the job *and* the offer, using the
 * same rule that files a conversation into a `ConversationBucket`.
 */
export type OfferedJobsFilter = "pending" | "active" | "completed" | "declined";

export interface GetOfferedJobsParams {
  filter: OfferedJobsFilter;
}

/**
 * Which tab of the Messages screen a conversation belongs to.
 *
 * The server decides this from `job.status` + `offer.status` and hands it over
 * ready-made — the same rule has to hold in this app, the client app and the
 * backend, so it is computed in exactly one of them.
 */
export type ConversationBucket =
  "open" | "in_progress" | "completed" | "archived";

export const CONVERSATION_BUCKETS: ConversationBucket[] = [
  "open",
  "in_progress",
  "completed",
  "archived",
];

/** `ConversationCounterpartyDto` — the other side of the chat, whoever you are. */
export interface ConversationCounterparty {
  id: string;
  /** Null until they set one — an OTP account starts without a name. */
  name: string | null;
  avatarUrl: string | null;
}

/** `ConversationLastMessageDto` — enough of the last message for a preview. */
export interface ConversationLastMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

/** `ConversationDto` — one row of the Messages list. */
export interface Conversation {
  offerId: string;
  bucket: ConversationBucket;
  offer: {
    id: string;
    price: number;
    status: OfferStatus;
    createdAt: string;
  };
  job: {
    id: string;
    title: string;
    category: string;
    price: number;
    status: JobStatus;
  };
  counterparty: ConversationCounterparty;
  /** Null when nobody has written yet — the normal case in the Open tab. */
  lastMessage: ConversationLastMessage | null;
  /** Messages from the other side since this user last read. */
  unreadCount: number;
}

/** `ConversationListDto` — a page of conversations. */
export interface ConversationList {
  items: Conversation[];
  /** Pass back as `cursor`. Null on the last page. */
  nextCursor: string | null;
}

export interface GetConversationsParams {
  bucket?: ConversationBucket;
  cursor?: string;
  limit?: number;
}

/** `UnreadSummaryDto` — the tab badge, and which bucket to put a dot on. */
export interface UnreadSummary {
  total: number;
  byBucket: Record<ConversationBucket, number>;
}

/** `ReviewAuthorDto` — who left the review. Name is null until they set one. */
export interface ReviewAuthor {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

/**
 * `JobReviewResponseDto` — one review left on a job. A completed job can carry
 * two, one per direction: read `targetId` to tell whose review this is.
 *
 * `targetRole` is the same direction stated on the row. It exists because one
 * account is both sides of the marketplace, and the two reputations are
 * averaged apart on the profile endpoints.
 *
 * The spec marks `comment` optional, but the endpoint serialises the database
 * row as-is, so a review left without one comes back as `null` — same as the
 * client app types it.
 */
export interface Review {
  id: string;
  jobId: string;
  authorId: string;
  targetId: string;
  targetRole: "client" | "contractor";
  rating: number;
  comment: string | null;
  author: ReviewAuthor;
  createdAt: string;
}
