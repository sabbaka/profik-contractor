import { isConversationClosed } from "./conversationClosed";

describe("isConversationClosed", () => {
  it.each([
    ["pending", "open"],
    ["accepted", "in_progress"],
    ["accepted", "completed"],
  ] as const)("leaves a %s offer on a %s job open", (offer, job) => {
    expect(isConversationClosed(offer, job)).toBe(false);
  });

  // C-13 / P-22: a declined offer left both sides writing to each other.
  it.each(["open", "in_progress", "completed", "canceled"] as const)(
    "closes a declined offer on a %s job",
    (job) => {
      expect(isConversationClosed("declined", job)).toBe(true);
    },
  );

  it("closes a cancelled job even with the offer accepted", () => {
    expect(isConversationClosed("accepted", "canceled")).toBe(true);
  });

  // A chat opened from a push carries only an offer id. Reading that as closed
  // would lock a live conversation; the server refuses the send if it is not.
  it("reads as open when the statuses are unknown", () => {
    expect(isConversationClosed(undefined, undefined)).toBe(false);
    expect(isConversationClosed("declined", undefined)).toBe(true);
    expect(isConversationClosed(undefined, "canceled")).toBe(true);
  });
});
