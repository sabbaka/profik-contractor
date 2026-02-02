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
  addressLine: string;
  city: string;
  postalCode: string;
  country: string;
  lat: number;
  lng: number;
  placeId: string;
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

