import {
  FALLBACK_PRIVACY_URL,
  FALLBACK_TERMS_URL,
  isFirstAcceptance,
  privacyUrlOf,
  termsRequired,
  termsUrlOf,
  toCachedTerms,
  type TermsState,
} from "./terms";

const state = (over: Partial<TermsState> = {}): TermsState => ({
  required: true,
  currentVersion: "2026-10-01",
  acceptedVersion: null,
  acceptedAt: null,
  termsUrl: "https://profik.app/obchodni-podminky",
  privacyUrl: "https://profik.app/zasady-ochrany-osobnich-udaju",
  acceptedTermsUrl: null,
  ...over,
});

/**
 * One boolean decides whether a blocking screen goes up in front of every
 * signed-in person, so both directions of getting it wrong are covered here:
 * failing to ask, and — worse, because nobody can dismiss it — asking when
 * there is nothing to ask about.
 */
describe("termsRequired", () => {
  it("asks when the server says to", () => {
    expect(termsRequired({ terms: state({ required: true }) })).toBe(true);
  });

  it("stays out of the way once the current edition is accepted", () => {
    expect(termsRequired({ terms: state({ required: false }) })).toBe(false);
  });

  // The direction that matters. A rolled-back backend, an old staging server,
  // or a request that never landed all look like a missing block, and the cost
  // of guessing "required" there is every install stuck behind a screen with
  // no way past it.
  it("fails open on a response that carries no terms at all", () => {
    expect(termsRequired({})).toBe(false);
    expect(termsRequired(undefined)).toBe(false);
    expect(termsRequired(null)).toBe(false);
  });

  // An old build's cached user object, or a response shaped by something other
  // than this API, must not be read as an answer.
  it("does not treat a malformed block as an answer", () => {
    expect(
      termsRequired({ terms: { required: "yes" } as unknown as TermsState }),
    ).toBe(false);
  });
});

describe("isFirstAcceptance", () => {
  // Same gate, two sentences: "please review these" against "these have
  // changed". Nothing else distinguishes the cases.
  it("is true for an account that has never accepted anything", () => {
    expect(isFirstAcceptance(state({ acceptedVersion: null }))).toBe(true);
  });

  it("is false when an older edition is on file", () => {
    expect(isFirstAcceptance(state({ acceptedVersion: "2019-01-01" }))).toBe(
      false,
    );
  });

  it("treats a missing block as a first acceptance", () => {
    expect(isFirstAcceptance(undefined)).toBe(true);
  });
});

describe("document links", () => {
  it("uses the addresses the server gave, so a move needs no release", () => {
    const terms = state({ termsUrl: "https://profik.app/vop" });
    expect(termsUrlOf(terms)).toBe("https://profik.app/vop");
    expect(privacyUrlOf(terms)).toBe(terms.privacyUrl);
  });

  it("falls back to the published pages when there is no block", () => {
    expect(termsUrlOf(null)).toBe(FALLBACK_TERMS_URL);
    expect(privacyUrlOf(null)).toBe(FALLBACK_PRIVACY_URL);
  });
});

describe("toCachedTerms", () => {
  it("keeps only what the launch decision needs", () => {
    expect(toCachedTerms(state({ required: false }))).toEqual({
      required: false,
      currentVersion: "2026-10-01",
    });
  });

  it("caches nothing when there is nothing to cache", () => {
    expect(toCachedTerms(undefined)).toBeNull();
  });
});
