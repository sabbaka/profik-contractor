import { isTestFlightInstall, type InstallProbe } from "./testFlightInstall";

const DOCUMENTS =
  "file:///var/mobile/Containers/Data/Application/D1/Documents/";
const BUNDLE = "file:///var/containers/Bundle/Application/B1/ProfikPro.app/";

const install = (
  files: string[],
  os: "ios" | "android" = "ios",
): InstallProbe => ({
  os,
  documentUri: DOCUMENTS,
  bundleUri: BUNDLE,
  exists: (uri) => files.includes(uri),
});

describe("isTestFlightInstall", () => {
  it("is true for a sandbox receipt beside Documents", () => {
    expect(
      isTestFlightInstall(
        install([
          "file:///var/mobile/Containers/Data/Application/D1/StoreKit/sandboxReceipt",
        ]),
      ),
    ).toBe(true);
  });

  it("is true for a sandbox receipt beside the app bundle", () => {
    expect(
      isTestFlightInstall(
        install([
          "file:///var/containers/Bundle/Application/B1/StoreKit/sandboxReceipt",
        ]),
      ),
    ).toBe(true);
  });

  it("is false for an App Store install, whose receipt has another name", () => {
    expect(
      isTestFlightInstall(
        install([
          "file:///var/mobile/Containers/Data/Application/D1/StoreKit/receipt",
        ]),
      ),
    ).toBe(false);
  });

  it("is false for the App Store build installed over a TestFlight one, whose old receipt stayed", () => {
    expect(
      isTestFlightInstall(
        install([
          "file:///var/mobile/Containers/Data/Application/D1/StoreKit/sandboxReceipt",
          "file:///var/mobile/Containers/Data/Application/D1/StoreKit/receipt",
        ]),
      ),
    ).toBe(false);
  });

  it("is false for a build installed from Xcode, which carries a provisioning profile", () => {
    expect(
      isTestFlightInstall(
        install([
          "file:///var/mobile/Containers/Data/Application/D1/StoreKit/sandboxReceipt",
          `${BUNDLE}embedded.mobileprovision`,
        ]),
      ),
    ).toBe(false);
  });

  it("is false on Android whatever is on disk", () => {
    expect(
      isTestFlightInstall(
        install(
          [
            "file:///var/mobile/Containers/Data/Application/D1/StoreKit/sandboxReceipt",
          ],
          "android",
        ),
      ),
    ).toBe(false);
  });

  it("is false, not a crash, when the device paths cannot be read", () => {
    // jest.setup's expo-file-system mock has no `Paths` — like a platform
    // where the module is missing.
    jest.replaceProperty(require("react-native").Platform, "OS", "ios");
    expect(isTestFlightInstall()).toBe(false);
  });

  it("is false when the file system cannot be asked", () => {
    expect(
      isTestFlightInstall({
        ...install([]),
        exists: () => {
          throw new Error("no access");
        },
      }),
    ).toBe(false);
  });
});
