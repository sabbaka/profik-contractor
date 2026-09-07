export type OfferStatus = 'pending' | 'accepted' | 'declined';

export type PropertyType = 'apartment' | 'house' | 'commercial';
export type ServiceType = 'standard' | 'deep' | 'renovation';
export type EquipmentProvision = 'have' | 'bring';
export type LadderOption = 'available' | 'needed' | 'noneeded';
export type WindowCleaningOption = 'yes' | 'no';
export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'all_day';

export interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  clientId: string;
  contractorId: string | null;
  status: string;
  // Location fields are null for anonymous (guest) API responses — the
  // backend strips the exact address and coarsens coordinates.
  addressLine: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  placeId: string | null;
  // Structured job details captured by the client's creation wizard. Older
  // jobs predate this and won't have them — every field is optional.
  propertyType?: PropertyType;
  serviceType?: ServiceType;
  roomsCount?: string;
  bathroomsCount?: string;
  area?: number;
  vacuumCleaner?: EquipmentProvision;
  cleaningSupplies?: EquipmentProvision;
  ladder?: LadderOption;
  windowCleaning?: WindowCleaningOption;
  windowCount?: number;
  scheduledDates?: string[];
  timeSlot?: TimeSlot;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MyOffer {
  id: string;
  price: number;
  message: string;
  status: OfferStatus;
  createdAt: string;
}

export interface OfferedJobItem {
  job: Job;
  myOffer: MyOffer;
}

export interface GetOfferedJobsParams {
  status: OfferStatus;
}

