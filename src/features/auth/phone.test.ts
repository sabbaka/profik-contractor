import { isPhoneComplete, normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("assumes Czech Republic for a bare subscriber number", () => {
    expect(normalizePhone("777123456")).toBe("+420777123456");
  });

  it("ignores whatever spacing the user typed", () => {
    expect(normalizePhone("777 123 456")).toBe("+420777123456");
    expect(normalizePhone("+420 777 123 456")).toBe("+420777123456");
    expect(normalizePhone("  777123456  ")).toBe("+420777123456");
    expect(normalizePhone("(777) 123-456")).toBe("+420777123456");
  });

  it("reads 00 as the other spelling of +", () => {
    expect(normalizePhone("00420777123456")).toBe("+420777123456");
  });

  it("accepts the country code typed without the plus", () => {
    expect(normalizePhone("420777123456")).toBe("+420777123456");
  });

  // A foreign worker signing in with their own country code is the reason the
  // Czech default is a fallback rather than a rule.
  it("keeps a number that already carries a country code", () => {
    expect(normalizePhone("+49 170 1234567")).toBe("+491701234567");
  });

  it("rejects input that cannot be a phone number", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("   ")).toBeNull();
    expect(normalizePhone("abc")).toBeNull();
    // Neither a bare subscriber number nor a country code plus one.
    expect(normalizePhone("7771234")).toBeNull();
    expect(normalizePhone("7771234567")).toBeNull();
  });

  it("rejects a leading zero after the country code is stripped", () => {
    // 00 handling leaves "0777123456", which is a national trunk prefix, not E.164.
    expect(normalizePhone("000777123456")).toBeNull();
    expect(normalizePhone("+0777123456")).toBeNull();
  });

  it("holds E.164 to 8-15 digits", () => {
    expect(normalizePhone("+1234567")).toBeNull();
    expect(normalizePhone("+12345678")).toBe("+12345678");
    expect(normalizePhone("+123456789012345")).toBe("+123456789012345");
    expect(normalizePhone("+1234567890123456")).toBeNull();
  });
});

describe("isPhoneComplete", () => {
  it("is true exactly when a number can be made", () => {
    expect(isPhoneComplete("777123456")).toBe(true);
    expect(isPhoneComplete("77712345")).toBe(false);
  });
});
