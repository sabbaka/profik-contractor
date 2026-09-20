import {
  formatPhoneInput,
  hasExplicitCountryCode,
  isPhoneComplete,
  listCountries,
  matchesCountryQuery,
  normalizePhone,
  splitCountryCode,
} from "./phone";

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

  /**
   * Validation is per country, not a digit count. `+12345678` fits the old
   * 8-15 rule and is not a number anywhere, and sending an SMS to it is a
   * silent failure the user experiences as "the code never came".
   */
  it("rejects a number no country actually issues", () => {
    expect(normalizePhone("+12345678")).toBeNull();
    expect(normalizePhone("+1234567890123456")).toBeNull();
    expect(normalizePhone("777123", "CZ")).toBeNull();
  });

  it("reads a bare number under the country it is given", () => {
    expect(normalizePhone("777123456", "CZ")).toBe("+420777123456");
    expect(normalizePhone("501234567", "PL")).toBe("+48501234567");
    // The same nine digits, read under a different country.
    expect(normalizePhone("777123456", "PL")).toBe("+48777123456");
  });

  it("lets an explicit country code win over the selector", () => {
    expect(normalizePhone("+420777123456", "PL")).toBe("+420777123456");
  });
});

describe("isPhoneComplete", () => {
  it("is true exactly when a number can be made", () => {
    expect(isPhoneComplete("777123456")).toBe(true);
    expect(isPhoneComplete("77712345")).toBe(false);
  });
});

describe("hasExplicitCountryCode", () => {
  it.each(["+420777123456", "+44 7700 900000", "00420777123456", "  +1"])(
    "reads %s as carrying its own country",
    (input) => {
      expect(hasExplicitCountryCode(input)).toBe(true);
    },
  );

  it.each(["777123456", "777 123 456", "", "0777"])(
    "reads %s as a national number",
    (input) => {
      expect(hasExplicitCountryCode(input)).toBe(false);
    },
  );
});

/**
 * The dialling code beside the field is a selector, not text, so the field is
 * expected to hold the national number alone. Autofill writes a whole
 * international number into it regardless — this is what keeps the two from
 * both claiming the country code.
 */
describe("splitCountryCode", () => {
  it("takes the country code off an autofilled number", () => {
    expect(splitCountryCode("+420777123456")).toEqual({
      country: "CZ",
      nationalNumber: "777123456",
    });
  });

  it("reads a number however it was spaced or written", () => {
    expect(splitCountryCode("+420 777 123 456")).toEqual({
      country: "CZ",
      nationalNumber: "777123456",
    });
    expect(splitCountryCode("  +420777123456  ")).toEqual({
      country: "CZ",
      nationalNumber: "777123456",
    });
    // 00 is the other way of writing +, as `normalizePhone` also reads it.
    expect(splitCountryCode("00420777123456")).toEqual({
      country: "CZ",
      nationalNumber: "777123456",
    });
  });

  it("names the country the number carries, not the one selected", () => {
    expect(splitCountryCode("+48501234567")).toEqual({
      country: "PL",
      nationalNumber: "501234567",
    });
  });

  it("leaves a number with no country code alone", () => {
    expect(splitCountryCode("777123456")).toBeNull();
    expect(splitCountryCode("")).toBeNull();
  });

  /**
   * Someone typing a country code by hand passes through every prefix of it.
   * Answering early would move the selector under them mid-keystroke.
   */
  it.each(["+", "+4", "+42", "+420"])(
    "holds off while %s is still being typed",
    (input) => {
      expect(splitCountryCode(input)).toBeNull();
    },
  );

  it("says nothing about a dialling code that names no country", () => {
    expect(splitCountryCode("+999123456")).toBeNull();
  });
});

/**
 * Grouping is what lets someone check the field against the number on their
 * SIM. It must never change which digits are there — `normalizePhone` strips
 * the spacing again on submit, so a digit added here would be a digit dialled.
 */
describe("formatPhoneInput", () => {
  it("groups a national number the way its country writes it", () => {
    expect(formatPhoneInput("777123456", "CZ")).toBe("777 123 456");
    // British numbers are written with their trunk zero; Czech ones are not.
    expect(formatPhoneInput("07700900000", "GB")).toBe("07700 900000");
  });

  it("groups as it is typed, without trailing space", () => {
    expect(formatPhoneInput("777")).toBe("777");
    expect(formatPhoneInput("7771")).toBe("777 1");
  });

  it("keeps the country code apart from the subscriber number", () => {
    expect(formatPhoneInput("+420777123456")).toBe("+420 777 123 456");
    expect(formatPhoneInput("00420777123456")).toBe("00 420 777 123 456");
  });

  it("holds a lone prefix while the reader is still typing", () => {
    expect(formatPhoneInput("+")).toBe("+");
    expect(formatPhoneInput("+420")).toBe("+420");
  });

  it("re-formats input that already carries spacing", () => {
    expect(formatPhoneInput("+420 777 123 456")).toBe("+420 777 123 456");
    expect(formatPhoneInput("777 123 456")).toBe("777 123 456");
  });

  it("never adds or drops a digit", () => {
    for (const input of ["777123456", "+420777123456", "+447700900000", "12"]) {
      expect(formatPhoneInput(input).replace(/\D/g, "")).toBe(
        input.replace(/\D/g, ""),
      );
    }
  });

  // The pair has to survive a round trip: what the field shows is what the
  // normaliser is handed on submit.
  it("stays normalisable after formatting", () => {
    expect(normalizePhone(formatPhoneInput("777123456"))).toBe("+420777123456");
    expect(normalizePhone(formatPhoneInput("+420777123456"))).toBe(
      "+420777123456",
    );
  });
});

describe("listCountries", () => {
  const countries = listCountries("en");

  it("covers everything libphonenumber knows", () => {
    expect(countries.length).toBeGreaterThan(200);
  });

  it("carries a dialling code and a flag for each", () => {
    const cz = countries.find((c) => c.code === "CZ");
    expect(cz?.callingCode).toBe("420");
    expect(cz?.flag).toBe("\u{1F1E8}\u{1F1FF}");
  });

  // The fallback is the ISO code, so a row is never blank even where the
  // runtime cannot name the region.
  it("never leaves a country unnamed", () => {
    expect(countries.every((c) => c.name.length > 0)).toBe(true);
  });
});

describe("matchesCountryQuery", () => {
  const cz = listCountries("en").find((c) => c.code === "CZ")!;

  it.each(["cz", "420", "+420", "+4"])("finds it by %s", (query) => {
    expect(matchesCountryQuery(cz, query)).toBe(true);
  });

  it("matches everything on an empty query", () => {
    expect(matchesCountryQuery(cz, "   ")).toBe(true);
  });

  it("does not match an unrelated code", () => {
    expect(matchesCountryQuery(cz, "48")).toBe(false);
  });
});
