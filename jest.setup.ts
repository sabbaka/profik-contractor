/**
 * Global test setup. The mock surface is small on purpose: the code under test
 * is logic and hooks, never screens, so Tamagui, reanimated and the navigator
 * itself never enter the module graph.
 */

// profikApi reads EXPO_PUBLIC_API_URL at module load and hands it to
// fetchBaseQuery as the base URL. Expo injects it from .env at bundle time;
// under jest nothing does, and a relative URL fails to parse before any
// assertion is reached.
process.env.EXPO_PUBLIC_API_URL = "https://api.test.invalid";

// src/utils/logger.ts imports Sentry at module load, so anything that logs pulls
// the native SDK in. Tests assert on the logger's own behaviour, not on Sentry.
jest.mock("@sentry/react-native", () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  init: jest.fn(),
  wrap: (component: unknown) => component,
}));

// Hooks navigate through the imperative `router`, which is what tests assert on.
jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({})),
  useSegments: jest.fn(() => []),
  usePathname: jest.fn(() => "/"),
}));

// Persisted flags and the stored language sit behind AsyncStorage, which needs
// its native module. The package ships an official mock for exactly this.
jest.mock(
  "@react-native-async-storage/async-storage",
  () =>
    require("@react-native-async-storage/async-storage/jest/async-storage-mock") as unknown,
);

// uploadAvatar attaches a local file as an expo-file-system `File`, which
// implements the Blob interface natively. Node's FormData rejects anything that
// is not a real Blob, so the mock is one — the test is about what happens to
// the cache after the upload, not about how the bytes are read.
jest.mock("expo-file-system", () => ({
  File: class extends Blob {
    constructor(_uri: string) {
      super([]);
    }
  },
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageCode: "en" }]),
}));

beforeEach(() => {
  jest.clearAllMocks();
});
