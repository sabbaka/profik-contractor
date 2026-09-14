/**
 * Payload for the in-app "rate Profik Pro" survey — `CreateAppFeedbackDto` in
 * openapi.json. No `platform` field: the client app (`profik_client`) sends
 * one, but the spec doesn't declare it, so it isn't mirrored here — see
 * api.md, "if the spec and this app disagree, the spec wins."
 */
export interface AppFeedbackParams {
  /** 1–5 stars the user picked. */
  rating: number;
  /** Optional free-text answer, up to 2000 characters server-side. */
  comment?: string;
  /**
   * App version the feedback was sent from, prefixed "contractor " (e.g.
   * "contractor 1.1.9") — see `appVersionLabel` in `useAppFeedbackForm.ts`
   * for why: this endpoint is shared with profik_client and the field is
   * the only place left to say which app a submission came from.
   */
  appVersion: string;
  /** UI language at the time, so replies go out in the right language. */
  locale: string;
}

/** `POST /feedback/app` — 201 body. Nothing in the app reads it back yet. */
export interface AppFeedbackResponse {
  id: string;
  rating: number;
  comment?: string | null;
  appVersion: string;
  locale: string;
  createdAt: string;
}

/**
 * Why a submission failed, resolved from the HTTP status so the sheet can say
 * something specific instead of surfacing a raw server string.
 *
 * `rateLimited` is the 429 the endpoint returns when the same user submits too
 * often — it is not a failure the user can fix by retrying now, so it needs
 * different wording from a network blip.
 */
export type AppFeedbackErrorKind =
  "rateLimited" | "unauthorized" | "validation" | "network" | "unknown";
