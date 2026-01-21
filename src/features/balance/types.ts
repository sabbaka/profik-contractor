export interface TopupParams {
  amount: number;
  returnUrl?: string;
}

export interface TopupResponse {
  url: string;
}

export type TopupResult =
  | { success: true; balanceUpdated: boolean; newBalance?: number }
  | { success: false; error: string };

