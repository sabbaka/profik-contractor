import type { TFunction } from "i18next";
import { formatCountry } from "./country";

/** i18next with the key present: echoes the key so the lookup is visible. */
const t = ((key: string) => key) as unknown as TFunction;

/** i18next with the key missing: falls through to whatever default was given. */
const tMissingKey = ((_key: string, options?: { defaultValue?: string }) =>
  options?.defaultValue) as unknown as TFunction;

/**
 * Mirrors the client app's suite for the same helper, which lives there in
 * `src/features/jobs/utils.ts` — the doc comment on both copies asks for the
 * two to be kept in step, and this is what makes that checkable.
 */
describe("formatCountry", () => {
  // The column holds an ISO code because a name has a language — it used to
  // hold both "Czechia" and "Česko" for the same country.
  it("looks the code up as a key, normalised to upper case", () => {
    expect(formatCountry("cz", t)).toBe("job.country.CZ");
    expect(formatCountry("CZ", t)).toBe("job.country.CZ");
  });

  it("shows the bare code when there is no key for it", () => {
    expect(formatCountry("SK", tMissingKey)).toBe("SK");
  });

  // Callers join address parts with .filter(Boolean), so "" and not undefined.
  it("returns an empty string when there is no country at all", () => {
    expect(formatCountry(null, t)).toBe("");
    expect(formatCountry(undefined, t)).toBe("");
    expect(formatCountry("", t)).toBe("");
  });
});
