import { classifyAppFeedbackError } from "./errors";

describe("classifyAppFeedbackError", () => {
  it("maps 429 to rateLimited", () => {
    expect(classifyAppFeedbackError({ status: 429 })).toBe("rateLimited");
  });

  it("maps 401 and 403 to unauthorized", () => {
    expect(classifyAppFeedbackError({ status: 401 })).toBe("unauthorized");
    expect(classifyAppFeedbackError({ status: 403 })).toBe("unauthorized");
  });

  it("maps 400 and 422 to validation", () => {
    expect(classifyAppFeedbackError({ status: 400 })).toBe("validation");
    expect(classifyAppFeedbackError({ status: 422 })).toBe("validation");
  });

  it("maps a transport failure to network", () => {
    expect(classifyAppFeedbackError({ status: "FETCH_ERROR" })).toBe("network");
    expect(classifyAppFeedbackError({ status: "TIMEOUT_ERROR" })).toBe(
      "network",
    );
  });

  it("falls back to unknown for anything else", () => {
    expect(classifyAppFeedbackError({ status: 500 })).toBe("unknown");
    expect(classifyAppFeedbackError({ status: "PARSING_ERROR" })).toBe(
      "unknown",
    );
    expect(classifyAppFeedbackError(null)).toBe("unknown");
    expect(classifyAppFeedbackError(undefined)).toBe("unknown");
    expect(classifyAppFeedbackError("boom")).toBe("unknown");
    expect(classifyAppFeedbackError({})).toBe("unknown");
  });
});
