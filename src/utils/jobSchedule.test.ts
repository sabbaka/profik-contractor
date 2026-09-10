import type { TFunction } from "i18next";
import { dateLocale, formatSchedule } from "./jobSchedule";

/** i18next with the key present: echoes the key so the lookup is visible. */
const t = ((key: string) => key) as unknown as TFunction;

/**
 * Mirrors the client app's suite for the same two helpers, which live there in
 * `src/features/jobs/utils.ts`. Both apps shipped the "shows when it was
 * posted, not when it is scheduled" bug and both fixed it separately; only the
 * client got a test for it.
 */
describe("dateLocale", () => {
  // Dates were once formatted with a hardcoded "en-US", so a Czech user saw
  // American dates whatever the interface language said.
  it("follows the interface language", () => {
    expect(dateLocale("cs")).toBe("cs-CZ");
    expect(dateLocale("uk")).toBe("uk-UA");
    expect(dateLocale("en")).toBe("en-US");
  });

  it("accepts a language that carries a region", () => {
    expect(dateLocale("cs-CZ")).toBe("cs-CZ");
    expect(dateLocale("en-GB")).toBe("en-US");
  });

  it("falls back to English for anything unmapped", () => {
    expect(dateLocale("de")).toBe("en-US");
    expect(dateLocale("")).toBe("en-US");
  });
});

describe("formatSchedule", () => {
  it("states the date the client asked for", () => {
    expect(formatSchedule(["2026-03-03T00:00:00.000Z"], "en-US", t)).toBe(
      "Mar 3",
    );
  });

  it("states the earliest date and counts the rest", () => {
    const out = formatSchedule(
      ["2026-03-05T00:00:00.000Z", "2026-03-03T00:00:00.000Z"],
      "en-US",
      t,
    );
    expect(out).toBe("Mar 3 +1");
  });

  it("sorts before counting, whatever order they arrive in", () => {
    const out = formatSchedule(
      [
        "2026-03-09T00:00:00.000Z",
        "2026-03-03T00:00:00.000Z",
        "2026-03-06T00:00:00.000Z",
      ],
      "en-US",
      t,
    );
    expect(out).toBe("Mar 3 +2");
  });

  // "flexible" is a stored choice, not a date, and must never reach Date().
  it("resolves flexible to copy instead of parsing it", () => {
    expect(formatSchedule(["flexible"], "en-US", t)).toBe("job.dateFlexible");
    expect(
      formatSchedule(["flexible", "2026-03-03T00:00:00.000Z"], "en-US", t),
    ).toBe("job.dateFlexible");
  });

  // Jobs created before the wizard asked for a date have none, and the caller
  // drops the whole row rather than rendering an empty one.
  it("gives back nothing when there is nothing to state", () => {
    expect(formatSchedule(undefined, "en-US", t)).toBeUndefined();
    expect(formatSchedule(null, "en-US", t)).toBeUndefined();
    expect(formatSchedule([], "en-US", t)).toBeUndefined();
    expect(formatSchedule(["", ""], "en-US", t)).toBeUndefined();
    expect(formatSchedule(["not-a-date"], "en-US", t)).toBeUndefined();
  });

  it("drops the unparseable ones and keeps the rest", () => {
    expect(
      formatSchedule(["not-a-date", "2026-03-03T00:00:00.000Z"], "en-US", t),
    ).toBe("Mar 3");
  });

  it("follows the locale it is handed", () => {
    const cs = formatSchedule(["2026-03-03T00:00:00.000Z"], "cs-CZ", t);
    expect(cs).not.toBe("Mar 3");
    expect(cs).toContain("3");
  });

  it("adds the year only when asked", () => {
    expect(
      formatSchedule(["2026-03-03T00:00:00.000Z"], "en-US", t, { year: true }),
    ).toContain("2026");
    expect(
      formatSchedule(["2026-03-03T00:00:00.000Z"], "en-US", t),
    ).not.toContain("2026");
  });
});
