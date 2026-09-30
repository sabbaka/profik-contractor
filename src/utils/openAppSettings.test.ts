import { Alert, Linking } from "react-native";
import { logError } from "./logger";
import { openAppSettings } from "./openAppSettings";

jest.mock("./logger", () => ({ logError: jest.fn() }));

const t = (key: string) => key;

describe("openAppSettings", () => {
  let openSettings: jest.SpyInstance;
  let alert: jest.SpyInstance;

  beforeEach(() => {
    openSettings = jest.spyOn(Linking, "openSettings");
    alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    jest.mocked(logError).mockClear();
  });

  afterEach(() => {
    openSettings.mockRestore();
    alert.mockRestore();
  });

  it("opens the app's page in the phone's Settings", async () => {
    openSettings.mockResolvedValue(undefined);

    await expect(openAppSettings(t)).resolves.toBe(true);
    expect(alert).not.toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
  });

  // PROFIK-1: iOS sometimes refuses, and the tap used to do nothing at all
  // while the rejection went unhandled.
  it("tells the person where to go when the system will not open Settings", async () => {
    const refusal = new Error("Unable to open app settings");
    openSettings.mockRejectedValue(refusal);

    await expect(openAppSettings(t)).resolves.toBe(false);
    expect(alert).toHaveBeenCalledWith(
      "common.error",
      "profile.settingsUnavailable",
    );
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith(refusal, "settings:open");
  });
});
