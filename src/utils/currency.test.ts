import { formatCzk } from "./currency";

/**
 * Hand-rolled rather than Intl, because Hermes' Intl on iOS answers with the
 * ASCII fallback symbol ("Kc" instead of "Kč"). Going back to the standard
 * library is therefore not an option, which leaves a regex, a float round and a
 * sign to get right by hand — the reason these exist.
 */
describe("formatCzk", () => {
  // U+00A0 both between the thousands and before the unit, written as an escape
  // so the intent is visible in the source: a plain space would let a price wrap
  // mid-number.
  const NBSP = "\u00A0";
  const czk = (value: string) => value + NBSP + "Kč";

  it("shows whole crowns without decimals", () => {
    expect(formatCzk(0)).toBe(czk("0"));
    expect(formatCzk(5)).toBe(czk("5"));
    expect(formatCzk(500)).toBe(czk("500"));
  });

  it("groups thousands", () => {
    expect(formatCzk(1000)).toBe(czk("1" + NBSP + "000"));
    expect(formatCzk(12345)).toBe(czk("12" + NBSP + "345"));
    expect(formatCzk(1234567)).toBe(czk("1" + NBSP + "234" + NBSP + "567"));
  });

  it("does not group a three-digit amount", () => {
    expect(formatCzk(999)).toBe(czk("999"));
  });

  it("keeps two decimals when the amount has a fraction", () => {
    expect(formatCzk(12.5)).toBe(czk("12,50"));
    expect(formatCzk(0.5)).toBe(czk("0,50"));
  });

  it("rounds to the nearest haléř", () => {
    expect(formatCzk(12.345)).toBe(czk("12,35"));
    expect(formatCzk(12.344)).toBe(czk("12,34"));
  });

  // Rounding happens before the whole-number test, so an amount that rounds to
  // a whole crown must not keep ",00".
  it("drops the decimals when rounding lands on a whole crown", () => {
    expect(formatCzk(0.005)).toBe(czk("0,01"));
    expect(formatCzk(0.001)).toBe(czk("0"));
    expect(formatCzk(4.999)).toBe(czk("5"));
  });

  // The sign goes in front of the grouped digits, never inside them.
  it("puts the minus before the number", () => {
    expect(formatCzk(-5)).toBe(czk("-5"));
    expect(formatCzk(-12.5)).toBe(czk("-12,50"));
    expect(formatCzk(-1500)).toBe(czk("-1" + NBSP + "500"));
  });

  it("groups a negative amount the same as a positive one", () => {
    expect(formatCzk(-1234567)).toBe(czk("-1" + NBSP + "234" + NBSP + "567"));
  });
});
