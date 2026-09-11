/**
 * How far a verification has got. Mirrors the backend's
 * `IdentityVerificationStatus` — the values travel as strings, so a status the
 * server adds later arrives as an unknown string rather than breaking.
 */
export type VerificationStatus =
  | "not_started"
  | "in_progress"
  | "in_review"
  | "approved"
  | "declined"
  | "abandoned"
  | "expired";

/** What `GET /auth/me` carries about this account's verification. */
export interface VerificationSummary {
  status: VerificationStatus | string;
  verifiedAt: string | null;
  verifiedUntil: string | null;
  /** "Ivan P." — what clients see once verified. Null until then. */
  displayName: string | null;
}

export interface StartVerificationResponse {
  url: string;
  sessionId: string;
  status: VerificationStatus | string;
  /** True when the server handed back a session already in flight. */
  resumed: boolean;
}

/** Only `approved` earns a badge. Everything else is a state of the journey. */
export function isVerified(summary?: VerificationSummary | null): boolean {
  return summary?.status === "approved";
}
