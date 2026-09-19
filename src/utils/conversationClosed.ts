/**
 * Offer and job statuses, as the two apps spell them.
 *
 * Declared here rather than imported so this module mirrors byte for byte in
 * both apps — the client keeps them on `Offer`/`Job` in
 * `src/features/jobs/types.ts`, the contractor app in `src/api/types.ts`.
 */
type OfferStatus = "pending" | "accepted" | "declined";
type JobStatus = "open" | "in_progress" | "completed" | "canceled";

/**
 * Whether this conversation is read-only: the history still opens, but neither
 * side may send into it any more.
 *
 * The backend decides this — `POST /offers/:id/messages` answers 403 with
 * `offer.conversationClosed` — and its rule is "whatever `bucketOf` files as
 * archived", which today is a declined offer or a cancelled job. This is that
 * same rule, held locally so the composer can be replaced with a line of
 * explanation instead of letting someone type a message that will be refused.
 *
 * The server stays the authority. A chat opened from a push carries only an
 * offer id, so both statuses can be `undefined` here — that reads as open, the
 * send goes out, and the refusal is what closes the screen. Guessing "closed"
 * from missing parameters would lock a live conversation.
 *
 * Mirrored in the sibling app; `npm run shared:check` guards the pair.
 */
export function isConversationClosed(
  offerStatus: OfferStatus | undefined,
  jobStatus: JobStatus | undefined,
): boolean {
  return offerStatus === "declined" || jobStatus === "canceled";
}
