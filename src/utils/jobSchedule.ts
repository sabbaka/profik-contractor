import type { TFunction } from "i18next";

/*
 * Both apps carry this module at this same path, byte for byte, and
 * `shared-modules.json` in each records it. A change here fails
 * `npm run shared:check` until it has been carried to the other app.
 *
 * It is its own module rather than part of a larger utilities file so that the
 * check covers exactly these two helpers. The copies used to live under
 * different paths and neither was recorded, so when the client moved to date
 * spans on 15.09 the contractor app went on printing "15 Sep +1" for two weeks.
 */

const DATE_LOCALES: Record<string, string> = {
  cs: "cs-CZ",
  uk: "uk-UA",
  en: "en-US",
};

/**
 * BCP 47 tag for Intl, chosen from the active i18n language.
 *
 * Dates used to be formatted with a hardcoded "en-US", so a Czech user saw
 * American dates whatever the interface language was. Pass `i18n.language`.
 * It arrives as a bare code ("cs") but can carry a region ("cs-CZ"), so match
 * on the prefix; anything the app has no mapping for falls back to English,
 * the same fallback i18next uses for copy.
 */
export function dateLocale(language: string): string {
  return DATE_LOCALES[language.slice(0, 2)] ?? "en-US";
}

/**
 * The date the client asked for, for the job card and the details hero — not
 * `createdAt`, the date the job was posted, which both screens used to show.
 *
 * `scheduledDates` is an array because the backend accepts several. One entry
 * is a day; two or more are the ends of a span the client will accept, which
 * is what the client wizard's "this week" preset sends.
 *
 * "flexible" is a stored value rather than a date — the wizard offers it as a
 * choice and sends it verbatim — so it is resolved to copy, never parsed.
 *
 * Returns undefined when there is nothing to state, and the caller drops the
 * row. Jobs created before the wizard asked for a date have none.
 */
export function formatSchedule(
  dates: string[] | null | undefined,
  locale: string,
  t: TFunction,
  options: { year?: boolean } = {},
): string | undefined {
  const values = dates?.filter(Boolean) ?? [];
  if (values.length === 0) return undefined;
  if (values.includes("flexible")) return t("job.dateFlexible");

  const parsed = values
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  if (parsed.length === 0) return undefined;

  const style = {
    month: "short" as const,
    day: "numeric" as const,
    ...(options.year ? { year: "numeric" as const } : {}),
  };
  const first = parsed[0].toLocaleDateString(locale, style);
  if (parsed.length === 1) return first;

  // Earliest to latest, not "+N": these are days the client will accept, and a
  // count says how many without saying which. An en dash, because this is a
  // span of dates rather than a subtraction.
  const last = parsed[parsed.length - 1].toLocaleDateString(locale, style);
  return `${first} – ${last}`;
}
