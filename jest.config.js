const expoPreset = require("jest-expo/jest-preset");

/**
 * Redux Toolkit and immer publish ESM that jest cannot parse untransformed.
 *
 * jest-expo's first ignore pattern is a negative lookahead listing the packages
 * that *must* be transformed, so these are spliced into that list rather than
 * appended as another pattern — appending would ignore more, not less. Derived
 * from the preset instead of copied out of it so an SDK bump cannot silently
 * drop half the list.
 */
const ESM_PACKAGES = [
  "immer",
  "@reduxjs/toolkit",
  "redux",
  "reselect",
  "react-redux",
  "use-sync-external-store",
];
const NEGATIVE_LOOKAHEAD = "/node_modules/(?!(";

/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  // Mirrors the single alias in tsconfig.json.
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  // npm hoists expo-modules-core to the top level in one app and leaves it
  // nested under expo in the other, and jest-expo's own setup requires it by
  // bare name. The fallback costs nothing where it is already hoisted, and
  // keeps this file identical between the two apps.
  moduleDirectories: ["node_modules", "node_modules/expo/node_modules"],
  transformIgnorePatterns: expoPreset.transformIgnorePatterns.map((pattern) =>
    pattern.startsWith(NEGATIVE_LOOKAHEAD)
      ? pattern.replace(
          NEGATIVE_LOOKAHEAD,
          `${NEGATIVE_LOOKAHEAD}${ESM_PACKAGES.join("|")}|`,
        )
      : pattern,
  ),
  // Screens are deliberately out of scope — these tests cover logic, so nothing
  // here renders Tamagui or reanimated.
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
};
