/**
 * What one offer costs, and what it costs without the current promotion.
 *
 * Hard-coded because the API exposes neither: `openapi.json` has no price for
 * sending an offer and no flag for the discount. Both belong on the backend
 * before either can change without shipping a release.
 *
 * The discount percentage is derived from the two numbers rather than written
 * down separately, so the badge cannot contradict the prices beside it.
 */
export const OFFER_COST_CZK = 5;
export const OFFER_FULL_COST_CZK = 10;

export const OFFER_DISCOUNT_PERCENT = Math.round(
  (1 - OFFER_COST_CZK / OFFER_FULL_COST_CZK) * 100,
);

export const OFFER_HAS_DISCOUNT = OFFER_FULL_COST_CZK > OFFER_COST_CZK;
