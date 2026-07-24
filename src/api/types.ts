export type OfferStatus = 'pending' | 'accepted' | 'declined';

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

