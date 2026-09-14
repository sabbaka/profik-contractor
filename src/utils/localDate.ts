/**
 * Formats a `Date` as `YYYY-MM-DD` in the device's local calendar day —
 * never `toISOString()`, which reads UTC and can land on the wrong day for
 * anyone west of UTC in the evening (23:30 local on the 3rd is still the 2nd
 * in UTC). This is what the `dateFrom`/`dateTo` filter params send: a day
 * the contractor picked on their own device, not a UTC instant.
 */
export function toDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
