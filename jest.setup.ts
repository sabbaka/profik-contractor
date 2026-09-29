/**
 * Global test setup. Screens render through `src/test-utils/renderWithProviders`
 * with a real store, so Tamagui is in the module graph; what is mocked here is
 * native code jest cannot run, the navigator (tests assert on `router` calls
 * instead), and the one route by which reanimated would get in. Keep it to
 * that — a mock added for convenience is a behaviour no test exercises.
 */

// profikApi reads EXPO_PUBLIC_API_URL at module load and hands it to
// fetchBaseQuery as the base URL. Expo injects it from .env at bundle time;
// under jest nothing does, and a relative URL fails to parse before any
// assertion is reached.
process.env.EXPO_PUBLIC_API_URL = "https://api.test.invalid";

// src/utils/logger.ts imports Sentry at module load, so anything that logs pulls
// the native SDK in. Tests assert on the logger's own behaviour, not on Sentry.
jest.mock("@sentry/react-native", () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  init: jest.fn(),
  wrap: (component: unknown) => component,
}));

// Hooks navigate through the imperative `router`, which is what tests assert on.
// There is no navigator under a rendered screen, so `useFocusEffect` runs as a
// plain effect: the screen counts as focused for as long as it is mounted.
jest.mock("expo-router", () => {
  const router = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  };
  return {
    router,
    // The same object, so a test asserts on `router` whichever way the
    // component reached it.
    useRouter: () => router,
    useLocalSearchParams: jest.fn(() => ({})),
    useSegments: jest.fn(() => []),
    usePathname: jest.fn(() => "/"),
    // Re-runs when the callback's identity changes, as the real one does.
    useFocusEffect: jest.fn((effect: () => void | (() => void)) =>
      require("react").useEffect(effect, [effect]),
    ),
  };
});

// tamagui.config.ts drives animations through @tamagui/animations-moti, which
// imports moti and with it reanimated — a native worklet runtime jest cannot
// start. The react-native driver takes the same createAnimations presets on
// the plain Animated API, so screens render unchanged; how an animation feels
// is not something a jest test can assert anyway.
jest.mock("@tamagui/animations-moti", () =>
  require("@tamagui/animations-react-native"),
);

// src/utils/analytics.ts imports the PostHog SDK at module load, and the SDK
// reaches for native modules on import. Without a key the app never constructs
// a client, so the mock only has to exist.
jest.mock("posthog-react-native", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    capture: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
  })),
}));

// Screens use its KeyboardAvoidingView, KeyboardStickyView and
// useKeyboardState, all native. The package ships an official mock that
// renders them as plain views with the keyboard down.
jest.mock(
  "react-native-keyboard-controller",
  () => require("react-native-keyboard-controller/jest") as unknown,
);

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
