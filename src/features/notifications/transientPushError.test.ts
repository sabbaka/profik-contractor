import { isTransientPushError } from "./transientPushError";

/** What expo-notifications throws: an Error with a `code`. */
function codedError(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}

describe("isTransientPushError", () => {
  // PROFIK-E, PROFIK-CONTRACTOR-E
  it("treats a connection lost while fetching the Expo token as transient", () => {
    const error = codedError(
      "ERR_NOTIFICATIONS_NETWORK_ERROR",
      "Error encountered while fetching Expo token: Error: fetch failed: UnexpectedException: The network connection was lost..",
    );
    expect(isTransientPushError(error)).toBe(true);
  });

  // PROFIK-CONTRACTOR-D
  it("treats Expo's 503 'temporarily unavailable' as transient", () => {
    const error = codedError(
      "ERR_NOTIFICATIONS_SERVER_ERROR",
      'Error encountered while fetching Expo token, expected an OK response, received: 503 (body: "{"errors":[{"code":"SERVICE_UNAVAILABLE","message":"The Expo API server is temporarily unavailable due to high load. Try again in a moment.","isTransient":true}]}").',
    );
    expect(isTransientPushError(error)).toBe(true);
  });

  it("trusts Expo marking an error transient whatever the status", () => {
    const error = codedError(
      "ERR_NOTIFICATIONS_SERVER_ERROR",
      'Error encountered while fetching Expo token, expected an OK response, received: 429 (body: "{"errors":[{"isTransient": true}]}").',
    );
    expect(isTransientPushError(error)).toBe(true);
  });

  it.each([502, 504])("treats a %i from Expo as transient", (status) => {
    const error = codedError(
      "ERR_NOTIFICATIONS_SERVER_ERROR",
      `Error encountered while fetching Expo token, expected an OK response, received: ${status} (body: "").`,
    );
    expect(isTransientPushError(error)).toBe(true);
  });

  it("reports any other refusal from Expo", () => {
    const error = codedError(
      "ERR_NOTIFICATIONS_SERVER_ERROR",
      'Error encountered while fetching Expo token, expected an OK response, received: 400 (body: "{"errors":[{"code":"VALIDATION_ERROR","isTransient":false}]}").',
    );
    expect(isTransientPushError(error)).toBe(false);
  });

  // PROFIK-CONTRACTOR-B
  it("treats saving the token without an answer from our server as transient", () => {
    expect(
      isTransientPushError({
        status: "FETCH_ERROR",
        error:
          "Error: fetch failed: UnexpectedException: The network connection was lost.",
      }),
    ).toBe(true);
    expect(
      isTransientPushError({ status: "TIMEOUT_ERROR", error: "Timeout" }),
    ).toBe(true);
  });

  it("reports a refusal from our server", () => {
    expect(isTransientPushError({ status: 401, data: null })).toBe(false);
    expect(isTransientPushError({ status: 500, data: null })).toBe(false);
  });

  it("reports everything else", () => {
    expect(isTransientPushError(new Error("Aborted"))).toBe(false);
    expect(isTransientPushError("offline")).toBe(false);
    expect(isTransientPushError(null)).toBe(false);
    expect(isTransientPushError(undefined)).toBe(false);
  });
});
