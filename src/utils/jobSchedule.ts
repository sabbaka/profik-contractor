import type { TFunction } from "i18next";

const DATE_LOCALES: Record<string, string> = {
  cs: "cs-CZ",
  uk: "uk-UA",
  en: "en-US",
};

/**
 * BCP 47 tag for `Intl`, chosen from the active i18n language.
 *
 * The client app carries the same helper in `src/features/jobs/utils.ts`;
 * keep the two in step.
 */
export function dateLocale(language: string): string {
  return DATE_LOCALES[language.slice(0, 2)] ?? "en-US";
}

/**
 * The date the client asked for, for the job card and the detail hero — not
 * `createdAt`, the date the job was posted, which both screens used to show.
 *
 * `scheduledDates` is an array because the backend accepts several; the
 * client wizard sends exactly one today, so this states the earliest and
 * counts the rest.
 *
 * "flexible" is a stored value rather than a date — the wizard offers it as a
 * choice and sends it verbatim — so it is resolved to copy, never parsed.
 *
 * Returns undefined when there is nothing to state, and the caller drops the
 * row. Jobs created before the wizard asked for a date have none.
 *
 * The client app carries the same helper in `src/features/jobs/utils.ts`;
 * keep the two in step.
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

  const first = parsed[0].toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    ...(options.year ? { year: "numeric" as const } : {}),
  });
  return parsed.length > 1 ? `${first} +${parsed.length - 1}` : first;
}
