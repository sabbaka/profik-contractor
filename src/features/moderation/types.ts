/**
 * Reports and blocks — App Store guideline 1.2. Mirrors `CreateReportDto`,
 * `ReportResponseDto` and `BlockedUserDto` in `openapi.json`.
 */

/** What a report is about. A `user` report is about the person as a whole. */
export type ReportTargetType = "message" | "review" | "job" | "user";

/** The fixed list the backend accepts, in the order the sheet offers them. */
export const REPORT_REASONS = [
  "spam",
  "fraud",
  "harassment",
  "inappropriate",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

/** What is being reported — the id belongs to `type`. */
export interface ReportTarget {
  type: ReportTargetType;
  id: string;
}

export interface CreateReportParams {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  comment?: string;
}

export interface ReportResponse {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  status: "OPEN" | "RESOLVED";
  createdAt: string;
}

/** One row of `GET /users/me/blocks`. */
export interface BlockedUser {
  id: string;
  /** Null until they set one. Render a fallback, never the raw value. */
  name: string | null;
  avatarUrl: string | null;
  blockedAt: string;
}
