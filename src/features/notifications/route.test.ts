import { resolveNotificationRoute } from "./route";

const CHAT = "/(contractor)/offer-chat/[offerId]";
const JOB = "/(contractor)/jobs/[id]";

/**
 * The push payload crosses a service boundary no shared schema covers, so this
 * function is the app's only defence against whatever the server actually
 * sends. Push routing has already leaked once (`fix(push)`), and the sibling
 * app carries a near-identical copy of this file that resolves to its own
 * pathnames — which is why the route strings are asserted here rather than
 * taken on trust. The chat route is built by `buildOfferChatRoute`, so these
 * also pin that a deep link and an in-app tap land on one route shape.
 */
describe("resolveNotificationRoute", () => {
  it("routes an offer notification to its chat", () => {
    expect(resolveNotificationRoute({ offerId: "o1" })).toEqual({
      pathname: CHAT,
      params: { offerId: "o1" },
    });
  });

  it("routes a job notification to the job", () => {
    expect(resolveNotificationRoute({ jobId: "j1" })).toEqual({
      pathname: JOB,
      params: { id: "j1" },
    });
  });

  // Resolution is by id rather than event name, and the server has used both
  // spellings — accepting one only is a production-only bug.
  it("accepts either spelling of an id", () => {
    expect(resolveNotificationRoute({ offer_id: "o1" })).toEqual({
      pathname: CHAT,
      params: { offerId: "o1" },
    });
    expect(resolveNotificationRoute({ job_id: "j1" })).toEqual({
      pathname: JOB,
      params: { id: "j1" },
    });
  });

  it("prefers the camelCase spelling when both are present", () => {
    expect(resolveNotificationRoute({ offerId: "a", offer_id: "b" })).toEqual({
      pathname: CHAT,
      params: { offerId: "a" },
    });
  });

  it("takes a numeric id as a string", () => {
    expect(resolveNotificationRoute({ jobId: 42 })).toEqual({
      pathname: JOB,
      params: { id: "42" },
    });
  });

  it("trims an id that arrives padded", () => {
    expect(resolveNotificationRoute({ offerId: "  o1  " })).toEqual({
      pathname: CHAT,
      params: { offerId: "o1" },
    });
  });

  // The more specific destination is the one the notification was about.
  it("sends a payload carrying both ids to the chat", () => {
    expect(resolveNotificationRoute({ offerId: "o1", jobId: "j1" })).toEqual({
      pathname: CHAT,
      params: { offerId: "o1" },
    });
  });

  it("falls through to the job when the offer id is blank", () => {
    expect(resolveNotificationRoute({ offerId: "   ", jobId: "j1" })).toEqual({
      pathname: JOB,
      params: { id: "j1" },
    });
  });

  it("gives back nothing when there is nothing to navigate to", () => {
    expect(resolveNotificationRoute({})).toBeNull();
    expect(resolveNotificationRoute({ type: "offer.created" })).toBeNull();
    expect(resolveNotificationRoute({ offerId: "" })).toBeNull();
    expect(resolveNotificationRoute({ jobId: null })).toBeNull();
    expect(resolveNotificationRoute({ jobId: { id: "j1" } })).toBeNull();
  });

  it("survives a payload that is not an object at all", () => {
    expect(resolveNotificationRoute(null)).toBeNull();
    expect(resolveNotificationRoute(undefined)).toBeNull();
    expect(resolveNotificationRoute("o1")).toBeNull();
    expect(resolveNotificationRoute(42)).toBeNull();
  });
});
