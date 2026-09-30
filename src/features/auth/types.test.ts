import i18n from "@/src/i18n";
import * as Sentry from "@sentry/react-native";
import { extractErrorMessage } from "./types";

const t = (key: string) => i18n.t(key);

const serverError = (data: Record<string, unknown>, status = 400) => ({
  status,
  data: { statusCode: status, ...data },
});

describe("extractErrorMessage", () => {
  beforeEach(() => {
    jest.mocked(Sentry.addBreadcrumb).mockClear();
  });

  it("translates an error that carries a known code", () => {
    const error = serverError({
      code: "job.notOpen",
      message: "Job is not open",
    });

    expect(extractErrorMessage(error, t)).toBe("This job is no longer open.");
    expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();
  });

  // Each app words these for its own screens, so the test asks only that
  // the code has wording of ours: not the generic line, not the server's.
  it.each([
    "offer.ownJob",
    "job.invalidScheduledDate",
    "avatar.tooSmall",
    "avatar.fileTooLarge",
  ])("has wording of its own for the backend's %s", (code) => {
    const error = serverError({ code, message: "Server wording" });
    const message = extractErrorMessage(error, t);

    expect(message).not.toBe(t("errors.unknown"));
    expect(message).not.toBe("Server wording");
  });

  it("never shows the server's own text for an error without a code", () => {
    const error = serverError({
      message: "price must not be less than 200",
      error: "Bad Request",
    });

    expect(extractErrorMessage(error, t)).toBe(
      "Something went wrong. Please try again.",
    );
  });

  it("keeps the server's text for the logs instead", () => {
    const error = serverError({ message: "price must not be less than 200" });

    extractErrorMessage(error, t);

    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "api.error",
        message: "price must not be less than 200",
        data: { status: 400 },
      }),
    );
  });

  it("falls back to the generic text for a code with no translation", () => {
    const error = serverError({
      code: "job.somethingNew",
      message: "Something new",
    });

    expect(extractErrorMessage(error, t)).toBe(
      "Something went wrong. Please try again.",
    );
  });

  it("uses the caller's fallback when it has a more specific one", () => {
    const error = serverError({ message: "Internal server error" }, 500);

    expect(extractErrorMessage(error, t, "profile.deleteFailed")).toBe(
      i18n.t("profile.deleteFailed"),
    );
  });

  it("does not leak a transport error's text either", () => {
    const error = {
      status: "FETCH_ERROR",
      error: "TypeError: Network request failed",
    };

    expect(extractErrorMessage(error, t)).toBe(
      "Something went wrong. Please try again.",
    );
  });

  it("speaks the active language", async () => {
    await i18n.changeLanguage("cs");
    try {
      expect(
        extractErrorMessage(serverError({ message: "Bad Request" }), t),
      ).toBe(i18n.t("errors.unknown"));
      expect(i18n.t("errors.unknown")).not.toBe(
        "Something went wrong. Please try again.",
      );
    } finally {
      await i18n.changeLanguage("en");
    }
  });
});
