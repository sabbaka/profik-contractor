/**
 * The `data` object the backend attaches to a push notification.
 *
 * Nothing in `openapi.json` describes this — it is a contract between the
 * server's notification sender and this file. Keep the two in step, and in
 * step with `profik_client`'s copy of this same file.
 *
 * Only the ids matter for routing. `type` is read when present but is not
 * required: an id is enough to know where the notification points, which keeps
 * the app working if the server renames an event.
 */
export interface PushPayload {
  /** e.g. "offer_created", "message_received", "job_completed". Optional. */
  type?: string;
  /** Job the notification is about. Routes to the job details screen. */
  jobId?: string;
  /** Offer whose chat the notification is about. Routes to that chat. */
  offerId?: string;
}

/** A destination `router.push` can take. */
export interface NotificationRoute {
  pathname: string;
  params: Record<string, string>;
}
