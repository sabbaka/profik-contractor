const CZ_DIALLING_CODE = "420";
const CZ_SUBSCRIBER_LENGTH = 9;

/**
 * Turns whatever the user typed into an E.164 number the backend will accept.
 *
 * The sign-in screen takes a free-form phone field rather than a masked one, so
 * this has to cope with everything a Czech user reasonably types: `777123456`,
 * `777 123 456`, `+420 777 123 456`, `00420777123456`. Anything that still
 * doesn't look like a phone number comes back as `null` — the caller turns that
 * into a field error rather than letting the API reject it with a 400.
 *
 * Czech Republic is the default country: a bare subscriber number gets `+420`.
 * A number that already carries a `+` is kept as-is, so foreign workers can
 * sign in with their own country code.
 */
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const hasPlus = trimmed.startsWith("+");
  let digits = trimmed.replace(/\D/g, "");

  // 00 is the other way of writing +, and nobody's national number starts 00.
  if (!hasPlus && digits.startsWith("00")) {
    digits = digits.slice(2);
    return toE164(digits);
  }

  if (hasPlus) return toE164(digits);

  if (digits.length === CZ_SUBSCRIBER_LENGTH) {
    return toE164(CZ_DIALLING_CODE + digits);
  }

  // Typed the country code without the plus.
  if (digits.length === CZ_DIALLING_CODE.length + CZ_SUBSCRIBER_LENGTH) {
    return toE164(digits);
  }

  return null;
}

/** E.164 allows 8–15 digits including the country code. */
function toE164(digits: string): string | null {
  if (digits.length < 8 || digits.length > 15) return null;
  if (digits.startsWith("0")) return null;
  return `+${digits}`;
}

/** True when `normalizePhone` can make an E.164 number out of the input. */
export function isPhoneComplete(input: string): boolean {
  return normalizePhone(input) !== null;
}
