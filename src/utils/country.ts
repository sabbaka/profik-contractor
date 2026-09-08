import type { TFunction } from "i18next";

/**
 * Display label for a stored country.
 *
 * The backend stores an ISO 3166-1 alpha-2 code rather than a name, because a
 * name has a language and the column used to hold "Czechia" and "Česko" for the
 * same country. The label belongs here, in the locale the reader is using.
 *
 * Falls back to the code itself for anything we have no key for — visible and
 * harmless, rather than a blank where a country should be. Returns "" when
 * there is no country at all, so callers can keep using `.filter(Boolean)`.
 *
 * The client app carries the same helper in `src/features/jobs/utils.ts`; keep
 * the two in step.
 */
export function formatCountry(
  code: string | null | undefined,
  t: TFunction,
): string {
  if (!code) return "";

  const normalized = code.toUpperCase();
  return t(`job.country.${normalized}`, { defaultValue: normalized });
}
