import { buildOfferChatRoute } from "./offerChatRoute";

const OFFER_ID = "o1";

/**
 * The chat header's context travels in the route rather than costing a
 * request, so every optional field is spread in conditionally — and a
 * conditional spread is exactly where a legitimate zero gets dropped. This app
 * has already shipped that bug once, on a job sitting at latitude zero.
 */
describe("buildOfferChatRoute", () => {
  it("addresses the chat by offer id", () => {
    expect(buildOfferChatRoute({ offerId: OFFER_ID })).toEqual({
      pathname: "/(contractor)/offer-chat/[offerId]",
      params: { offerId: OFFER_ID },
    });
  });

  it("carries the job context a caller already holds", () => {
    expect(
      buildOfferChatRoute({
        offerId: OFFER_ID,
        jobId: "j1",
        jobTitle: "Deep clean",
        offerPrice: 1200,
        offerStatus: "pending",
        jobStatus: "open",
      }).params,
    ).toEqual({
      offerId: OFFER_ID,
      jobId: "j1",
      jobTitle: "Deep clean",
      offerPrice: "1200",
      offerStatus: "pending",
      jobStatus: "open",
    });
  });

  // The guard is `!= null` and not truthiness for this reason.
  it("keeps a price of zero", () => {
    expect(
      buildOfferChatRoute({ offerId: OFFER_ID, offerPrice: 0 }).params,
    ).toEqual({ offerId: OFFER_ID, offerPrice: "0" });
  });

  // A push notification carries the offer id alone; the header drops the
  // context strip rather than showing a half-filled one, which only works if
  // the keys are absent instead of holding "null" or "".
  it("omits missing context rather than passing it along empty", () => {
    expect(
      buildOfferChatRoute({
        offerId: OFFER_ID,
        jobId: null,
        jobTitle: "",
        offerPrice: null,
        offerStatus: null,
        jobStatus: undefined,
      }).params,
    ).toEqual({ offerId: OFFER_ID });
  });
});
