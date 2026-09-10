import { buildJobDetailReturnTo, normalizeAuthReturnTo } from "./authReturnTo";

const JOB_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const VALID = `/(contractor)/jobs/${JOB_ID}`;

/**
 * A whitelist, not a sanity check: `returnTo` arrives from a deep link, and
 * anything that gets past here is a place the app will navigate to after
 * sign-in. The regex spells the UUID shape out rather than counting characters
 * because a counted version — `[0-9a-fA-F-]{36}` — accepted a string of
 * nothing but dashes.
 */
describe("normalizeAuthReturnTo", () => {
  it("accepts a job detail route with a real UUID", () => {
    expect(normalizeAuthReturnTo(VALID)).toBe(VALID);
  });

  it("accepts an upper-case UUID", () => {
    const upper = `/(contractor)/jobs/${JOB_ID.toUpperCase()}`;
    expect(normalizeAuthReturnTo(upper)).toBe(upper);
  });

  // The bug the current regex was written to close.
  it("rejects 36 dashes, which is the right length and no UUID at all", () => {
    expect(
      normalizeAuthReturnTo(`/(contractor)/jobs/${"-".repeat(36)}`),
    ).toBeUndefined();
  });

  it("rejects a UUID with the groups in the wrong places", () => {
    expect(
      normalizeAuthReturnTo(
        "/(contractor)/jobs/3fa85f64571745-62b3fc2c963f66af",
      ),
    ).toBeUndefined();
    expect(
      normalizeAuthReturnTo(
        "/(contractor)/jobs/3fa85f64-5717-4562-b3fc-2c963f66afa",
      ),
    ).toBeUndefined();
  });

  it("rejects a non-hex character inside the UUID", () => {
    expect(
      normalizeAuthReturnTo(
        "/(contractor)/jobs/3fa85g64-5717-4562-b3fc-2c963f66afa6",
      ),
    ).toBeUndefined();
  });

  it("rejects any route other than a job detail", () => {
    expect(
      normalizeAuthReturnTo("/(contractor)/(tabs)/profile"),
    ).toBeUndefined();
    expect(normalizeAuthReturnTo(`/(client)/jobs/${JOB_ID}`)).toBeUndefined();
    expect(normalizeAuthReturnTo("https://evil.example.com")).toBeUndefined();
  });

  it("rejects anything appended to an otherwise valid route", () => {
    expect(normalizeAuthReturnTo(`${VALID}/edit`)).toBeUndefined();
    expect(normalizeAuthReturnTo(`${VALID}?x=1`)).toBeUndefined();
    expect(normalizeAuthReturnTo(`  ${VALID}`)).toBeUndefined();
  });

  it("rejects a traversal dressed up as a job route", () => {
    expect(
      normalizeAuthReturnTo("/(contractor)/jobs/../../../etc/passwd"),
    ).toBeUndefined();
  });

  // expo-router hands a repeated query param over as an array.
  it("reads the first entry when the param arrives as an array", () => {
    expect(normalizeAuthReturnTo([VALID, "/(contractor)/(tabs)/profile"])).toBe(
      VALID,
    );
    expect(
      normalizeAuthReturnTo(["/(contractor)/(tabs)/profile", VALID]),
    ).toBeUndefined();
  });

  it("gives back nothing when there is no param", () => {
    expect(normalizeAuthReturnTo(undefined)).toBeUndefined();
    expect(normalizeAuthReturnTo([])).toBeUndefined();
    expect(normalizeAuthReturnTo("")).toBeUndefined();
  });
});

describe("buildJobDetailReturnTo", () => {
  it("builds a route its own validator accepts", () => {
    expect(normalizeAuthReturnTo(buildJobDetailReturnTo(JOB_ID))).toBe(VALID);
  });
});
