import { isGuestAccessibleRoute } from "./guestRoutes";

/**
 * This list is the whole of guest access — AuthGate enforces nothing else. A
 * wrong `true` here opens a signed-in screen to anyone, so the table is
 * asserted in full rather than sampled.
 *
 * Mirrors the client app's suite. The two lists differ in what the second
 * segment opens: a guest here browses open jobs, where a guest there starts
 * one.
 */
describe("isGuestAccessibleRoute", () => {
  it("lets a guest reach sign-in and onboarding", () => {
    expect(isGuestAccessibleRoute(["auth"])).toBe(true);
    expect(isGuestAccessibleRoute(["auth", "phone"])).toBe(true);
    expect(isGuestAccessibleRoute(["onboarding"])).toBe(true);
  });

  it("lets a guest browse the tabs and read a job", () => {
    expect(isGuestAccessibleRoute(["(contractor)", "(tabs)"])).toBe(true);
    expect(isGuestAccessibleRoute(["(contractor)", "(tabs)", "open"])).toBe(
      true,
    );
    expect(isGuestAccessibleRoute(["(contractor)", "jobs", "abc"])).toBe(true);
  });

  it("opens only the three informational profile pages", () => {
    expect(
      isGuestAccessibleRoute(["(contractor)", "profile", "privacy-policy"]),
    ).toBe(true);
    expect(
      isGuestAccessibleRoute(["(contractor)", "profile", "help-support"]),
    ).toBe(true);
    expect(isGuestAccessibleRoute(["(contractor)", "profile", "about"])).toBe(
      true,
    );
  });

  it("keeps the rest of the profile closed", () => {
    expect(isGuestAccessibleRoute(["(contractor)", "profile"])).toBe(false);
    expect(isGuestAccessibleRoute(["(contractor)", "profile", "edit"])).toBe(
      false,
    );
    expect(
      isGuestAccessibleRoute(["(contractor)", "profile", "language"]),
    ).toBe(false);
  });

  it("keeps the balance and offer chat closed", () => {
    expect(isGuestAccessibleRoute(["(contractor)", "balance"])).toBe(false);
    expect(isGuestAccessibleRoute(["(contractor)", "offer-chat", "abc"])).toBe(
      false,
    );
  });

  it("refuses an unknown or empty route rather than defaulting open", () => {
    expect(isGuestAccessibleRoute([])).toBe(false);
    expect(isGuestAccessibleRoute(["(client)", "(tabs)"])).toBe(false);
    expect(isGuestAccessibleRoute(["anything"])).toBe(false);
  });
});
