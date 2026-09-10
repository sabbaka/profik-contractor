import { classifyPhoneAuthError, phoneAuthErrorKey } from "./errors";

describe("classifyPhoneAuthError", () => {
  // RTK Query reports HTTP failures as a number and transport failures as a
  // string tag, so both shapes have to be handled — this is the split the
  // classifier exists for.
  it("tells the HTTP failures apart", () => {
    expect(classifyPhoneAuthError({ status: 429 })).toBe("tooManyAttempts");
    expect(classifyPhoneAuthError({ status: 403 })).toBe("wrongApp");
    expect(classifyPhoneAuthError({ status: 422 })).toBe("undeliverable");
    expect(classifyPhoneAuthError({ status: 404 })).toBe("expired");
    expect(classifyPhoneAuthError({ status: 401 })).toBe("invalidCode");
  });

  // 404 is "no pending verification" and 401 is "wrong digits". They need
  // different advice — resend versus retype — so collapsing them is a bug.
  it("keeps an expired code apart from a mistyped one", () => {
    expect(classifyPhoneAuthError({ status: 404 })).not.toBe(
      classifyPhoneAuthError({ status: 401 }),
    );
  });

  it("treats transport failures as network", () => {
    expect(classifyPhoneAuthError({ status: "FETCH_ERROR" })).toBe("network");
    expect(classifyPhoneAuthError({ status: "TIMEOUT_ERROR" })).toBe("network");
  });

  it("falls back to unknown for anything it cannot read", () => {
    expect(classifyPhoneAuthError({ status: "PARSING_ERROR" })).toBe("unknown");
    expect(classifyPhoneAuthError({ status: 500 })).toBe("unknown");
    expect(classifyPhoneAuthError({})).toBe("unknown");
    expect(classifyPhoneAuthError(null)).toBe("unknown");
    expect(classifyPhoneAuthError(undefined)).toBe("unknown");
    expect(classifyPhoneAuthError("boom")).toBe("unknown");
  });
});

describe("phoneAuthErrorKey", () => {
  it("namespaces the kind under the otp errors", () => {
    expect(phoneAuthErrorKey("wrongApp")).toBe("auth.otp.errors.wrongApp");
  });
});
