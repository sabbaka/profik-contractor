import * as Sentry from "@sentry/react-native";
import { Alert } from "react-native";
import { logError } from "./logger";

/**
 * Every caught error in the app ends up here, which means this function is
 * handed whatever was thrown — not necessarily an `Error`. A throw from inside
 * the error handler is the worst possible failure mode: it replaces a logged
 * problem with an unlogged crash, and it happens in exactly the paths nobody
 * exercises by hand.
 *
 * `normalizeError` and `safeJsonStringify` are private, so this goes through
 * `logError` and reads what actually reached the console, the dev alert and
 * Sentry.
 */
describe("logError", () => {
  let consoleError: jest.SpyInstance;
  let alert: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
    alert.mockRestore();
  });

  /** What was logged, as one string, whatever shape the arguments took. */
  const logged = () => consoleError.mock.calls[0].join(" ");

  it("keeps an Error's own message and stack", () => {
    const error = new Error("boom");
    logError(error);

    expect(logged()).toContain("boom");
    expect(logged()).toContain("logger.test");
  });

  it("passes an Error to Sentry as itself, not a copy", () => {
    const error = new Error("boom");
    logError(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(
      error,
      expect.anything(),
    );
  });

  it("tags the line with the context, and says so when there is none", () => {
    logError(new Error("boom"), "phoneAuth:verifyCode");
    expect(consoleError.mock.calls[0][0]).toBe("[phoneAuth:verifyCode]");
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.anything(), {
      tags: { context: "phoneAuth:verifyCode" },
      extra: undefined,
    });

    consoleError.mockClear();
    logError(new Error("boom"));
    expect(consoleError.mock.calls[0][0]).toBe("[error]");
  });

  it("wraps a thrown string", () => {
    logError("something went wrong");

    expect(logged()).toContain("something went wrong");
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: "something went wrong" }),
      expect.anything(),
    );
  });

  it("reads the message off a plain object that carries one", () => {
    logError({ message: "server said no", status: 500 });
    expect(logged()).toContain("server said no");
  });

  it("falls back to the object itself when it carries no message", () => {
    logError({ code: 42 });
    expect(logged()).toContain("42");
  });

  it("says something rather than nothing for a thrown nullish value", () => {
    logError(null);
    expect(logged()).toContain("Unknown error");

    consoleError.mockClear();
    logError(undefined);
    expect(logged()).toContain("Unknown error");
  });

  // RTK Query rejects with a plain object, and a title built from its JSON
  // read "Error: {" for every failure alike in Sentry's issue list
  // (PROFIK-5, PROFIK-4, PROFIK-B).
  it("names an API error by its status and context, not by its JSON", () => {
    logError({ status: 504, data: null }, "phoneAuth:requestCode");

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: "HTTP 504 · phoneAuth:requestCode" }),
      expect.objectContaining({
        tags: { context: "phoneAuth:requestCode" },
        extra: expect.objectContaining({
          error: expect.stringContaining("504"),
        }),
      }),
    );
  });

  it("names a transport failure by its tag, and adds the path the server gave", () => {
    logError(
      { status: "FETCH_ERROR", error: "TypeError: Network request failed" },
      "createJob:mutation",
    );
    expect(Sentry.captureException).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: "FETCH_ERROR · createJob:mutation" }),
      expect.anything(),
    );

    logError({
      status: 401,
      data: {
        statusCode: 401,
        message: "Unauthorized",
        path: "/users/me/push-token",
      },
    });
    expect(Sentry.captureException).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: "HTTP 401 · /users/me/push-token" }),
      expect.anything(),
    );
  });

  it("names a reply that was not JSON by its HTTP status, and drops the query", () => {
    logError(
      { status: "PARSING_ERROR", originalStatus: 502, data: "<html>…</html>" },
      "openJobs",
    );
    expect(Sentry.captureException).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: "HTTP 502 · openJobs" }),
      expect.anything(),
    );

    logError({
      status: 500,
      data: { path: "/jobs/open?lat=50.08&lng=14.42&radiusKm=10" },
    });
    expect(Sentry.captureException).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: "HTTP 500 · /jobs/open" }),
      expect.anything(),
    );
  });

  it("keeps the server's own words out of the title", () => {
    logError(
      { status: 400, data: { message: "price must not be less than 200" } },
      "createJob:mutation",
    );

    const [sent] = (Sentry.captureException as jest.Mock).mock.calls.at(-1);
    expect(sent.message).toBe("HTTP 400 · createJob:mutation");
  });

  // A rejected RTK Query action and a Sentry event both hold back-references,
  // and JSON.stringify throws on those.
  it("survives a circular object instead of throwing over it", () => {
    const circular: Record<string, unknown> = { code: 500 };
    circular.self = circular;

    expect(() => logError(circular)).not.toThrow();
    expect(consoleError).toHaveBeenCalled();
  });

  it("survives circular extra, which is logged rather than thrown over", () => {
    const circular: Record<string, unknown> = { attempt: 1 };
    circular.self = circular;

    expect(() => logError(new Error("boom"), "ctx", circular)).not.toThrow();
    expect(consoleError.mock.calls[0]).toHaveLength(4);
  });

  it("puts the message in front of the developer in dev", () => {
    logError(new Error("boom"), "ctx");

    expect(alert).toHaveBeenCalledWith(
      "Caught error · ctx",
      expect.stringContaining("boom"),
    );
  });
});
