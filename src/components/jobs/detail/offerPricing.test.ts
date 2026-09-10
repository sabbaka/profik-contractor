import {
  OFFER_COST_CZK,
  OFFER_DISCOUNT_PERCENT,
  OFFER_FULL_COST_CZK,
  OFFER_HAS_DISCOUNT,
} from "./offerPricing";

/**
 * The prices are hard-coded because the API exposes neither, and the discount
 * badge is derived from them rather than written down separately — so the
 * badge cannot contradict the prices beside it. That claim is the whole reason
 * the module is shaped this way, and this is what makes it checkable when the
 * numbers move.
 */
describe("offer pricing", () => {
  it("derives the badge from the two prices", () => {
    expect(OFFER_DISCOUNT_PERCENT).toBe(
      Math.round((1 - OFFER_COST_CZK / OFFER_FULL_COST_CZK) * 100),
    );
    expect(OFFER_DISCOUNT_PERCENT).toBe(50);
  });

  it("shows a discount only while one price is below the other", () => {
    expect(OFFER_HAS_DISCOUNT).toBe(OFFER_FULL_COST_CZK > OFFER_COST_CZK);
    expect(OFFER_HAS_DISCOUNT).toBe(true);
  });
});
