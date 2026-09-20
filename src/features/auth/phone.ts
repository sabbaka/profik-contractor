import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

/** Where the sign-in field starts. The app bills in CZK and works in Prague. */
export const DEFAULT_COUNTRY: CountryCode = "CZ";

export interface Country {
  code: CountryCode;
  /** Dialling code without the plus, e.g. "420". */
  callingCode: string;
  /** Localised name, or the ISO code where the platform cannot name it. */
  name: string;
  flag: string;
}

/**
 * Turns whatever the user typed into an E.164 number the backend will accept.
 *
 * `country` is the one chosen in the field's selector, and it decides how a
 * number without a country code is read — `777123456` is Czech under CZ and
 * Polish under PL. A number that carries its own `+` ignores it, so pasting a
 * full international number always works whatever the selector says.
 *
 * Validation is per country rather than a digit count: libphonenumber knows
 * that a Czech subscriber number is nine digits and a German one is not fixed
 * at all. Anything it rejects comes back as `null`, and the caller turns that
 * into a field error rather than letting the API answer 400 — or worse, letting
 * an SMS go to a number that cannot exist.
 */
export function normalizePhone(
  input: string,
  country: CountryCode = DEFAULT_COUNTRY,
): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 00 is the other way of writing +, and no national number starts with it.
  const candidate = trimmed.startsWith("00") ? `+${trimmed.slice(2)}` : trimmed;

  const parsed = parsePhoneNumberFromString(candidate, country);
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number;
}

/** True when `normalizePhone` can make an E.164 number out of the input. */
export function isPhoneComplete(
  input: string,
  country: CountryCode = DEFAULT_COUNTRY,
): boolean {
  return normalizePhone(input, country) !== null;
}

/**
 * Groups the digits as they are typed, the way the chosen country writes them:
 * `777 123 456` for CZ, `7700 900000` for GB.
 *
 * Spacing only — `normalizePhone` strips it again on submit. What the reader
 * sees has to be checkable against the number on their SIM, and a run of nine
 * digits is not.
 */
export function formatPhoneInput(
  input: string,
  country: CountryCode = DEFAULT_COUNTRY,
): string {
  // AsYouType formats nothing it considers already international, so a pasted
  // +420… keeps its own shape rather than being re-read under `country`.
  return new AsYouType(country).input(input);
}

/** Whether the typed value names its own country, by a leading `+` or `00`. */
export function hasExplicitCountryCode(input: string): boolean {
  const trimmed = input.trim();
  return trimmed.startsWith("+") || trimmed.startsWith("00");
}

export interface SplitPhone {
  country: CountryCode;
  /** The number without its dialling code, unformatted. */
  nationalNumber: string;
}

/**
 * Separates a number that names its own country into that country and the
 * national part the field should hold.
 *
 * The dialling code beside the input is a selector, not text: it is not part of
 * the form value, so the field is expected to carry the national number alone.
 * Autofill does not know that and writes the full `+420 777 123 456` into it,
 * which lands beside a selector already reading +420 — the screen then shows
 * `+420+420 777 123 456`. Moving the country code to the selector keeps the two
 * halves telling the same story, and covers the other direction too: a number
 * pasted with a `+48` now moves the selector to Poland instead of leaving it
 * contradicting the value.
 *
 * `null` means the value names no country, or names one that cannot be
 * identified yet — a lone `+` or half a dialling code, which someone typing by
 * hand passes through on the way to a whole number.
 */
export function splitCountryCode(input: string): SplitPhone | null {
  if (!hasExplicitCountryCode(input)) return null;

  const trimmed = input.trim();
  // 00 is the other way of writing +, the same as `normalizePhone` reads it.
  const candidate = trimmed.startsWith("00") ? `+${trimmed.slice(2)}` : trimmed;

  // No default country: the point is to read the one the value carries, and
  // passing a fallback would invent an answer for a half-typed dialling code.
  const parsed = parsePhoneNumberFromString(candidate);
  if (!parsed?.country) return null;

  return { country: parsed.country, nationalNumber: parsed.nationalNumber };
}

/** The flag as regional indicator letters, which every platform renders. */
export function flagEmoji(code: string): string {
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)),
  );
}

/**
 * Every country libphonenumber knows, named in the interface language and
 * sorted by that name.
 *
 * Names come from `Intl.DisplayNames`, which this runtime may not carry — the
 * app already relies on `Intl.NumberFormat` and `toLocaleDateString`, but
 * `DisplayNames` is a later addition and Hermes has shipped without it. The
 * fallback is the ISO code, so the row still reads `🇨🇿 CZ +420` and stays
 * searchable by code; it is not an error worth reporting.
 */
export function listCountries(locale: string): Country[] {
  const display = displayNames(locale);

  return getCountries()
    .map((code) => ({
      code,
      callingCode: getCountryCallingCode(code),
      name: display?.of(code) ?? code,
      flag: flagEmoji(code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

function displayNames(locale: string): Intl.DisplayNames | undefined {
  try {
    return new Intl.DisplayNames([locale], { type: "region" });
  } catch {
    return undefined;
  }
}

/**
 * Matches a country against what was typed in the search box: its name, its
 * ISO code, or its dialling code with or without the plus — people look for
 * their country by all three.
 */
export function matchesCountryQuery(country: Country, query: string): boolean {
  const needle = query.trim().toLowerCase().replace(/^\+/, "");
  if (!needle) return true;
  return (
    country.name.toLowerCase().includes(needle) ||
    country.code.toLowerCase().includes(needle) ||
    country.callingCode.startsWith(needle)
  );
}
