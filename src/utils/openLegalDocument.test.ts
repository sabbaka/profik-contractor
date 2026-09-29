import * as Sentry from "@sentry/react-native";
import * as WebBrowser from "expo-web-browser";
import { Linking } from "react-native";
import { logError } from "./logger";
import { openLegalDocument } from "./openLegalDocument";

jest.mock("expo-web-browser", () => ({ openBrowserAsync: jest.fn() }));
jest.mock("./logger", () => ({ logError: jest.fn() }));

const URL = "https://profik.app/obchodni-podminky";

describe("openLegalDocument", () => {
  let openURL: jest.SpyInstance;
  const openBrowser = WebBrowser.openBrowserAsync as jest.Mock;

  beforeEach(() => {
    openURL = jest.spyOn(Linking, "openURL");
  });

  afterEach(() => openURL.mockRestore());

  it("opens the document in the phone's browser", async () => {
    openURL.mockResolvedValue(true);

    await expect(openLegalDocument(URL)).resolves.toBe(true);
    expect(openBrowser).not.toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  // PROFIK-D: on iOS 27 `openURL` refused an https link to the Terms. Handing
  // the link to another app is not the only way to show it — the in-app
  // browser can, and the person still reads the document.
  it("falls back to the in-app browser when the system will not open the link", async () => {
    openURL.mockRejectedValue(new Error(`Unable to open URL: ${URL}`));
    openBrowser.mockResolvedValue({ type: "opened" });

    await expect(openLegalDocument(URL)).resolves.toBe(true);
    expect(openBrowser).toHaveBeenCalledWith(URL);
    expect(logError).not.toHaveBeenCalled();
    // Not an error — the person read the document — but the cause of the
    // refusal is still unknown, so it is worth knowing when it happens again.
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "legal:openDocument fell back to the in-app browser",
      {
        level: "warning",
        extra: { url: URL, reason: `Unable to open URL: ${URL}` },
      },
    );
  });

  it("reports and answers false only when neither way works", async () => {
    const browserError = new Error("no browser");
    openURL.mockRejectedValue(new Error(`Unable to open URL: ${URL}`));
    openBrowser.mockRejectedValue(browserError);

    await expect(openLegalDocument(URL)).resolves.toBe(false);
    expect(logError).toHaveBeenCalledWith(browserError, "legal:openDocument", {
      url: URL,
      openURLError: `Unable to open URL: ${URL}`,
    });
  });
});
