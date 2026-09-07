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

export interface GetOfferedJobsParams {
  status: OfferStatus;
}
