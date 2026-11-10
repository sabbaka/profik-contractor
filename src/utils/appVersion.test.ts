import { appBuildHeader, isBelowMinimum } from "./appVersion";

describe("isBelowMinimum", () => {
  it.each([
    ["1.1.32", "1.1.33"],
    ["1.0.99", "1.1.0"],
    ["0.9.9", "1.0.0"],
    // As text "1.1.9" sorts after "1.1.10"; as numbers it is older.
    ["1.1.9", "1.1.10"],
  ])("%s is below %s", (current, minimum) => {
    expect(isBelowMinimum(current, minimum)).toBe(true);
  });

  it.each([
    ["1.1.33", "1.1.33"],
    ["1.1.34", "1.1.33"],
    ["1.1.10", "1.1.9"],
    ["2.0.0", "1.9.9"],
  ])("%s is not below %s", (current, minimum) => {
    expect(isBelowMinimum(current, minimum)).toBe(false);
  });

  // "Yes" swaps the whole app for one screen, so every doubt is a "no".
  it.each([
    [null, "1.1.33"],
    [undefined, "1.1.33"],
    ["1.1.32", null],
    ["1.1.32", undefined],
    ["1.1.32", ""],
    ["1.1.32", "latest"],
    ["1.1.32", "1.2"],
    ["1.1.32", "v1.1.33"],
    ["1.1", "1.1.33"],
    ["1.1.32-beta", "1.1.33"],
  ])("does not block %p against %p", (current, minimum) => {
    expect(isBelowMinimum(current, minimum)).toBe(false);
  });
});

describe("appBuildHeader", () => {
  it("names the app, version and platform", () => {
    expect(
      appBuildHeader({ app: "client", version: "1.1.33", platform: "ios" }),
    ).toBe("client/1.1.33/ios");
  });

  it("adds the running update's id", () => {
    expect(
      appBuildHeader({
        app: "contractor",
        version: "1.1.16",
        platform: "android",
        updateId: "e36a5f68",
      }),
    ).toBe("contractor/1.1.16/android/e36a5f68");
  });

  it("is absent when the build cannot name its version", () => {
    expect(
      appBuildHeader({ app: "client", version: null, platform: "web" }),
    ).toBeNull();
    expect(
      appBuildHeader({ app: "client", version: "dev", platform: "ios" }),
    ).toBeNull();
  });
});
