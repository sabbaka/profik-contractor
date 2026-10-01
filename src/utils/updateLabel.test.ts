import { runningUpdateId } from "./updateLabel";

const OTA_ID = "f9abcd76-1c2e-4b5a-9d3f-0a1b2c3d4e5f";

/**
 * The profile footer names the update a phone is running, so testers and
 * support can tell whether an over-the-air update has arrived without guessing
 * from behaviour. Only a launch from a downloaded update has one to name.
 */
describe("runningUpdateId", () => {
  it("names a downloaded update by the first eight characters of its id", () => {
    expect(
      runningUpdateId({
        isEnabled: true,
        isEmbeddedLaunch: false,
        updateId: OTA_ID,
      }),
    ).toBe("f9abcd76");
  });

  // The bundle shipped inside the binary has an id too, but it is not an
  // update anyone published; the store version already says which it is.
  it("names nothing for the bundle that shipped with the build", () => {
    expect(
      runningUpdateId({
        isEnabled: true,
        isEmbeddedLaunch: true,
        updateId: OTA_ID,
      }),
    ).toBeNull();
  });

  // Dev builds and Expo Go load from Metro with updates switched off.
  it("names nothing when updates are switched off", () => {
    expect(
      runningUpdateId({
        isEnabled: false,
        isEmbeddedLaunch: false,
        updateId: OTA_ID,
      }),
    ).toBeNull();
  });

  it("names nothing when there is no id to name", () => {
    expect(
      runningUpdateId({
        isEnabled: true,
        isEmbeddedLaunch: false,
        updateId: null,
      }),
    ).toBeNull();
  });
});
