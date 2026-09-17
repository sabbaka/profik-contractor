import type { TFunction } from "i18next";
import { formatCategory, formatWorkName } from "./jobWorkName";

/**
 * Mirrors the client app's suite for the same helpers, which live there in
 * `src/features/jobs/utils.ts` — the doc comment on both copies asks for the
 * two to be kept in step, and this is what makes that checkable.
 */
/** i18next with the key present: echoes the key so the lookup is visible. */
const t = ((key: string, options?: Record<string, string>) =>
  key === "job.workName"
    ? `${options?.service} — ${options?.property}`
    : key) as unknown as TFunction;

/** i18next with the key missing: falls through to whatever default was given. */
const tMissingKey = ((_key: string, options?: { defaultValue?: string }) =>
  options?.defaultValue) as unknown as TFunction;

describe("formatWorkName", () => {
  it("builds the name from the two stored columns", () => {
    expect(
      formatWorkName(
        {
          title: "Standard Cleaning — Apartment",
          serviceType: "standard",
          propertyType: "apartment",
        },
        t,
      ),
    ).toBe("job.serviceType.standard — job.propertyType.apartment");
  });

  // The stored title is the English the client's wizard wrote; it is deliberately
  // still written and still sent, and this is the only thing it is read for.
  it("falls back to the stored title for a job that predates those columns", () => {
    expect(
      formatWorkName(
        { title: "Bathroom Renovation", serviceType: null, propertyType: null },
        t,
      ),
    ).toBe("Bathroom Renovation");
  });

  it("names the service alone when only the property is missing", () => {
    expect(
      formatWorkName(
        { title: "x", serviceType: "deep", propertyType: null },
        t,
      ),
    ).toBe("job.serviceType.deep");
  });

  it("says so when there is neither a title nor a service", () => {
    expect(
      formatWorkName({ title: "", serviceType: null, propertyType: null }, t),
    ).toBe("job.untitled");
    expect(formatWorkName({ title: "   " }, t)).toBe("job.untitled");
    expect(formatWorkName(null, t)).toBe("job.untitled");
    expect(formatWorkName(undefined, t)).toBe("job.untitled");
  });

  it("trims a title before showing it", () => {
    expect(formatWorkName({ title: "  Weekly flat clean  " }, t)).toBe(
      "Weekly flat clean",
    );
  });
});

describe("formatCategory", () => {
  // The enum value is the key, in the casing the backend sends.
  it("looks the stored enum up as a key", () => {
    expect(formatCategory("Cleaning", t)).toBe("job.category.Cleaning");
    expect(formatCategory("Renovation", t)).toBe("job.category.Renovation");
  });

  // A category the backend adds before the apps ship a key for it.
  it("shows the bare value when there is no key for it", () => {
    expect(formatCategory("Gardening", tMissingKey)).toBe("Gardening");
  });

  // Callers join card meta with .filter(Boolean), so "" and not undefined.
  it("returns an empty string when there is no category at all", () => {
    expect(formatCategory(null, t)).toBe("");
    expect(formatCategory(undefined, t)).toBe("");
    expect(formatCategory("", t)).toBe("");
  });
});
