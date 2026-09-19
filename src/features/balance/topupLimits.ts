/**
 * What a top-up amount is allowed to be.
 *
 * The same two numbers live in the backend's `TopupDto`, and they have to: the
 * floor is Stripe's own minimum charge for CZK — a smaller Checkout Session is
 * refused outright, so it could never be paid — and the ceiling is ours, to
 * keep a typo from opening a six-figure checkout. Whole korunas only, because
 * the amount is multiplied into haléře and Stripe rejects a fractional
 * `unit_amount`.
 *
 * Duplicated here rather than read from the API because `openapi.json` carries
 * them only as prose in the field's description. Until the server exposes them,
 * changing either number means changing it in both repositories — the form
 * refusing what the server accepts is the mild direction; the reverse is what
 * crashed Profik Pro on a 1 Kč top-up.
 */
export const MIN_TOPUP_CZK = 15;
export const MAX_TOPUP_CZK = 100_000;
